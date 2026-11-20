/**
 * Outbound MCP client for company connectors. Each operation opens a fresh
 * Streamable HTTP session through `guardedFetch`, does one thing, and closes,
 * so no connection or state is shared between customers or calls.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import { createHash } from "node:crypto";
import {
  ConnectorNetworkError,
  guardedFetch,
  type GuardedFetchOptions,
} from "./connector-network.js";

export const CONNECTOR_LIMITS = {
  /** Remote tools read from one connector. */
  maxTools: 50,
  /** Serialized size of one tool's input schema. */
  maxSchemaBytes: 32 * 1024,
  /** Text returned to the agent from one call. */
  maxResultChars: 60_000,
  /** Raw bytes accepted from the connector for one HTTP response. */
  maxResponseBytes: 1024 * 1024,
  maxDescriptionChars: 1200,
};

export class ConnectorCallError extends Error {
  constructor(
    public kind:
      | "timeout"
      | "network"
      | "protocol"
      | "tool_error"
      | "too_large"
      | "address"
      | "redirect"
      | "endpoint",
    message: string,
  ) {
    super(message);
  }
}

export interface RemoteTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  /** Stable hash of what the agent would see and send. */
  schemaHash: string;
}

export interface ConnectorTarget {
  endpoint: string;
  token?: string;
}

export interface ConnectorClientOptions extends Omit<
  GuardedFetchOptions,
  "maxResponseBytes"
> {
  maxResponseBytes?: number;
}

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, canonical((v as any)[k])]),
    );
  return v;
}
export function schemaHash(tool: Omit<RemoteTool, "schemaHash">) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        canonical({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        }),
      ),
    )
    .digest("hex");
}

function translate(error: unknown): ConnectorCallError {
  if (error instanceof ConnectorCallError) return error;
  let cause: unknown = error;
  for (let i = 0; i < 4 && cause; i++) {
    if (cause instanceof ConnectorNetworkError)
      return new ConnectorCallError(cause.kind, cause.message);
    cause = (cause as { cause?: unknown }).cause;
  }
  const message = error instanceof Error ? error.message : "";
  const code = (error as { code?: unknown })?.code;
  if (
    code === 401 ||
    code === 403 ||
    /\b(401|403)\b|unauthori[sz]ed|forbidden/i.test(message)
  )
    return new ConnectorCallError(
      "network",
      "The connector rejected Two Hands' credentials (HTTP 401/403). Check the token.",
    );
  if (/timed? ?out/i.test(message))
    return new ConnectorCallError(
      "timeout",
      "The connector did not respond in time.",
    );
  return new ConnectorCallError(
    "network",
    "The connector could not complete the MCP request.",
  );
}

async function session<T>(
  target: ConnectorTarget,
  options: ConnectorClientOptions,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const fetch = guardedFetch({
    ...options,
    maxResponseBytes:
      options.maxResponseBytes ?? CONNECTOR_LIMITS.maxResponseBytes,
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(target.endpoint),
    {
      fetch,
      requestInit: {
        redirect: "error",
        headers: target.token
          ? { Authorization: `Bearer ${target.token}` }
          : {},
      },
      reconnectionOptions: {
        maxRetries: 0,
        initialReconnectionDelay: 1000,
        maxReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1,
      },
    },
  );
  const client = new Client(
    { name: "two-hands-connector", version: "0.2.0" },
    { capabilities: {} },
  );
  try {
    await client.connect(transport, { timeout: options.timeoutMs });
    return await fn(client);
  } catch (error) {
    throw translate(error);
  } finally {
    await transport.terminateSession().catch(() => {});
    await client.close().catch(() => {});
  }
}

const validators = new AjvJsonSchemaValidator();
const compiled = new Map<string, (input: unknown) => string | null>();
/**
 * Compiles a connector's input schema once per hash. Returns a checker that
 * yields an error message, or null when the input is valid.
 */
export function inputChecker(
  hash: string,
  schema: Record<string, unknown>,
): (input: unknown) => string | null {
  const cached = compiled.get(hash);
  if (cached) return cached;
  const { $schema: _dialect, ...body } = schema;
  let validate: ReturnType<typeof validators.getValidator>;
  try {
    validate = validators.getValidator(body as never);
  } catch {
    throw new ConnectorCallError(
      "protocol",
      "The tool's input schema could not be compiled.",
    );
  }
  const check = (input: unknown) => {
    const result = validate(input);
    return result.valid ? null : result.errorMessage.slice(0, 600);
  };
  if (compiled.size > 500) compiled.clear();
  compiled.set(hash, check);
  return check;
}

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : "";

/** Reads the connector's tool list and validates what Two Hands can carry. */
export async function listRemoteTools(
  target: ConnectorTarget,
  options: ConnectorClientOptions,
): Promise<RemoteTool[]> {
  return await session(target, options, async (client) => {
    const tools: RemoteTool[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = await client.listTools(cursor ? { cursor } : undefined, {
        timeout: options.timeoutMs,
      });
      for (const t of result.tools) {
        if (tools.length >= CONNECTOR_LIMITS.maxTools)
          throw new ConnectorCallError(
            "protocol",
            `A connector may offer at most ${CONNECTOR_LIMITS.maxTools} tools.`,
          );
        if (!/^[A-Za-z0-9_-]{1,48}$/.test(t.name))
          throw new ConnectorCallError(
            "protocol",
            `Tool name "${String(t.name).slice(0, 60)}" must be 1-48 letters, digits, underscores or hyphens.`,
          );
        if (tools.some((x) => x.name === t.name))
          throw new ConnectorCallError(
            "protocol",
            `Tool name "${t.name}" is listed more than once.`,
          );
        const inputSchema = (t.inputSchema ?? { type: "object" }) as Record<
          string,
          unknown
        >;
        if (inputSchema.type !== "object")
          throw new ConnectorCallError(
            "protocol",
            `Tool "${t.name}" must take an object input schema.`,
          );
        if (
          Buffer.byteLength(JSON.stringify(inputSchema)) >
          CONNECTOR_LIMITS.maxSchemaBytes
        )
          throw new ConnectorCallError(
            "protocol",
            `Tool "${t.name}" has an input schema larger than ${CONNECTOR_LIMITS.maxSchemaBytes / 1024} KB.`,
          );
        const base = {
          name: t.name,
          ...(t.title ? { title: text(t.title, 120) } : {}),
          description: text(
            t.description,
            CONNECTOR_LIMITS.maxDescriptionChars,
          ),
          inputSchema,
          ...(t.annotations
            ? { annotations: t.annotations as Record<string, unknown> }
            : {}),
        };
        const hash = schemaHash(base);
        try {
          inputChecker(hash, inputSchema);
        } catch {
          throw new ConnectorCallError(
            "protocol",
            `Tool "${t.name}" has an input schema Two Hands cannot validate.`,
          );
        }
        tools.push({ ...base, schemaHash: hash });
      }
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    return tools;
  });
}

export interface RemoteResult {
  /** Text the connector returned, concatenated and capped. */
  text: string;
  truncated: boolean;
  /** The connector flagged the result as a tool-level error. */
  isError: boolean;
  /** Content blocks that are not text, by type; not passed to the agent. */
  omittedContent: Record<string, number>;
  structuredContent?: Record<string, unknown>;
}

/** Calls one remote tool and reduces the reply to bounded, labeled text. */
export async function callRemoteTool(
  target: ConnectorTarget,
  name: string,
  args: Record<string, unknown>,
  options: ConnectorClientOptions,
): Promise<RemoteResult> {
  return await session(target, options, async (client) => {
    const result = await client.callTool({ name, arguments: args }, undefined, {
      timeout: options.timeoutMs,
    });
    const parts: string[] = [];
    const omitted: Record<string, number> = {};
    for (const block of (result.content ?? []) as {
      type: string;
      text?: string;
      resource?: { text?: string };
    }[]) {
      if (block.type === "text" && typeof block.text === "string")
        parts.push(block.text);
      else if (
        block.type === "resource" &&
        typeof block.resource?.text === "string"
      )
        parts.push(block.resource.text);
      else omitted[block.type] = (omitted[block.type] ?? 0) + 1;
    }
    let structured: Record<string, unknown> | undefined;
    if (
      result.structuredContent &&
      typeof result.structuredContent === "object" &&
      JSON.stringify(result.structuredContent).length <=
        CONNECTOR_LIMITS.maxResultChars
    )
      structured = result.structuredContent as Record<string, unknown>;
    const joined = parts.join("\n\n");
    return {
      text: joined.slice(0, CONNECTOR_LIMITS.maxResultChars),
      truncated: joined.length > CONNECTOR_LIMITS.maxResultChars,
      isError: result.isError === true,
      omittedContent: omitted,
      ...(structured ? { structuredContent: structured } : {}),
    };
  });
}
