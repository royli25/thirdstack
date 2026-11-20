import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  AccountError,
  type Accounts,
  type VerifiedIdentity,
} from "./accounts.js";
import type { PoolClient } from "pg";
export interface CompanyMember {
  id: string;
  email: string;
  role: "owner" | "analyst";
  createdAt: string;
}
export class CompanyTeam {
  constructor(private accounts: Accounts) {}
  private get pool() {
    return this.accounts.database.pool;
  }
  async requireOwner(
    identity: VerifiedIdentity,
    id: string,
    client: Pick<PoolClient, "query"> = this.pool,
  ) {
    if (this.accounts.isAdmin(identity.userId))
      this.accounts.assertAdmin(identity);
    const preview = this.accounts.previewsCompany(identity, id);
    if (!z.uuid().safeParse(id).success)
      throw new AccountError(404, "Company not found.");
    const result = await client.query(
      "SELECT c.id FROM octolab.tool_companies c WHERE c.id=$1 AND ($3 OR EXISTS(SELECT 1 FROM octolab.company_memberships m WHERE m.company_id=c.id AND m.user_id=$2 AND m.role='owner'))",
      [id, identity.userId, this.accounts.isAdmin(identity.userId) || preview],
    );
    if (!result.rowCount)
      throw new AccountError(403, "Only a company owner can manage its team.");
  }
  async list(identity: VerifiedIdentity, id: string): Promise<CompanyMember[]> {
    await this.requireOwner(identity, id);
    return (
      await this.pool.query(
        `SELECT m.user_id AS id,u.email,m.role,m.created_at AS "createdAt" FROM octolab.company_memberships m JOIN auth.users u ON u.id=m.user_id WHERE m.company_id=$1 ORDER BY (m.role='owner') DESC,m.created_at,m.user_id`,
        [id],
      )
    ).rows;
  }
  async change(identity: VerifiedIdentity, id: string, raw: unknown) {
    const input = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("grant"),
            email: z
              .email()
              .max(254)
              .transform((v) => v.toLowerCase()),
            requestKey: z.uuid(),
          })
          .strict(),
        z
          .object({
            action: z.literal("revoke"),
            userId: z.uuid(),
            requestKey: z.uuid(),
          })
          .strict(),
      ])
      .parse(raw);
    await this.requireOwner(identity, id);
    const hash = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex"),
      client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT id FROM octolab.tool_companies WHERE id=$1 FOR UPDATE",
        [id],
      );
      await this.requireOwner(identity, id, client);
      const previous = await client.query(
        "SELECT input_hash FROM octolab.company_team_requests WHERE company_id=$1 AND actor_user_id=$2 AND request_key=$3",
        [id, identity.userId, input.requestKey],
      );
      if (previous.rowCount) {
        if (previous.rows[0].input_hash !== hash)
          throw new AccountError(
            409,
            "This team request was used for a different change.",
          );
        await client.query("COMMIT");
        return { replayed: true };
      }
      let userId: string;
      if (input.action === "grant") {
        const target = await client.query(
          "SELECT id FROM auth.users WHERE lower(email)=$1 AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())",
          [input.email],
        );
        if (target.rowCount !== 1)
          throw new AccountError(
            400,
            "Ask this person to create and confirm their Two Hands account first.",
          );
        userId = target.rows[0].id;
        // Analysts must have business accounts; user accounts can't open company pages.
        const type = await client.query(
          "SELECT account_type FROM octolab.account_types WHERE user_id=$1",
          [userId],
        );
        if (type.rows[0]?.account_type !== "business")
          throw new AccountError(
            400,
            "This person needs a business account. Ask them to sign up as a business, then add them again.",
          );
        const count = await client.query(
          "SELECT count(*)::integer AS n FROM octolab.company_memberships WHERE company_id=$1",
          [id],
        );
        const existing = await client.query(
          "SELECT role FROM octolab.company_memberships WHERE company_id=$1 AND user_id=$2",
          [id, userId],
        );
        if (existing.rowCount)
          throw new AccountError(
            409,
            existing.rows[0].role === "owner"
              ? "This account is already the company owner."
              : "This account already has analyst access.",
          );
        if (count.rows[0].n >= 20)
          throw new AccountError(409, "Company team limit reached.");
        await client.query(
          "INSERT INTO octolab.company_memberships(company_id,user_id,role) VALUES($1,$2,'analyst') ON CONFLICT(company_id,user_id) DO NOTHING",
          [id, userId],
        );
      } else {
        userId = input.userId;
        const target = await client.query(
          "SELECT role FROM octolab.company_memberships WHERE company_id=$1 AND user_id=$2",
          [id, userId],
        );
        if (!target.rowCount)
          throw new AccountError(404, "This team member no longer has access.");
        if (target.rows[0]?.role === "owner")
          throw new AccountError(
            409,
            "The company owner cannot be removed here.",
          );
        await client.query(
          "DELETE FROM octolab.company_memberships WHERE company_id=$1 AND user_id=$2 AND role='analyst'",
          [id, userId],
        );
      }
      await client.query(
        "INSERT INTO octolab.company_team_requests(company_id,actor_user_id,request_key,input_hash) VALUES($1,$2,$3,$4)",
        [id, identity.userId, input.requestKey, hash],
      );
      await client.query(
        "INSERT INTO octolab.company_access_events(id,company_id,actor_user_id,action,data) VALUES($1,$2,$3,$4,$5)",
        [
          randomUUID(),
          id,
          identity.userId,
          input.action === "grant" ? "member_granted" : "member_revoked",
          JSON.stringify({
            userId,
            role: "analyst",
            requestKey: input.requestKey,
          }),
        ],
      );
      await client.query("COMMIT");
      return { replayed: false };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async audit(identity: VerifiedIdentity, id: string) {
    await this.requireOwner(identity, id);
    return (
      await this.pool.query(
        'SELECT id,actor_user_id AS "actorId",action,at,data FROM octolab.company_access_events WHERE company_id=$1 ORDER BY at DESC,id DESC LIMIT 100',
        [id],
      )
    ).rows;
  }
  async reportAccess(identity: VerifiedIdentity, id: string, status: string) {
    await this.pool.query(
      "INSERT INTO octolab.company_access_events(id,company_id,actor_user_id,action,data) VALUES($1,$2,$3,'report_accessed',$4)",
      [
        randomUUID(),
        id,
        identity.userId,
        JSON.stringify({ status, policy: "company-aggregate-v1" }),
      ],
    );
  }
}
