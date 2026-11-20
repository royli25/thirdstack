import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, mkdir, mkdtemp, open, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { PoolClient } from "pg";
import { PostgresDatabase } from "./database.js";
import { claimRuntime } from "./migration.js";
import { digest } from "./observation-store.js";
import {
  beginBackupSnapshot,
  databaseSnapshot,
  type DatabaseSnapshot,
} from "./backup-evidence.js";

const MAGIC = Buffer.from("OCTOLAB-BK1\n"),
  SALT_BYTES = 32,
  IV_BYTES = 12,
  TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + SALT_BYTES + IV_BYTES;
export class BackupError extends Error {}
export interface BackupManifest {
  version: "octolab-encrypted-postgres-v1";
  capturedAt: string;
  serverMajor: number;
  snapshot: DatabaseSnapshot;
  scope:
    | "octolab application and migration history; Auth identities and object storage excluded"
    | "octolab application and migration history; Auth identities, managed Vault secrets and object storage excluded";
}
function parseConnection(raw: string) {
  try {
    const url = new URL(raw);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      url.hash ||
      !url.hostname
    )
      throw new Error();
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!/^[A-Za-z0-9_]{1,63}$/.test(database)) throw new Error();
    return { url, database };
  } catch {
    throw new BackupError(
      "Use an explicit private PostgreSQL connection URL with a simple database name.",
    );
  }
}
function toolEnvironment(raw: string): NodeJS.ProcessEnv {
  const { url, database } = parseConnection(raw);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: "C",
    LC_ALL: "C",
    PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: url.port || "5432",
    PGDATABASE: database,
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: local ? "disable" : "verify-full",
    ...(process.env.PGSSLROOTCERT
      ? { PGSSLROOTCERT: process.env.PGSSLROOTCERT }
      : {}),
    PGCONNECT_TIMEOUT: "10",
  };
}
function encryptionKey(passphrase: string, salt: Buffer) {
  if (passphrase.length < 24 || passphrase.length > 1024)
    throw new BackupError(
      "Set a separate backup passphrase of 24–1,024 characters.",
    );
  return scryptSync(passphrase, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}
function runTool(
  tool: "pg_dump" | "pg_restore",
  args: string[],
  connection: string,
) {
  const child = spawn(tool, args, {
    env: toolEnvironment(connection),
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.on("data", () => {});
  const done = new Promise<void>((resolve, reject) => {
    child.once("error", () =>
      reject(
        new BackupError(
          `${tool} could not start. Install compatible PostgreSQL tools or use the recovery image.`,
        ),
      ),
    );
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new BackupError(
              `${tool} failed. No successful backup or restore is claimed.`,
            ),
          ),
    );
  });
  return { child, done };
}
async function fileHash(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
function assertEvidence(snapshot: DatabaseSnapshot) {
  if (
    !snapshot.audit.valid ||
    !snapshot.keyLedgerValid ||
    snapshot.allowanceLedgerValid === false ||
    snapshot.shadowWalletValid === false ||
    snapshot.walletValid === false
  )
    throw new BackupError(
      "Audit or financial consistency checks failed. Investigate before claiming a recoverable backup.",
    );
}
export async function backupDatabase(
  connection: string,
  output: string,
  passphrase: string,
) {
  parseConnection(connection);
  encryptionKey(passphrase, randomBytes(SALT_BYTES));
  const database = new PostgresDatabase(connection, () => "");
  let release: (() => Promise<void>) | undefined,
    created = false,
    client: PoolClient | undefined;
  try {
    client = await database.pool.connect();
    try {
      release = await claimRuntime(database);
    } catch {
      throw new BackupError(
        "Stop the source runtime or maintenance process before making an offline application backup.",
      );
    }
    await beginBackupSnapshot(client);
    const snapshotId = String(
      (await client.query("SELECT pg_export_snapshot() AS id")).rows[0].id,
    );
    const manifest: BackupManifest = {
      version: "octolab-encrypted-postgres-v1",
      capturedAt: new Date().toISOString(),
      serverMajor: Math.floor(
        Number(
          (await client.query("SHOW server_version_num")).rows[0]
            .server_version_num,
        ) / 10000,
      ),
      snapshot: await databaseSnapshot(client),
      scope:
        "octolab application and migration history; Auth identities, managed Vault secrets and object storage excluded",
    };
    assertEvidence(manifest.snapshot);
    const salt = randomBytes(SALT_BYTES),
      iv = randomBytes(IV_BYTES),
      header = Buffer.concat([MAGIC, salt, iv]);
    const cipher = createCipheriv(
      "aes-256-gcm",
      encryptionKey(passphrase, salt),
      iv,
    );
    cipher.setAAD(header);
    await mkdir(dirname(output), { recursive: true, mode: 0o700 });
    if (((await stat(dirname(output))).mode & 0o022) !== 0)
      throw new BackupError(
        "The backup directory must not be writable by other users.",
      );
    const handle = await open(output, "wx", 0o600);
    created = true;
    await handle.close();
    await appendFile(output, header);
    const metadata = Buffer.from(JSON.stringify(manifest)),
      length = Buffer.alloc(4);
    length.writeUInt32BE(metadata.length);
    const { child, done } = runTool(
      "pg_dump",
      [
        "--format=custom",
        "--no-password",
        "--no-owner",
        "--no-tablespaces",
        "--schema=octolab",
        "--schema=octolab_migrations",
        `--snapshot=${snapshotId}`,
      ],
      connection,
    );
    child.stdin.end();
    try {
      await Promise.all([
        pipeline(
          Readable.from(
            (async function* () {
              yield length;
              yield metadata;
              for await (const chunk of child.stdout) yield chunk;
            })(),
          ),
          cipher,
          createWriteStream(output, { flags: "a" }),
        ),
        done,
      ]);
    } catch (error) {
      child.kill("SIGTERM");
      throw error;
    }
    await appendFile(output, cipher.getAuthTag());
    const saved = await open(output, "r+");
    await saved.sync();
    await saved.close();
    await client.query("COMMIT");
    return {
      version: manifest.version,
      capturedAt: manifest.capturedAt,
      encryptedSha256: await fileHash(output),
      bytes: (await stat(output)).size,
      tables: manifest.snapshot.tables.map(({ schema, table, rows }) => ({
        schema,
        table,
        rows,
      })),
      audit: manifest.snapshot.audit,
      keyLedgerValid: manifest.snapshot.keyLedgerValid,
      allowanceLedgerValid: manifest.snapshot.allowanceLedgerValid,
      shadowWalletValid: manifest.snapshot.shadowWalletValid,
      walletValid: manifest.snapshot.walletValid,
    };
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => {});
    if (created) await rm(output, { force: true });
    if (error instanceof BackupError) throw error;
    throw new BackupError(
      "Backup failed. No successful artifact is claimed; private connection details were omitted.",
    );
  } finally {
    client?.release();
    await release?.();
    await database.close();
  }
}
async function decryptBackup(
  input: string,
  plaintext: string,
  passphrase: string,
) {
  const file = await open(input, "r"),
    info = await file.stat();
  try {
    if (info.size < HEADER_BYTES + TAG_BYTES + 4) throw new Error();
    const header = Buffer.alloc(HEADER_BYTES),
      tag = Buffer.alloc(TAG_BYTES);
    await file.read(header, 0, header.length, 0);
    await file.read(tag, 0, tag.length, info.size - TAG_BYTES);
    if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(
        passphrase,
        header.subarray(MAGIC.length, MAGIC.length + SALT_BYTES),
      ),
      header.subarray(MAGIC.length + SALT_BYTES),
    );
    decipher.setAAD(header);
    decipher.setAuthTag(tag);
    // Authenticate the entire payload before pg_restore can execute any SQL.
    await pipeline(
      createReadStream(input, {
        fd: file.fd,
        autoClose: false,
        start: HEADER_BYTES,
        end: info.size - TAG_BYTES - 1,
      }),
      decipher,
      createWriteStream(plaintext, { flags: "wx", mode: 0o600 }),
    );
  } catch {
    throw new BackupError(
      "Backup authentication failed. Check the passphrase and artifact integrity; no restore was attempted.",
    );
  } finally {
    await file.close();
  }
  const payload = await open(plaintext, "r");
  try {
    const length = Buffer.alloc(4);
    await payload.read(length, 0, 4, 0);
    const size = length.readUInt32BE();
    if (size < 1 || size > 1_000_000) throw new Error();
    const metadata = Buffer.alloc(size),
      read = await payload.read(metadata, 0, size, 4);
    if (read.bytesRead !== size) throw new Error();
    const manifest = JSON.parse(metadata.toString()) as BackupManifest;
    if (
      manifest.version !== "octolab-encrypted-postgres-v1" ||
      !Array.isArray(manifest.snapshot?.tables)
    )
      throw new Error();
    return { manifest, offset: 4 + size };
  } catch {
    throw new BackupError(
      "The authenticated backup has an unsupported manifest.",
    );
  } finally {
    await payload.close();
  }
}
export async function restoreDatabase(
  connection: string,
  input: string,
  passphrase: string,
  confirmDatabase: string,
) {
  const parsed = parseConnection(connection);
  if (confirmDatabase !== parsed.database)
    throw new BackupError(
      "Confirm the exact fresh destination database name before restoring.",
    );
  const directory = await mkdtemp(join(tmpdir(), "octolab-recovery-")),
    plaintext = join(directory, "authenticated-payload");
  let database: PostgresDatabase | undefined;
  let release: (() => Promise<void>) | undefined;
  try {
    const { manifest, offset } = await decryptBackup(
      input,
      plaintext,
      passphrase,
    );
    database = new PostgresDatabase(connection, () => "");
    release = await claimRuntime(database);
    const client = await database.pool.connect();
    try {
      const targetMajor = Math.floor(
        Number(
          (await client.query("SHOW server_version_num")).rows[0]
            .server_version_num,
        ) / 10000,
      );
      if (targetMajor < manifest.serverMajor)
        throw new BackupError(
          "Restore requires the same or a newer PostgreSQL major version.",
        );
      const existing = await client.query(
        "SELECT 1 FROM pg_namespace WHERE nspname IN ('octolab','octolab_migrations') LIMIT 1",
      );
      if (existing.rowCount)
        throw new BackupError(
          "The destination already contains octolab data. Restore requires a fresh destination; nothing was replaced.",
        );
      await client.query(
        "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='octolab_runtime') THEN CREATE ROLE octolab_runtime NOLOGIN NOBYPASSRLS; END IF; END $$",
      );
      const role = (
        await client.query(
          "SELECT rolsuper,rolbypassrls,rolcanlogin,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname='octolab_runtime'",
        )
      ).rows[0];
      if (!role || Object.values(role).some(Boolean))
        throw new BackupError(
          "The destination runtime role is unsafe. No application data was restored.",
        );
      await client.query("GRANT octolab_runtime TO CURRENT_USER");
    } finally {
      client.release();
    }
    const { child, done } = runTool(
      "pg_restore",
      [
        "--no-password",
        "--dbname",
        parsed.database,
        "--single-transaction",
        "--exit-on-error",
        "--no-owner",
        "--no-tablespaces",
      ],
      connection,
    );
    child.stdout.resume();
    try {
      await Promise.all([
        pipeline(createReadStream(plaintext, { start: offset }), child.stdin),
        done,
      ]);
    } catch (error) {
      child.kill("SIGTERM");
      throw error;
    }
    const verification = await database.pool.connect();
    let snapshot: DatabaseSnapshot;
    try {
      await beginBackupSnapshot(verification);
      snapshot = await databaseSnapshot(verification);
      assertEvidence(snapshot);
      await verification.query("COMMIT");
    } catch (error) {
      await verification.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      verification.release();
    }
    if (digest(snapshot) !== digest(manifest.snapshot))
      throw new BackupError(
        "Restore completed but verification differs. Do not start the application on this destination.",
      );
    return {
      version: manifest.version,
      capturedAt: manifest.capturedAt,
      restoredAt: new Date().toISOString(),
      verified: true,
      tables: snapshot.tables.map(({ schema, table, rows }) => ({
        schema,
        table,
        rows,
      })),
      audit: snapshot.audit,
      keyLedgerValid: snapshot.keyLedgerValid,
      allowanceLedgerValid: snapshot.allowanceLedgerValid,
      shadowWalletValid: snapshot.shadowWalletValid,
      walletValid: snapshot.walletValid,
      ledgerGroupsVerified: snapshot.ledger.length,
    };
  } catch (error) {
    if (error instanceof BackupError) throw error;
    throw new BackupError(
      "Restore failed. No successful recovery is claimed; private connection details were omitted.",
    );
  } finally {
    try {
      await release?.();
    } finally {
      try {
        await database?.close();
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
  }
}
