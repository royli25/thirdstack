import type { AxeResults, NodeResult } from "axe-core";

export type RenderedControl = {
  slot: string | null;
  variant: string | null;
  background: string;
  color: string;
  tag?: string;
  href?: string | null;
};

const compact = (value: string) => value.toLowerCase().replace(/\s+/g, "");
const accent = (value: string) =>
  ["#3aa0ed", "rgb(58,160,237)"].includes(compact(value));
const white = (value: string) =>
  ["#fff", "#ffffff", "rgb(255,255,255)"].includes(compact(value));

/** Exact, documented design choice; this does not make its contrast compliant. */
export function isApprovedBrandContrast(control: RenderedControl) {
  return (
    (control.slot === "button" &&
      ((control.variant === "brand" &&
        accent(control.background) &&
        white(control.color)) ||
        (control.variant === "link" && accent(control.color)))) ||
    (control.tag === "A" && !!control.href && accent(control.color))
  );
}

export const contrastTargetKey = (node: NodeResult) =>
  JSON.stringify(node.target);

export function partitionApprovedBrandContrast(
  raw: AxeResults,
  approvedTargets: ReadonlySet<string>,
) {
  const approved: AxeResults["violations"] = [];
  const violations = raw.violations.flatMap((violation) => {
    if (violation.id !== "color-contrast") return [violation];
    const accepted = violation.nodes.filter((node) =>
      approvedTargets.has(contrastTargetKey(node)),
    );
    const remaining = violation.nodes.filter(
      (node) => !approvedTargets.has(contrastTargetKey(node)),
    );
    if (accepted.length) approved.push({ ...violation, nodes: accepted });
    return remaining.length ? [{ ...violation, nodes: remaining }] : [];
  });
  return { results: { ...raw, violations }, approved };
}
