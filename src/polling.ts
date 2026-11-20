/** Poll after completion, never overlap, and stop work while the tab is hidden. */
export function startPolling(
  task: () => Promise<unknown>,
  intervalMs: number,
  initialDelay = 0,
) {
  let stopped = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (!stopped) timer = setTimeout(() => void run(), delay);
  };
  const run = async () => {
    if (stopped || running || document.hidden) return;
    running = true;
    try {
      await task();
    } catch {
      /* The loader owns its error UI. */
    } finally {
      running = false;
      schedule(intervalMs);
    }
  };
  const visible = () => {
    clearTimeout(timer);
    if (!document.hidden) void run();
  };
  document.addEventListener("visibilitychange", visible);
  schedule(initialDelay);
  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visible);
  };
}
