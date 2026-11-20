import { backupDatabase, restoreDatabase, BackupError } from "./backup.js";
try {
  const command = process.argv[2];
  if (command !== "backup" && command !== "restore") {
    console.log(
      "backup: BACKUP_DATABASE_URL, BACKUP_FILE, BACKUP_PASSPHRASE\nrestore: RESTORE_DATABASE_URL, BACKUP_FILE, BACKUP_PASSPHRASE, RESTORE_CONFIRM_DATABASE\nRestores require a fresh database and verify data, audit chains, financial balances and runtime access. Application backups exclude hosted Auth identities, managed Vault secrets and object storage.",
    );
  } else {
    const connection =
        process.env[
          command === "backup" ? "BACKUP_DATABASE_URL" : "RESTORE_DATABASE_URL"
        ],
      file = process.env.BACKUP_FILE,
      passphrase = process.env.BACKUP_PASSPHRASE;
    if (!connection || !file || !passphrase)
      throw new BackupError(
        "Set the explicit connection, backup file and backup passphrase. No application DATABASE_URL fallback is used.",
      );
    console.log(
      JSON.stringify(
        command === "backup"
          ? await backupDatabase(connection, file, passphrase)
          : await restoreDatabase(
              connection,
              file,
              passphrase,
              process.env.RESTORE_CONFIRM_DATABASE || "",
            ),
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    error instanceof BackupError
      ? error.message
      : "Recovery operation failed. Private details were omitted.",
  );
  process.exitCode = 1;
}
