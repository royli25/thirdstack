export function signalExitCode(signal: string): number;
export function assertPortAvailable(port: number): Promise<void>;
export function waitForDevelopmentApi(
  port: number,
  exited: Promise<number>,
  signal?: AbortSignal,
  timeoutMs?: number,
): Promise<void>;
