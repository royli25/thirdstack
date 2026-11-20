import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../server/database";
import { verifyMigrations } from "../server/migration";

const dir = new URL("../supabase/migrations/", import.meta.url);
async function installedMigrations() {
  return await Promise.all(
    (await readdir(dir))
      .filter((name) => /^\d+_[a-z_]+\.sql$/.test(name))
      .map(async (name) => ({
        name,
        digest: createHash("sha256")
          .update(await readFile(new URL(name, dir), "utf8"))
          .digest("hex"),
      })),
  );
}
function database(query: ReturnType<typeof vi.fn>) {
  return { pool: { query } } as unknown as PostgresDatabase;
}

// Regression: a merged seller release served customer pages before its hosted
// migration existed, so the catalog failed with missing seller_listings (42P01).
describe("release schema readiness", () => {
  it("rejects the pre-seller schema with the exact missing migration and recovery command", async () => {
    const rows = (await installedMigrations()).filter(
      (row) => row.name !== "20261112210000_seller_tools.sql",
    );
    const query = vi.fn().mockResolvedValue({ rows });
    await expect(verifyMigrations(database(query))).rejects.toThrow(
      /20261112210000_seller_tools.sql.*npm run db:migrate/,
    );
    expect(query).toHaveBeenCalledExactlyOnceWith(
      "SELECT name,digest FROM octolab_migrations.versions",
    );
  });

  it("accepts a fully installed schema without writing to it", async () => {
    const query = vi
      .fn()
      .mockResolvedValue({ rows: await installedMigrations() });
    await expect(verifyMigrations(database(query))).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledExactlyOnceWith(
      "SELECT name,digest FROM octolab_migrations.versions",
    );
  });

  it("rejects changed installed migrations", async () => {
    const rows = await installedMigrations();
    rows[0].digest = "wrong-checksum";
    const query = vi.fn().mockResolvedValue({ rows });
    await expect(verifyMigrations(database(query))).rejects.toThrow(
      "An applied migration was changed",
    );
  });

  it("gives an actionable failure when the migration ledger does not exist", async () => {
    const query = vi.fn().mockRejectedValue({ code: "42P01" });
    await expect(verifyMigrations(database(query))).rejects.toThrow(
      /schema migrations are not installed.*npm run db:migrate/,
    );
  });

  it("does not disguise a connection failure as a missing migration", async () => {
    const failure = new Error("connection closed");
    const query = vi.fn().mockRejectedValue(failure);
    await expect(verifyMigrations(database(query))).rejects.toBe(failure);
  });
});
