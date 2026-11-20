import { compareProviderRuns } from "../server/provider-lab-metrics";
import type { Experiment, LabCall, LabRun } from "../server/provider-lab-types";
import { money } from "./api";

function result(call?: LabCall) {
  if (!call) return "Not tested";
  if (call.status !== "succeeded") return call.status;
  if (call.measurements?.referenceCheck === true) return "Reference matched";
  if (call.measurements?.referenceCheck === false) return "Reference missed";
  return "Reference unknown";
}
export function ProviderComparison({
  plan,
  runs,
}: {
  plan: Pick<
    Experiment,
    "provider" | "verification" | "baselineRunId" | "followupRunId"
  >;
  runs: LabRun[];
}) {
  const baseline = runs.find((r) => r.id === plan.baselineRunId);
  const followup = runs.find((r) => r.id === plan.followupRunId);
  if (!baseline || !followup || plan.verification === "agent_choice")
    return null;
  const comparison = compareProviderRuns(baseline, followup, plan.provider);
  const { before, after } = comparison;
  const rows = [
    [
      "Requests succeeded",
      `${before.succeeded} / ${before.attempted}`,
      `${after.succeeded} / ${after.attempted}`,
    ],
    [
      "Reference checks",
      before.referenceKnown
        ? `${before.referencePassed} / ${before.referenceKnown}`
        : "Unknown",
      after.referenceKnown
        ? `${after.referencePassed} / ${after.referenceKnown}`
        : "Unknown",
    ],
    [
      "Useful reviews",
      before.reviewed
        ? `${before.useful} / ${before.reviewed} reviewed`
        : "Not reviewed",
      after.reviewed
        ? `${after.useful} / ${after.reviewed} reviewed`
        : "Not reviewed",
    ],
    [
      "Median response",
      before.medianLatencyMs === null
        ? "—"
        : `${(before.medianLatencyMs / 1000).toFixed(2)} s`,
      after.medianLatencyMs === null
        ? "—"
        : `${(after.medianLatencyMs / 1000).toFixed(2)} s`,
    ],
    [
      "Estimated cost",
      money(before.estimatedMicros),
      money(after.estimatedMicros),
    ],
  ];
  return (
    <details className="provider-comparison">
      <summary>Compare baseline and follow-up</summary>
      <p className="field-hint">
        {comparison.sameCases
          ? "The provider received the same versioned test cases."
          : "These runs have different cases."}{" "}
        Results are descriptive; changes can reflect web content, timing, or
        provider variability.
      </p>
      {comparison.warnings.length > 0 && (
        <ul className="comparison-warnings">
          {comparison.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <div
        className="lab-table-wrap"
        role="region"
        aria-label="Baseline and follow-up measurements"
        tabIndex={0}
      >
        <table className="lab-table">
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Baseline</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, b, a]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{b}</td>
                <td>{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Inspect what changed</h3>
      <div
        className="lab-table-wrap"
        role="region"
        aria-label="Case comparison"
        tabIndex={0}
      >
        <table className="lab-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Baseline</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {comparison.cases.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.title}</th>
                <td>{result(c.before)}</td>
                <td>{result(c.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
