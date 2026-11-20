# Development environments

As of 2026-11-17, the development project has all 16 application migrations and MCP OAuth enabled. The app supports browser sign-in for coding agents and server-side API keys for product integrations. See [OAuth setup and verification](MCP_OAUTH.md). The dated provisioning record below preserves the earlier 14-migration checkpoint.

The production app runs at [twohands.tech](https://twohands.tech). Development must use a separate Supabase project for both PostgreSQL and Auth. One API server owns each database through the existing runtime lock; separate projects let local and production run simultaneously.

This checkout was configured on 2026-11-15 with the separate **Two Hands development** project and all 14 application migrations. Its private settings are in `.env.development.local`; run `npm run dev` and open `http://127.0.0.1:5175` (API port 3009). Create a new development account: this project has its own Auth users and empty application history. Email delivery and a complete signup/login journey have not yet been verified. Provider spending and both payment methods remain disabled by the development settings.

## Set up the development project

1. Sign in to the Supabase account that owns this app. For CLI access, run `supabase login`, then `supabase orgs list` and `supabase projects list` to confirm the intended organization. Do not put access tokens or database passwords in chat or source control.
2. Create a new project named **Two Hands development** in that organization, using the Supabase dashboard's **New project** flow. Keep its generated database password in the private configuration/secret store. This creates a separate environment; it does not clone production records or Auth users. Review the project's selected compute/billing settings before creating it.

   If Supabase rejects creation because the account has reached its active free-project limit, stop before pausing another app or changing billing. Choose a local Supabase stack, explicitly pause an unneeded project, or review a paid development option. The hosted launcher below does not yet support local Supabase endpoints.

3. Copy the template and fill it with that project's settings:

   ```bash
   cp .env.development.example .env.development.local
   ```

   Set `DEVELOPMENT_SUPABASE_PROJECT_REF` to its project reference, `SUPABASE_URL` to `https://<development-ref>.supabase.co`, and `SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_…` public key. Set the server-only `DATABASE_URL` using that project's **Connect** dialog: a direct PostgreSQL endpoint or the Supabase **session pooler on port 5432**. For a pooler URL, the database user must end in `.<development-ref>`. Percent-encode special characters in the URI password. Transaction pooler port 6543 is unsupported.

4. In this development project's Auth settings, enable email/password sign-in and configure confirmation/recovery delivery. Set the Site URL to `http://127.0.0.1:5175`. Allow the exact callbacks `http://127.0.0.1:5175/?auth_callback=1` and `http://127.0.0.1:3009/?auth_callback=1` for the Vite app and built preview. Update the backend callback if you choose a different `PORT`.
5. With the development API stopped, install dependencies and apply the application's migrations:

   ```bash
   npm ci
   npm run db:migrate:dev
   npm run dev
   ```

   Open **http://127.0.0.1:5175**. Create and confirm a new development account. If administrator access is needed, add that development account's UUID to `SUPABASE_ADMIN_USER_IDS` in `.env.development.local`, then restart the development API. Production account UUIDs and permissions are not transferred.

Use `npm run db:migrate:dev` for every new checked-in application migration, including company connectors. It updates the application's checksum ledger; `supabase db push` is not a replacement for this command. Do not edit already applied migration files.

A new development project starts with empty application history. Set `LEGACY_WORKSPACE_ID` to a fresh development-only UUID generated with `node -p 'crypto.randomUUID()'`. The current backend requires this fallback namespace even without imported history; the UUID does not create or claim a customer account. Leave `LEGACY_OWNER_USER_ID` blank. Do not copy the production workspace identity or import production records or test fixtures. Automated PostgreSQL tests require their own disposable databases, separate from both development and production.

## Configuration boundaries

| Command                         | Configuration and target                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                   | Only `.env.development.local`; validated development PostgreSQL/Auth; API port 3009 and Vite port 5175 by default                             |
| `npm run db:migrate:dev`        | Same validated development file; explicit migration while its API is stopped                                                                  |
| `npm run preview:production`    | Same development file and database; builds the app, then serves frontend/API at backend port 3009 with `NODE_ENV=production`                  |
| `npm run dev:sqlite`            | Explicit isolated SQLite preview at `data/development.sqlite`; ignores environment files and has no account flows or provider/payment secrets |
| `npm start`                     | Deployment entry point; retains `.env` compatibility and inherited host configuration                                                         |
| `npm run db:migrate:production` | Explicitly injected production environment and confirmation; see [release procedure](RELEASE_CHECKLIST.md#production-release-on-render)       |

The development launcher rejects the known production Supabase project and checks that the declared development project, database endpoint/user, and Auth URL agree before starting either process. It removes inherited application credentials and prevents Vite from automatically loading `.env`, `.env.local`, or production environment files. Existing `.env` credentials are preserved for their owner; copying them into the development file is not setup.

The template disables payments, keyless extraction, and positive-estimate provider spending. Add only independent development provider credentials when deliberately needed, keep them server-side, and grant only bounded development authority. New PostgreSQL accounts still need an operator allowance before provider execution. Do not reuse production agent keys, company connector encryption keys, or payment/webhook secrets.

For a built preview, stop `npm run dev`, then run `npm run preview:production`. The launcher sets `PUBLIC_APP_URL` to the backend's loopback origin for that process. This checks production build behavior against development data; it does not deploy anything or verify production email/payment integration.

## Connect an agent to development

The existing `npm run mcp:install` installs a bridge that reads `.env`; it does not switch automatically to the development project. Retention, import, legacy `db:migrate`, and `npm start` also remain explicit operator commands. Do not use them assuming they inherit the development launcher's isolation.

For a separate development bridge, build the code, create a scoped key in the development account, and put that key in `APILAYER_API_KEY` in `.env.development.local`. Start the bridge with that file and an explicit loopback target:

```bash
APILAYER_URL=http://127.0.0.1:3009/api \
  node --env-file=.env.development.local build/mcp-stdio.js
```

A host-specific development registration can use that command and file path. Keep the production/global MCP registration unchanged, use only the development scoped key, and remove inherited `APILAYER_API_KEY` values from the launching terminal before using this manual command. This bridge command does not provide the development launcher's environment sanitization.

## Troubleshooting

- **Missing development settings:** complete `.env.development.local` with a separate project's settings. Startup intentionally fails instead of falling back to `.env`.
- **Production project or mismatched project error:** check all three development identities: `DEVELOPMENT_SUPABASE_PROJECT_REF`, database endpoint/user, and `SUPABASE_URL`. Changing only `PORT` or the browser address does not isolate the database.
- **Another server owns the database:** stop only the API you own for that development project before migrating or restarting. An idle database connection can be the production server's live ownership connection. Do not terminate it, remove the advisory lock, or change the lock name to make local startup succeed.
- **Schema behind this release:** stop the development API, run `npm run db:migrate:dev`, and restart. A migration required only by local code is not a reason to migrate production.
- **Port 5175 already in use:** reuse or stop the existing development frontend after confirming its checkout. Vite deliberately does not choose another port.
- **Authentication redirect fails:** use the same loopback hostname in the browser, Site URL, and allowed redirects. The built preview uses backend port 3009 instead of Vite port 5175.

See [Supabase environment management](https://supabase.com/docs/guides/deployment/managing-environments) for separate projects and local stacks. A local Supabase stack is an alternative development environment, but is not provisioned by the hosted-project setup above; the current launcher validates hosted project identities.
