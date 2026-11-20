/**
 * Outbound network policy for company-supplied MCP connectors.
 *
 * A connector endpoint is chosen by a third party, so every request goes
 * through `guardedFetch`: HTTPS only, no redirects, every resolved address must
 * be public (checked inside the socket's own DNS lookup, so a hostname cannot
 * pass the check and then connect somewhere else), a total time limit, and a
 * response size cap. Plain HTTP to a loopback address is allowed only when the
 * operator explicitly enables it for local testing.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Readable, Transform } from "node:stream";

export class ConnectorNetworkError extends Error {
  constructor(
    public kind:
      "endpoint" | "address" | "timeout" | "too_large" | "network" | "redirect",
    message: string,
  ) {
    super(message);
  }
}

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const)
  blocked.addSubnet(net, prefix, "ipv6");

/** True only for globally routable unicast addresses. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (!family) return false;
  if (family === 4) return !blocked.check(address, "ipv4");
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  if (mapped) return isPublicAddress(mapped);
  return !blocked.check(address, "ipv6");
}

const loopbackNames = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export interface EndpointPolicy {
  /** Permit http:// to a loopback host. Local development and tests only. */
  allowLoopback?: boolean;
}

/** Normalizes a connector endpoint or throws a message safe to show its owner. */
export function connectorEndpoint(value: string, policy: EndpointPolicy = {}) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConnectorNetworkError("endpoint", "Enter a valid endpoint URL.");
  }
  if (value.length > 2048 || url.username || url.password)
    throw new ConnectorNetworkError(
      "endpoint",
      "Use an endpoint URL without embedded credentials. Supply a token separately.",
    );
  url.hash = "";
  if (policy.allowLoopback && loopbackNames.has(url.hostname)) {
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new ConnectorNetworkError("endpoint", "Use an HTTP(S) endpoint.");
    return url.href;
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    isIP(host) ||
    !host.includes(".") ||
    /(^|\.)(localhost|local|internal|intranet|lan|corp|test|invalid|example)$/i.test(
      host,
    ) ||
    host.endsWith(".home.arpa")
  )
    throw new ConnectorNetworkError(
      "endpoint",
      "Connectors must use a public HTTPS hostname on the default port.",
    );
  return url.href;
}

/** DNS lookup that refuses non-public results, used by the socket itself. */
export const publicLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return (callback as any)(error);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (!list.length || bad)
      return (callback as any)(
        new ConnectorNetworkError(
          "address",
          "The connector hostname resolves to a non-public address.",
        ),
      );
    if ((options as dns.LookupOptions).all)
      return (callback as any)(null, list);
    (callback as any)(null, list[0].address, list[0].family);
  });
};

export interface GuardedFetchOptions extends EndpointPolicy {
  timeoutMs: number;
  maxResponseBytes: number;
}

/**
 * A `fetch` replacement for the MCP client transport. It never consults
 * environment proxies, so the address check applies to the real destination.
 */
export function guardedFetch(options: GuardedFetchOptions): typeof fetch {
  return ((input: string | URL | Request, init: RequestInit = {}) =>
    new Promise<Response>((resolve, reject) => {
      let url: URL;
      try {
        url = new URL(connectorEndpoint(String(input), options));
      } catch (e) {
        return reject(e);
      }
      const loopback = loopbackNames.has(url.hostname);
      const transport = url.protocol === "https:" ? https : http;
      const headers = new Headers(init.headers);
      const body =
        typeof init.body === "string"
          ? init.body
          : init.body == null
            ? undefined
            : null;
      if (body === null)
        return reject(
          new ConnectorNetworkError("network", "Unsupported request body."),
        );
      if (body !== undefined)
        headers.set("content-length", String(Buffer.byteLength(body)));
      let settled = false;
      const timer = setTimeout(() => {
        req.destroy(
          new ConnectorNetworkError(
            "timeout",
            "The connector did not respond in time.",
          ),
        );
      }, options.timeoutMs);
      timer.unref();
      const fail = (error: unknown) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        reject(
          error instanceof ConnectorNetworkError
            ? error
            : (error as Error)?.name === "AbortError"
              ? error
              : new ConnectorNetworkError(
                  "network",
                  "The connector could not be reached.",
                ),
        );
      };
      const req = transport.request(
        url,
        {
          method: init.method ?? "GET",
          headers: Object.fromEntries(headers),
          signal: init.signal ?? undefined,
          ...(loopback ? {} : { lookup: publicLookup }),
          agent: false,
        },
        (res) => {
          const status = res.statusCode ?? 502;
          if (status >= 300 && status < 400) {
            res.resume();
            return fail(
              new ConnectorNetworkError(
                "redirect",
                "Connectors may not redirect. Register the final endpoint URL.",
              ),
            );
          }
          const declared = Number(res.headers["content-length"] ?? 0);
          if (declared > options.maxResponseBytes) {
            res.destroy();
            return fail(
              new ConnectorNetworkError(
                "too_large",
                "The connector response exceeded the size limit.",
              ),
            );
          }
          let seen = 0;
          const cap = new Transform({
            transform(chunk: Buffer, _enc, done) {
              seen += chunk.length;
              if (seen > options.maxResponseBytes)
                return done(
                  new ConnectorNetworkError(
                    "too_large",
                    "The connector response exceeded the size limit.",
                  ),
                );
              done(null, chunk);
            },
          });
          res.on("error", (e) => cap.destroy(e));
          res.on("end", () => clearTimeout(timer));
          cap.on("error", () => {
            clearTimeout(timer);
            res.destroy();
          });
          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(res.headers))
            if (value !== undefined)
              responseHeaders.set(
                name,
                Array.isArray(value) ? value.join(", ") : value,
              );
          const empty = [204, 205, 304].includes(status);
          if (empty) {
            res.resume();
            clearTimeout(timer);
          }
          settled = true;
          resolve(
            new Response(
              empty
                ? null
                : (Readable.toWeb(res.pipe(cap)) as ReadableStream<Uint8Array>),
              { status, headers: responseHeaders },
            ),
          );
        },
      );
      req.on("error", fail);
      req.end(body);
    })) as typeof fetch;
}
