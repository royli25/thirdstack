SET search_path TO octolab, pg_catalog;
-- Provider identifiers are now defined by the application's provider catalog
-- (server/provider-catalog.ts) and validated there. Replace the hardcoded
-- three-provider list with a format check so adding a provider needs no
-- schema change.
ALTER TABLE tool_companies DROP CONSTRAINT IF EXISTS tool_companies_provider_id_check;
ALTER TABLE tool_companies
  ADD CONSTRAINT tool_companies_provider_id_format
  CHECK (provider_id ~ '^[a-z][a-z0-9_-]{1,79}$');
