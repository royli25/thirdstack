import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * GitHub Actions artifact storage is a small shared quota. Storing a ~350 MB
 * container image on every run exhausted it, and the failed upload then marked
 * otherwise passing builds as failed. These checks keep that from returning.
 */
const workflow = readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

/** Each `- uses: actions/upload-artifact` step, up to the next step. */
function uploadSteps() {
  const lines = workflow.split("\n");
  const steps: string[] = [];
  lines.forEach((line, index) => {
    const match = /^(\s*)- uses: actions\/upload-artifact@/.exec(line);
    if (!match) return;
    const indent = match[1].length;
    const body = [line];
    for (const next of lines.slice(index + 1)) {
      const nextIndent = next.length - next.trimStart().length;
      if (next.trim() && nextIndent <= indent) break;
      body.push(next);
    }
    steps.push(body.join("\n"));
  });
  return steps;
}

describe("CI artifact policy", () => {
  it("never builds or uploads container image archives", () => {
    expect(workflow).not.toMatch(/docker save/);
    expect(workflow).not.toMatch(/\.tar(\.gz)?\b/);
    expect(workflow).not.toMatch(/release-images/);
  });

  it("keeps every upload short-lived and unable to fail the run", () => {
    const steps = uploadSteps();
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(step).toMatch(/continue-on-error: true/);
      const retention = /retention-days: (\d+)/.exec(step);
      expect(retention, step).not.toBeNull();
      expect(Number(retention![1])).toBeLessThanOrEqual(3);
    }
  });

  it("uploads browser test output only when the browser run fails", () => {
    const browser = uploadSteps().find((s) =>
      s.includes("name: browser-verification"),
    );
    expect(browser).toMatch(/if: failure\(\)/);
  });

  it("cancels superseded runs on the same branch", () => {
    expect(workflow).toMatch(
      /concurrency:\n\s+group: .+\n\s+cancel-in-progress: true/,
    );
  });
});
