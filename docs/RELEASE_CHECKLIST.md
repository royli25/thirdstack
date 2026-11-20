# Release and recovery checklist

This is a release preparation guide. It does not mean a website has been deployed, that live provider keys were checked, or that customer data has moved.

## What the release contains

The application image includes the browser app, server, production dependencies and all database migration files. Its file inventory records checksums and the source revision supplied by CI. `npm run verify:release` rejects missing or changed packaged assets. A separate recovery image contains PostgreSQL backup tools and the encrypted backup/restore commands. Test adapters, local data, credentials and research notes do not enter either runtime image.

The existing CI checks are extended with required PostgreSQL/account/isolation checks, a disposable encrypted restore drill, and production-image migration/startup/restart/restore checks. A configured workflow is not proof that it passed: use the actual check-run result for the exact release revision. Successful container runs save deployable application/recovery images as a private CI artifact; no image registry or hosting provider is published to automatically.

## Before choosing hosting

The host must support:

- One continuously running Linux container, with graceful shutdown and an HTTPS origin. The app's database ownership lock currently permits one API instance per database.
- Requests lasting at least 150 seconds and streaming connections without buffering or early proxy timeouts.
- Outbound HTTPS to the configured providers and Auth service, and a TLS-verified PostgreSQL direct connection or session pooler. Transaction pooling is unsuitable for the runtime ownership lock.
- Private environment variables, optional read-only CA certificate mounts, health checks, application logs and recoverable storage for encrypted backups.
- A domain and HTTPS routing that preserve `/api`, browser routes and agent connections. Update the Auth confirmation/recovery redirects to the final origin and test actual email delivery.

Keep hosted database connections within the selected pooler limit. The current hosted limit is 15 connections and the API pool can use 10; avoid parallel maintenance commands or extra application pools while it runs. Stop the API for the offline migration/backup steps below, run one maintenance action at a time, and close each connection before the next. Disposable CI recovery tests use their own local database and do not consume hosted connections.

These requirements work with an OCI/container host or a managed Linux server using the supplied Compose file. Pricing, domain choice and target-host configuration remain owner decisions.

## Configuration and launch review

1. Record the exact source/image revision and its passing CI run. Keep the previous verified image available.
2. Data's owner completes the account/data cutover and confirms the intended workspace, owner and admin access. A completed migration does not prove historical data was imported.
3. Supply the private runtime configuration using [the environment template](../deploy/runtime.env.example). With Compose, copy it to the ignored `.env.runtime` file. Keep provider keys server-side; use the existing approved spending policy. Leave both deposit methods disabled.
4. Have Data stop the API and maintenance work before a migration. For Render production, use `npm run db:migrate:production` with explicitly injected settings and confirmation as described below; `npm run db:migrate` remains the generic operator command. The migration command verifies history and refuses an active database owner. Migrations now run from compiled code and require no development tools. API startup also checks every migration name and checksum before serving requests; a pending migration stops startup with the required command instead of leaving customers with a partially upgraded dashboard.
5. Start the image and require `/healthz` to pass. That endpoint verifies application/database availability, not provider health. Confirm that private routes reject missing credentials; then test the intended owner, member and company roles through the real sign-in flow.
6. Issue a scoped agent key through the workspace. Configure the agent with either the remote endpoint `https://<origin>/mcp` and the key as a bearer token, or the stdio bridge with the final HTTPS `APILAYER_URL` and its `APILAYER_API_KEY`, then verify the connection and a free discovery request. Confirm the proxy forwards `/mcp` with its MCP headers and does not time out within 150 seconds. Any paid provider check needs a separately bounded backend/operator-authorized allowance.
7. Confirm actual sign-in, logout, email confirmation, password recovery, role revocation and company boundaries on the chosen host. Verify the final domain, HTTPS proxy and Auth redirects. These checks cannot be completed before the host is chosen.

`compose.yaml` binds the service to host loopback so an HTTPS proxy can sit in front of it. It uses a read-only application filesystem, a private temporary directory and a named data volume, and allows up to 130 seconds for shutdown. Do not start a second copy against the same database or use this example to bypass Data's runtime ownership.

## Production release on Render

The checked-in `render.yaml` targets `https://twohands.tech`, one API instance, and manual deployment (`autoDeployTrigger: off`). Its attached disk makes replacement stop the old instance before starting the new one. Keep these settings while runtime ownership is exclusive; do not enable overlapping instances to work around a failed lock acquisition.

1. Select and record the exact commit/image revision. Compare it with GitHub `main` and the deployed Render revision; a local branch or a feature branch is not proof that production has that code. Require the selected revision's CI, `npm run check`, appropriate browser checks, and separate disposable PostgreSQL coverage. Test every pending migration and the needed account flows against the independent development project first.
2. Arrange a maintenance window. Confirm the backup owner, a recoverable backup, a compatible previous release, and the recovery procedure below. If using this repository's offline application backup command, stop the API before taking that backup. Do not copy production records into development as a test setup.
3. Stop the production API and maintenance processes through the hosting control plane. Confirm the instance has drained and no longer owns the runtime lock. Do not terminate PostgreSQL backends or weaken the lock to simulate a graceful stop.
4. Use the **selected release's built migration command**, in a controlled operator process with production environment values injected from the secret store. Do not run this command using the development file or a shell that silently loads `.env`:

   ```bash
   # DATABASE_URL and other private production settings are injected by the host.
   # These nonsecret values must match the intended production environment.
   STORAGE_BACKEND=postgres \
     PUBLIC_APP_URL=https://twohands.tech \
     PRODUCTION_MIGRATION_CONFIRM=twohands.tech \
     npm run db:migrate:production
   ```

   The wrapper requires the intended production database/Auth project and explicit confirmation, loads no environment file, and runs the application's migration ledger/checksum checks. A held runtime lock or migration failure stops the release. Do not put this command in an ordinary pre-deploy step that runs while the old API still owns the database. Development startup never applies production migrations.

5. Start the exact selected release with the production environment. Require `https://twohands.tech/healthz` to return `200`, check private endpoints reject anonymous access, then verify intended signed-in account/company/admin paths. Preserve provider spending boundaries; a health check makes no provider calls and is not proof of vendor health, email delivery, or Auth redirects.
6. Record the deployed revision, migration result, checks, and any observed interruption. If migration fails, investigate before starting incompatible code. Use the verified compatible-image or fresh-destination recovery procedure below; do not edit migration history or invent reverse SQL.

The migration process and production API must not overlap. `npm run db:migrate:production` does not stop Render, deploy code, or start the API; the operator owns those explicit steps. This procedure is a release contract, not evidence that a release has occurred.

## Backup ownership and retention

Before launch, name one operator and a backup owner who can recover access if the primary operator is unavailable. The owner approves the backup destination, encryption-key custody, recovery objective and retention. A practical starting policy is a daily encrypted application backup retained for 14 days, with four weekly copies in separate protected storage; this is a proposed operating policy, not an enabled schedule or recovery guarantee.

Keep the recovery passphrase in a separate secret manager/password manager, with an owner-approved recovery copy. Keep encrypted backups away from the application host. A backup is only marked successful after encryption, checksums and consistency checks finish. Monitor failed/missing backups and repeat the restore drill after a migration or backup-tool change. Do not expire the last verified recovery copy simply because a newer dump exists.

The tool below is an offline application backup: the API and maintenance process must be stopped. It supplements provider-managed database backups/PITR. It includes the private application records and migration history, including recorded evidence, test-credit ledgers and billing import history. It excludes hosted Auth identities, object storage and external provider secrets; recover those through their separately configured platform/secret-store procedures.

## Making an encrypted application backup

Use the separate recovery image for container backups, or a host build with compatible PostgreSQL clients installed. Supply these variables through a private environment/secret store, not command-line values or a committed file:

| Variable              | Meaning                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `BACKUP_DATABASE_URL` | Explicit privileged source connection. There is no automatic `DATABASE_URL` fallback.                                              |
| `BACKUP_FILE`         | New output path in a protected directory. The directory must not be writable by other users; existing files are never overwritten. |
| `BACKUP_PASSPHRASE`   | Separate generated recovery secret, 24–1,024 characters.                                                                           |
| `PGSSLROOTCERT`       | Trusted public CA file for a remote PostgreSQL backup client, where required. TLS verification stays enabled.                      |

Run `npm run db:backup`, or run the recovery image with the `backup` command and a protected backup-directory mount. It refuses an active API/maintenance owner, uses one consistent database snapshot, encrypts the manifest and dump with authenticated encryption, and prints a content-free receipt with encrypted-file checksum and verification counts. A forcibly killed command can leave an incomplete file; without a completed success receipt it is not a verified backup. Restore authentication rejects incomplete or changed files.

PostgreSQL backup clients must support the source server version. The recovery image uses PostgreSQL 18 tools. Test any older/newer managed-server combination before relying on it. The dump/restore tools receive only their PostgreSQL connection settings; raw tool errors and private source content are not printed.

## Restoring and deciding whether to resume

1. Prepare a fresh, separate destination database on the same or a newer PostgreSQL major version. Preserve the source and existing backups. This procedure does not replace an occupied app database.
2. Set `RESTORE_DATABASE_URL`, `RESTORE_CONFIRM_DATABASE` to its exact database name, `BACKUP_FILE`, and `BACKUP_PASSPHRASE` in the private operator environment. Use the matching recovery image or `npm run db:restore`.
3. The complete backup must authenticate before any restore SQL starts. Wrong passwords or changed files stop before restoring data. Recovery uses a private temporary directory, restores in one database transaction, and removes temporary plaintext afterward.
4. Require the success report: all table counts/content digests, sequence positions, runtime permissions, audit chains, key-spend totals, operator allowance totals, column permissions, access policies and financial balances must match. Do not start the app after a verification failure.
5. Start the exact release image associated with the backup against the recovered destination. Check health, missing-credential denials, workspace separation and intended account access. Recheck Auth identities, redirects and any external dependencies separately.
6. Only after review, have Data redirect the runtime to the recovered destination and retain the old source. Any post-backup writes need an explicit recovery decision. Do not quietly switch to an older SQLite file.

The CI recovery check starts the same packaged release after a fresh restore. It does not prove that an arbitrary older image can run against newer migrations. For a code rollback, use a previously verified compatible image or restore its matching backup into a separate destination first. Never edit applied migration files or run untested reverse migrations as a rollback shortcut.

## Repeating the disposable drill

`npm run test:restore` requires `OCTOLAB_RESTORE_DRILL_URL` pointing explicitly to a loopback PostgreSQL maintenance database. It creates uniquely named fixture databases, blocks external HTTP, adds two isolated workspaces with synthetic evidence/billing/test-credit history, encrypts a backup, restores into a fresh destination, checks the records and permissions, and removes only the two databases it created. It also checks wrong-password, corruption, active-runtime and occupied-destination refusals. Spending controls are granted only to these fake local workspaces through the real allowance service. The drill preserves paused access, limits, revisions, counters and change history; interrupted reservations settle conservatively once, and replaying a saved receipt repeats neither provider work nor charges. It never uses the app's `DATABASE_URL` by default.

The report is written to `test-results/restore-drill/restore-report.json`, or `RESTORE_DRILL_OUTPUT`. CI retains the content-free report. Fixture backups are not customer recovery copies. Keep local/CI drill results separate from hosted operations and live provider/payment checks.

References: [PostgreSQL SQL backups](https://www.postgresql.org/docs/current/backup-dump.html), [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).
