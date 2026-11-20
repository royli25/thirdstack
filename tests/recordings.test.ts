import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseRecording } from "../src/recordings";
describe("historical live recordings", () => {
  it("contains genuine saved HTTP 200/page 404 evidence without raw task content", () => {
    const raw = JSON.parse(
      readFileSync("public/recordings/firecrawl-missing-page.json", "utf8"),
    );
    const recording = parseRecording(
      {
        id: "firecrawl-missing-page",
        title: "Historical",
        capturedAt: raw.events[0].at,
      },
      raw,
    );
    expect(recording.id).toBe("recording:firecrawl-missing-page");
    expect(
      recording.events.find((e) => e.type === "provider_response")?.data,
    ).toMatchObject({ httpStatus: 200, pageStatus: 404, authMode: "keyless" });
    expect(
      recording.events.find((e) => e.type === "extraction_received")?.data
        .evidenceUsable,
    ).toBe(false);
    expect(JSON.stringify(recording.raw)).not.toContain("https://example.com");
  });
  it("drops unknown content fields from both the viewer and downloaded copy", () => {
    const raw = {
      schemaVersion: 1,
      id: "task",
      prompt: "PRIVATE PROMPT",
      events: [
        {
          id: 1,
          callId: "call",
          type: "provider_request",
          at: "2026-11-01T12:00:00Z",
          provider: "exa",
          arguments: { query: "PRIVATE QUERY" },
          returnedRefs: ["https://private.example"],
          snippet: "PRIVATE SOURCE",
        },
      ],
    };
    const result = parseRecording(
      { id: "test", title: "Historical", capturedAt: raw.events[0].at },
      raw,
    );
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(JSON.stringify(result)).not.toContain("private.example");
  });
});
