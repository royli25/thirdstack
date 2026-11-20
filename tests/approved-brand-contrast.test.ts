import { expect, it } from "vitest";
import type { AxeResults, NodeResult } from "axe-core";
import {
  contrastTargetKey,
  isApprovedBrandContrast,
  partitionApprovedBrandContrast,
  type RenderedControl,
} from "./browser/helpers/approved-brand-contrast";

const brand: RenderedControl = {
  slot: "button",
  variant: "brand",
  background: "rgb(58, 160, 237)",
  color: "rgb(255, 255, 255)",
};
it("recognizes only the exact approved filled or link-style button colors", () => {
  expect(isApprovedBrandContrast(brand)).toBe(true);
  expect(
    isApprovedBrandContrast({ ...brand, variant: "link", color: "#3aa0ed" }),
  ).toBe(true);
  for (const changed of [
    { slot: "div" },
    { variant: "default" },
    { variant: "outline" },
    { background: "rgb(49, 140, 222)" },
    { background: "rgba(58, 160, 237, 0.8)" },
    { color: "rgb(27, 27, 27)" },
  ])
    expect(isApprovedBrandContrast({ ...brand, ...changed })).toBe(false);
  expect(
    isApprovedBrandContrast({
      ...brand,
      variant: "link",
      color: "rgb(49, 140, 222)",
    }),
  ).toBe(false);
});

it("retains other contrast nodes and every other rule, with raw failures intact", () => {
  const approved = {
    target: ["#brand"],
    html: "<button>Approved</button>",
  } as NodeResult;
  const other = {
    target: ["#other"],
    html: "<button>Other</button>",
  } as NodeResult;
  const raw = {
    violations: [
      { id: "color-contrast", nodes: [approved, other], impact: "serious" },
      { id: "button-name", nodes: [approved] },
    ],
    incomplete: [{ id: "color-contrast", nodes: [approved] }],
    passes: [{ id: "landmark-one-main" }],
  } as unknown as AxeResults;
  const snapshot = structuredClone(raw);
  const filtered = partitionApprovedBrandContrast(
    raw,
    new Set([contrastTargetKey(approved)]),
  );
  expect(filtered.results.violations).toEqual([
    { id: "color-contrast", nodes: [other], impact: "serious" },
    raw.violations[1],
  ]);
  expect(filtered.approved).toEqual([
    { id: "color-contrast", nodes: [approved], impact: "serious" },
  ]);
  expect(filtered.results.incomplete).toBe(raw.incomplete);
  expect(filtered.results.passes).toBe(raw.passes);
  expect(raw).toEqual(snapshot);
});

it("separates only real links using the exact approved accent", () => {
  const link: RenderedControl = {
    slot: null,
    variant: null,
    tag: "A",
    href: "https://example.com",
    color: "rgb(58, 160, 237)",
    background: "rgba(0, 0, 0, 0)",
  };
  expect(isApprovedBrandContrast(link)).toBe(true);
  expect(isApprovedBrandContrast({ ...link, href: null })).toBe(false);
  expect(isApprovedBrandContrast({ ...link, tag: "SPAN" })).toBe(false);
  expect(isApprovedBrandContrast({ ...link, color: "#318cde" })).toBe(false);
});

it("leaves unrecognized targets unchanged and removes only an emptied contrast rule", () => {
  const node = { target: ["#brand"] } as NodeResult;
  const raw = {
    violations: [{ id: "color-contrast", nodes: [node] }],
  } as unknown as AxeResults;
  expect(partitionApprovedBrandContrast(raw, new Set()).results).toEqual(raw);
  const result = partitionApprovedBrandContrast(
    raw,
    new Set([contrastTargetKey(node)]),
  );
  expect(result.results.violations).toEqual([]);
  expect(result.approved).toEqual(raw.violations);
});
