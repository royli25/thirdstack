import type { Observatory } from "./observation.js";
import type {
  ActivityItem,
  ActivityPage,
  AccountUsage,
} from "./account-data-types.js";
import { providerIds } from "./provider-catalog.js";

const nonnegative = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;

function source(obs: Observatory) {
  return `FROM observation_calls c JOIN observation_sessions s ON s.id=c.session_id
    ${obs.db.store.db.dialect === "postgres" ? "AND s.workspace_id=c.workspace_id" : ""}`;
}
function jsonValue(obs: Observatory, path: string) {
  return obs.db.store.db.dialect === "postgres"
    ? `c.body::jsonb #> '{${path.split(".").join(",")}}'`
    : `json_extract(c.body,'$.${path}')`;
}
function numeric(obs: Observatory, path: string) {
  const value = jsonValue(obs, path);
  return obs.db.store.db.dialect === "postgres"
    ? `(CASE WHEN jsonb_typeof(${value})='number' THEN (${value})::text::double precision END)`
    : `(CASE WHEN json_type(c.body,'$.${path}') IN ('integer','real') THEN ${value} END)`;
}
const callDate = "json_extract(c.body,'$.startedAt')";
const callProvider = "json_extract(c.body,'$.provider')";
const callStatus = "json_extract(c.body,'$.status')";

/** One date-bounded join; result bodies never leave the database. */
export async function readActivity(
  obs: Observatory,
  since: string,
  filters?: {
    provider: string;
    status: string;
    q: string;
    page: number;
    export?: string;
  },
): Promise<ActivityPage> {
  const db = obs.db.store.db;
  const values: unknown[] = [since];
  const where = [`${callDate}>=?`];
  if (filters?.provider && filters.provider !== "all") {
    where.push(`${callProvider}=?`);
    values.push(filters.provider);
  }
  if (filters?.status && filters.status !== "all") {
    where.push(`${callStatus}=?`);
    values.push(filters.status);
  }
  const query = filters?.q.trim().toLowerCase();
  if (query) {
    // The call ID is searchable so a charge on Credits can be traced to its request.
    const text = `LOWER(c.id || ' ' || COALESCE(json_extract(s.body,'$.title'),'') || ' ' ||
      COALESCE(json_extract(c.body,'$.tool'),'') || ' ' ||
      COALESCE(json_extract(c.body,'$.arguments.query'),json_extract(c.body,'$.arguments.url'),'') || ' ' ||
      COALESCE(json_extract(s.body,'$.host'),''))`;
    where.push(
      `${db.dialect === "postgres" ? "strpos" : "instr"}(${text},?)>0`,
    );
    values.push(query);
  }
  const from = `${source(obs)} WHERE ${where.join(" AND ")}`;
  const body =
    db.dialect === "postgres"
      ? "(c.body::jsonb - 'result')::text"
      : "json_remove(c.body,'$.result')";
  const page = filters?.page ?? 1;
  const limit = filters?.export ? 10001 : filters ? 20 : undefined;
  return db.read(async () => {
    const total = Number(
      (await db.prepare(`SELECT COUNT(*) AS n ${from}`).get(...values))!.n,
    );
    const rows = await db
      .prepare(
        `SELECT ${body} AS body,
      json_extract(s.body,'$.title') AS title, json_extract(s.body,'$.host') AS host,
      json_extract(s.body,'$.model') AS model,
      ${jsonValue(obs, "result.usage.providerReportedUsd")} AS usd,
      ${
        db.dialect === "postgres"
          ? "COALESCE(NULLIF(c.body::jsonb#>'{result,usage,credits}','null'::jsonb), c.body::jsonb#>'{result,credits}')"
          : "COALESCE(json_extract(c.body,'$.result.usage.credits'),json_extract(c.body,'$.result.credits'))"
      } AS credits
      ${from} ORDER BY ${callDate} DESC, c.id DESC ${limit ? "LIMIT ? OFFSET ?" : ""}`,
      )
      .all(
        ...values,
        ...(limit ? [limit, filters?.export ? 0 : (page - 1) * 20] : []),
      );
    const items = rows.map(
      (r) =>
        ({
          ...JSON.parse(r.body as string),
          sessionTitle: r.title,
          host: r.host,
          model: r.model,
          reportedUsd: nonnegative(r.usd),
          reportedCredits: nonnegative(r.credits),
        }) as ActivityItem,
    );
    // What each call was charged from prepaid credits, when the wallet held it.
    const charges = await obs.db.wallet.charges(items.map((item) => item.id));
    for (const item of items) {
      const charge = charges.get(item.id);
      if (charge) item.charge = charge;
    }
    return {
      total,
      page,
      pageSize: filters?.export ? rows.length : filters ? 20 : rows.length,
      items,
    };
  });
}

/** Group in SQL so a usage chart does not transfer one row per recorded call. */
export async function readUsage(
  obs: Observatory,
  days: number,
  since: string,
): Promise<AccountUsage> {
  const db = obs.db.store.db;
  const usd = numeric(obs, "result.usage.providerReportedUsd");
  const latency = numeric(obs, "latencyMs");
  const credits =
    db.dialect === "postgres"
      ? `(CASE WHEN c.body::jsonb#>'{result,usage,credits}' IS NULL OR c.body::jsonb#>'{result,usage,credits}'='null'::jsonb THEN ${numeric(obs, "result.credits")} ELSE ${numeric(obs, "result.usage.credits")} END)`
      : `(CASE WHEN json_type(c.body,'$.result.usage.credits') IS NULL OR json_type(c.body,'$.result.usage.credits')='null' THEN ${numeric(obs, "result.credits")} ELSE ${numeric(obs, "result.usage.credits")} END)`;
  const rows = await db
    .prepare(
      `SELECT SUBSTR(${callDate},1,10) AS day, ${callProvider} AS provider,
    ${callStatus} AS status, COUNT(*) AS requests,
    SUM(CASE WHEN ${callStatus}='running' THEN 0 ELSE CAST(json_extract(c.body,'$.estimateMicros') AS BIGINT) END) AS estimated,
    SUM(CASE WHEN ${usd}>=0 THEN ${usd} ELSE 0 END) AS usd,
    SUM(CASE WHEN ${usd}>=0 THEN 1 ELSE 0 END) AS usd_count,
    SUM(COALESCE(${latency},0)) AS latency, COUNT(${latency}) AS timed,
    SUM(CASE WHEN ${credits}>=0 THEN ${credits} ELSE 0 END) AS credits,
    SUM(CASE WHEN ${credits}>=0 THEN 1 ELSE 0 END) AS credits_count
    ${source(obs)} WHERE ${callDate}>=?
    GROUP BY SUBSTR(${callDate},1,10), ${callProvider}, ${callStatus}`,
    )
    .all(since);
  const sum = (key: string, group = rows) =>
    group.reduce((s, r) => s + Number(r[key] ?? 0), 0);
  const statusCount = (status: string) =>
    sum(
      "requests",
      rows.filter((r) => r.status === status),
    );
  const reported = sum("usd_count"),
    timed = sum("timed");
  return {
    days,
    since,
    requests: sum("requests"),
    succeeded: statusCount("succeeded"),
    failed: statusCount("failed"),
    running: statusCount("running"),
    interrupted: statusCount("interrupted"),
    estimatedMicros: sum("estimated"),
    reportedUsd: reported ? sum("usd") : null,
    usdReportingCalls: reported,
    averageLatencyMs: timed ? Math.round(sum("latency") / timed) : null,
    latencySamples: timed,
    series: Array.from({ length: days }, (_, n) => {
      const date = new Date(Date.parse(since) + n * 86400000)
        .toISOString()
        .slice(0, 10);
      const group = rows.filter((r) => r.day === date);
      return {
        date,
        requests: sum("requests", group),
        estimatedMicros: sum("estimated", group),
      };
    }),
    providers: providerIds.map((provider) => {
      const group = rows.filter((r) => r.provider === provider),
        count = sum("credits_count", group);
      return {
        provider,
        requests: sum("requests", group),
        estimatedMicros: sum("estimated", group),
        reportedCredits: count ? sum("credits", group) : null,
        creditReportingCalls: count,
      };
    }),
  };
}
