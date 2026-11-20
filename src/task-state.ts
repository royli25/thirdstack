import type { TaskDetail } from "./api";
/** Ignore delayed snapshots after a mutation has already delivered a newer trace. */
export function chooseTaskSnapshot(
  current: TaskDetail | undefined,
  incoming: TaskDetail,
) {
  if (!current || current.id !== incoming.id) return incoming;
  const oldEvent = current.events.at(-1)?.id ?? 0;
  const newEvent = incoming.events.at(-1)?.id ?? 0;
  if (
    newEvent < oldEvent ||
    (newEvent === oldEvent && incoming.updatedAt < current.updatedAt)
  )
    return current;
  return incoming;
}
