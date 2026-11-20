import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";

export const signalExitCode = (signal) =>
  signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1;

export function assertPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", () =>
      reject(
        new Error(
          `Development API port ${port} is already in use. Stop the other development runtime or choose another PORT in .env.development.local.`,
        ),
      ),
    );
    probe.listen({ host: "127.0.0.1", port, exclusive: true }, () =>
      probe.close(resolve),
    );
  });
}

export async function waitForDevelopmentApi(
  port,
  exited,
  signal,
  timeoutMs = 30000,
) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const done = new AbortController();
  const combined = AbortSignal.any([
    timeout,
    done.signal,
    ...(signal ? [signal] : []),
  ]);
  const poll = async () => {
    while (!combined.aborted) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/healthz`, {
          signal: AbortSignal.any([combined, AbortSignal.timeout(1000)]),
          redirect: "error",
        });
        const body = await response.json();
        if (response.ok && body.ok === true) return;
      } catch {
        // The API does not listen until database verification and recovery finish.
      }
      await setTimeout(100, undefined, { signal: combined }).catch(() => {});
    }
    if (signal?.aborted) throw new Error("Development startup interrupted.");
    throw new Error(
      "Development API did not become ready. Check the API error above; apply npm run db:migrate:dev for pending development migrations, or stop the other development runtime if it owns the database. No migration was run automatically.",
    );
  };
  try {
    await Promise.race([
      poll(),
      exited.then(() => {
        throw new Error(
          "Development API exited before becoming ready. Check the startup error above.",
        );
      }),
    ]);
  } finally {
    done.abort();
  }
}
