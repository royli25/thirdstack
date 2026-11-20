# Development and production isolation

Requested on 2026-11-15. This plan covers local startup, development infrastructure, migration commands, documentation, and verification.

## Starting point

- Render serves `https://twohands.tech` with one PostgreSQL runtime owner. Its `/healthz` endpoint passed during investigation; the exact deployed revision has not been verified.
- The checkout's existing ignored `.env` selects that same Supabase database and Auth project. It must not supply local development settings.
- Local `main` contains the connector migration that is absent from the shared database. Production must receive it only as part of a deliberate release of the matching code.
- The runtime ownership lock protects recovery, accounting, and in-flight calls. Keep its implementation and name unchanged.

## Implementation

1. **Startup isolation** — load only `.env.development.local` for development, development migrations, and local production previews. Sanitize inherited application settings and prevent Vite's automatic dotenv loading from reintroducing production values. Validate that database and Auth belong to the explicitly selected development project, and reject the known production project. Keep development on API port 3009 and frontend port 5175, with separate Vite dependency caches for development and browser-fixture backends. Provide a separate, explicit SQLite preview with its own local database.
2. **Development infrastructure** — provision a dedicated Supabase project with separate Auth settings, public key, database credentials, and accounts. Apply the repository's migrations through the application's migration command to that project only. Start with empty history. Supabase CLI authentication is required and was unavailable at the start of implementation; do not claim this step complete without provisioning and verification.
3. **Production migrations** — provide an explicit production migration command using injected production settings and an explicit target confirmation. It must use the existing migration ledger and runtime lock, refuse an active server, and never run automatically during ordinary development or API startup. Production deployment remains manual and uses a planned stop–migrate–start sequence.
4. **Documentation** — update the setup guide, environment template, account configuration, operations guide, migration guide, and release checklist. Preserve earlier rollout records as historical checkpoints. Explain that development needs its own data and Auth identities.

Implementation agents own startup isolation, production migration tooling, and documentation separately. The primary agent handles infrastructure access, integration review, and verification.

## Acceptance checks

- A contaminated parent environment and existing `.env` cannot direct `npm run dev` or its API proxy to production or expose production settings to the browser.
- Missing, malformed, production, and mismatched database/Auth configurations fail before connecting; error messages omit credentials.
- Development migrations use the same validated development settings as startup and retain application migration checksum and runtime ownership checks.
- Production migrations require an explicit production target and preserve lock-refusal failures. No production session is terminated and no production migration or deployment runs as part of this work.
- Run `npm run check`, focused environment/migration tests, and browser tests for the development proxy and account configuration using isolated fixtures. Run a live development startup check only after the dedicated project is available. Report fixtures separately from infrastructure verification.

## Excluded work

No production deployment, production schema change, production-data copy, paid provider calls, payment activation, horizontal scaling, or redesign of the runtime ownership lock.

## Implementation status

- Startup isolation, guarded migration commands, release packaging, environment template, and documentation are implemented locally. The runtime lock and API recovery implementation are unchanged.
- `npm run check` passed: 499 tests passed and 76 conditional cases skipped. Separate disposable local PostgreSQL coverage passed 29 tests, including migrations, accounts, hosted connectors, and runtime ownership disconnect behavior. The temporary PostgreSQL server was stopped afterward.
- All 23 selected account and proxy/origin browser cases passed after the hosted development setup was configured. The proxy test waits for the actual landing heading before its single mutation and also passed with warm and cold caches while the development frontend remained running. Vite caches are separated by backend port. These were fixture checks, not hosted signup/email or provider validation.
- Release artifact verification and formatting checks passed. Dedicated development credentials are stored only in the private, ignored `.env.development.local`. A fresh development fallback namespace is required and validated before startup; it does not import or claim historical data.
- Supabase CLI login was verified on 2026-11-15. After the user authorized pausing `internwizard`, its project was verified `INACTIVE` and the separate [Two Hands development project](https://supabase.com/dashboard/project/focqpnwgjhvadomqydgc) was created in X402. Billing was not upgraded. All 14 application migrations, including connectors, are installed with matching checksums. TLS certificate verification passed.
- `npm run dev` is running the PostgreSQL-backed development app at `http://127.0.0.1:5175`, with the API at `http://127.0.0.1:3009`. Public configuration points to the new Auth project, email/password sign-in and confirmation are enabled, and the two exact local callback URLs are configured. The Auth settings endpoint returned 200 and anonymous account access returned 401. The development database had zero users, workspaces, and observation sessions at verification; production returned a healthy response and advertises a different Auth project. These checks do not establish email delivery or a completed user signup/login journey. No fixture accounts were created in the development project.
- No production migration, deployment, database-session termination, provider call, or payment action was performed during this implementation.
