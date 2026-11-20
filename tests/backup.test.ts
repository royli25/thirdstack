import { expect, it } from "vitest";
import { backupDatabase, restoreDatabase } from "../server/backup";
import { runRestoreDrill } from "./fixtures/restore-drill";
it("refuses implicit or malformed recovery targets without revealing connection credentials", async () => {
  await expect(
    backupDatabase(
      "https://SECRET@invalid",
      "/unused",
      "long-enough-fixture-passphrase",
    ),
  ).rejects.toThrow("explicit private PostgreSQL");
  await expect(
    restoreDatabase(
      "postgresql://fixture:SECRET@127.0.0.1/fresh_database",
      "/unused",
      "long-enough-fixture-passphrase",
      "different_database",
    ),
  ).rejects.toThrow("Confirm the exact fresh destination");
});
const url = process.env.OCTOLAB_RESTORE_DRILL_URL;
(url ? it : it.skip)(
  "restores an authenticated encrypted snapshot with matching records, audit chains, ledgers and isolated workspaces",
  async () => {
    const report = await runRestoreDrill(url!);
    expect(report).toMatchObject({
      backupEncrypted: true,
      authenticatedBeforeRestore: true,
      wrongPassphraseRejected: true,
      corruptionRejected: true,
      populatedDestinationRejected: true,
      activeRuntimeRejected: true,
      rowDigestsMatch: true,
      auditChainsValid: true,
      financialBalancesMatch: true,
      workspaceIsolationPassed: true,
      allowancesPreserved: true,
      allowancePermissionsPreserved: true,
      allowanceAuditPreserved: true,
      interruptedReservationsSettledOnce: true,
      receiptReplaysNotCharged: true,
    });
  },
  60000,
);
