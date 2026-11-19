import { AccountAllowance } from "./account-allowance.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { type Database, PostgresDatabase, SqliteDatabase } from "./database.js";
import { SQLITE_SCHEMA } from "./sqlite-schema.js";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Task, TraceEvent, Observation } from "./types.js";
export class StorageConflict extends Error {
  readonly status = 409;
}
export class Store {
  db: Database;
  readonly allowance = new AccountAllowance(this);
  readonly scope = new AsyncLocalStorage<string>();
  readonly actorScope = new AsyncLocalStorage<{
    kind: "account" | "api_key";
    id: string;
  }>();
  readonly legacyWorkspaceId: string;
  get workspaceId() {
    return this.scope.getStore() ?? this.legacyWorkspaceId;
  }
  constructor(path: string, postgresUrl?: string, workspaceId?: string) {
    if (postgresUrl) {
      if (!workspaceId || !/^[0-9a-f-]{36}$/i.test(workspaceId))
        throw new Error("Set LEGACY_WORKSPACE_ID before opening Postgres.");
      this.legacyWorkspaceId = workspaceId;
      this.db = new PostgresDatabase(postgresUrl, () => this.workspaceId);
      return;
    }
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const native = new DatabaseSync(path);
    try {
      native.exec(
        "PRAGMA locking_mode=EXCLUSIVE; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;" +
          SQLITE_SCHEMA,
      );
      native
        .prepare("INSERT OR IGNORE INTO api_key_workspace VALUES (1,?)")
        .run(randomUUID());
      this.legacyWorkspaceId = String(
        native
          .prepare("SELECT workspace_id FROM api_key_workspace WHERE id=1")
          .get()!.workspace_id,
      );
    } catch (error) {
      native.close();
      if (error instanceof Error && /locked|busy/i.test(error.message))
        throw new Error(
          "Workspace database is already in use. Stop the other server or maintenance process before retrying.",
        );
      throw error;
    }
    this.db = new SqliteDatabase(native);
  }
  async save(task: Task) {
    await this.db
      .prepare(
        "INSERT INTO tasks VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(task.id, JSON.stringify(task));
  }
  async saveIfUnchanged(task: Task, previous: string) {
    await this.db.atomic(async () => {
      if (JSON.stringify(await this.get(task.id)) !== previous)
        throw new StorageConflict(
          "Task changed during this operation. Reload before retrying.",
        );
      await this.save(task);
    });
  }
  async get(id: string): Promise<Task | undefined> {
    const row = await this.db
      .prepare("SELECT body FROM tasks WHERE id=?")
      .get(id);
    return row ? JSON.parse(row.body as string) : undefined;
  }
  async tasks(): Promise<Task[]> {
    return (
      await this.db
        .prepare("SELECT body FROM tasks ORDER BY rowid DESC LIMIT 500")
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  async event(
    taskId: string,
    type: string,
    data: Record<string, any>,
    callId: string | null = null,
  ) {
    await this.db
      .prepare(
        "INSERT INTO events(task_id,call_id,type,at,data) VALUES (?,?,?,?,?)",
      )
      .run(
        taskId,
        callId,
        type,
        new Date().toISOString(),
        JSON.stringify(data),
      );
  }
  async events(taskId: string): Promise<TraceEvent[]> {
    return (
      await this.db
        .prepare("SELECT * FROM events WHERE task_id=? ORDER BY id")
        .all(taskId)
    ).map((r) => ({
      id: Number(r.id),
      taskId: r.task_id as string,
      callId: r.call_id as string | null,
      type: r.type as string,
      at: r.at as string,
      data: JSON.parse(r.data as string),
    }));
  }
  async transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    return await this.db.transaction(fn);
  }
  async observations(): Promise<Observation[]> {
    const tasks = new Map<string, Task>();
    return await Promise.all(
      (
        await this.db
          .prepare(
            "SELECT task_id,call_id,data FROM events WHERE type='provider_response' ORDER BY id DESC LIMIT 200",
          )
          .all()
      ).map(async (r) => {
        const observation = JSON.parse(r.data as string);
        const id = r.task_id as string;
        let task = tasks.get(id);
        if (!task) {
          task = (await this.get(id))!;
          tasks.set(id, task);
        }
        const sourceIds = new Set(
          task.sources.filter((s) => s.callId === r.call_id).map((s) => s.id),
        );
        const audited = task.assessments.filter(
          (a) =>
            sourceIds.has(a.sourceId) &&
            a.note &&
            task!.intent.criteria.every(
              (c) => a.criteria[c] === "pass" || a.criteria[c] === "fail",
            ),
        );
        const quality = audited.length
          ? audited.reduce(
              (sum, a) =>
                sum +
                task!.intent.criteria.filter((c) => a.criteria[c] === "pass")
                  .length /
                  task!.intent.criteria.length,
              0,
            ) / audited.length
          : null;
        return {
          provider: observation.provider,
          latencyMs: observation.latencyMs,
          success: observation.success,
          quality,
        };
      }),
    );
  }
  async receipt(taskId: string, operation: string, key: string) {
    const row = await this.db
      .prepare(
        "SELECT * FROM request_receipts WHERE task_id=? AND operation=? AND request_key=?",
      )
      .get(taskId, operation, key);
    return row
      ? {
          argsHash: row.args_hash as string,
          state: row.state as string,
          status: Number(row.http_status),
          body: JSON.parse(row.body as string),
        }
      : undefined;
  }
  async beginReceipt(
    taskId: string,
    operation: string,
    key: string,
    argsHash: string,
  ) {
    await this.db
      .prepare("INSERT INTO request_receipts VALUES (?,?,?,?,?,?,?)")
      .run(
        taskId,
        operation,
        key,
        argsHash,
        "pending",
        202,
        JSON.stringify({ taskId, operation, pending: true }),
      );
  }
  async finishReceipt(
    taskId: string,
    operation: string,
    key: string,
    status: number,
    body: object,
  ) {
    await this.db
      .prepare(
        "UPDATE request_receipts SET state='complete',http_status=?,body=? WHERE task_id=? AND operation=? AND request_key=? AND state='pending'",
      )
      .run(status, JSON.stringify(body), taskId, operation, key);
  }
  async recover() {
    await this.db
      .prepare(
        "UPDATE request_receipts SET state='interrupted',http_status=409,body=? WHERE state='pending'",
      )
      .run(
        JSON.stringify({
          error:
            "The previous operation was interrupted. Inspect its task trace before issuing a new request; it was not retried.",
        }),
      );
    for (const task of await this.tasks())
      if (task.status === "running" || task.reservedMicros > 0)
        await this.transaction(async () => {
          // A process crash cannot establish whether an in-flight vendor request was billed.
          task.spentMicros += task.reservedMicros;
          task.reservedMicros = 0;
          task.status = "partial";
          task.error =
            "Run interrupted by server restart. In-flight estimates remain in the ledger; billing is unknown.";
          const events = await this.events(task.id);
          for (const pending of events.filter(
            (e) =>
              e.type === "budget_reserved" &&
              !events.some(
                (s) => s.type === "budget_settled" && s.callId === e.callId,
              ),
          )) {
            if (pending.callId) await this.allowance.settle(pending.callId);
            await this.event(
              task.id,
              "provider_interrupted",
              {
                provider: pending.data.provider,
                billingStatus: "unknown",
                reason: "Server restarted with request in flight",
              },
              pending.callId,
            );
            await this.event(
              task.id,
              "budget_settled",
              {
                provider: pending.data.provider,
                estimateMicros: pending.data.estimateMicros,
                chargeType: pending.data.chargeType || "estimate",
                authMode: pending.data.authMode,
                billingStatus:
                  pending.data.authMode === "keyless"
                    ? "keyless-free-tier"
                    : "unknown",
                rateCardVersion: pending.data.rateCardVersion,
              },
              pending.callId,
            );
          }
          await this.save(task);
          await this.event(task.id, "run_interrupted", {
            reason: task.error,
            billing: "unknown",
          });
        });
  }
  async close() {
    await this.db.close();
  }
}
