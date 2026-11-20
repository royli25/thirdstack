import { sanitizedEventData } from "../server/sanitized";
import type { TraceEvent } from "../server/types";
export interface RecordingMetadata {
  id: string;
  title: string;
  capturedAt: string;
}
export interface Recording {
  id: string;
  metadata: RecordingMetadata;
  events: TraceEvent[];
  raw: Record<string, unknown>;
}
export async function recordingIndex(): Promise<RecordingMetadata[]> {
  const response = await fetch("/recordings/manifest.json");
  if (!response.ok) throw new Error("Historical recordings are unavailable");
  const raw = await response.json();
  if (!Array.isArray(raw) || raw.length > 10)
    throw new Error("Invalid recording index");
  return raw.filter(
    (r: RecordingMetadata) =>
      /^[a-z0-9-]+$/.test(r.id) &&
      typeof r.title === "string" &&
      Number.isFinite(Date.parse(r.capturedAt)),
  );
}
export async function loadRecording(
  metadata: RecordingMetadata,
): Promise<Recording> {
  const response = await fetch(
    `/recordings/${encodeURIComponent(metadata.id)}.json`,
  );
  if (!response.ok) throw new Error("Recording not found");
  const raw = await response.json();
  return parseRecording(metadata, raw);
}
export function parseRecording(
  metadata: RecordingMetadata,
  raw: Record<string, any>,
): Recording {
  if (
    raw.schemaVersion !== 1 ||
    typeof raw.id !== "string" ||
    !Array.isArray(raw.events) ||
    raw.events.length > 1000
  )
    throw new Error("Invalid historical trace");
  const events: TraceEvent[] = raw.events.map((e: Record<string, any>) => {
    if (
      !Number.isInteger(e.id) ||
      typeof e.type !== "string" ||
      !Number.isFinite(Date.parse(e.at))
    )
      throw new Error("Invalid recorded event");
    return {
      id: e.id,
      taskId: raw.id,
      callId: typeof e.callId === "string" ? e.callId : null,
      type: e.type,
      at: e.at,
      data: sanitizedEventData(e, e.type),
    };
  });
  const sanitized = {
    schemaVersion: 1,
    scope: "sanitized historical recording",
    id: raw.id,
    status: raw.status,
    spentMicros: raw.spentMicros,
    chargeType: raw.chargeType,
    events: events.map((e) => ({
      id: e.id,
      callId: e.callId,
      type: e.type,
      at: e.at,
      ...e.data,
    })),
  };
  return { id: `recording:${metadata.id}`, metadata, events, raw: sanitized };
}
