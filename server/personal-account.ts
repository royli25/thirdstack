// Preserve the original storage partitions for existing sole owners and imports.
export const PERSONAL_ACCOUNT_SCOPE = (user: "$1" | "u.id") => `
  SELECT w.id FROM octolab.workspace_memberships m
  JOIN octolab.workspaces w ON w.id=m.workspace_id
  WHERE m.user_id=${user} AND m.role='owner'
  AND NOT EXISTS (
    SELECT 1 FROM octolab.workspace_memberships other
    WHERE other.workspace_id=w.id AND other.role='owner' AND other.user_id<>m.user_id
  )
  ORDER BY w.created_at,w.id LIMIT 1`;
