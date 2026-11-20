import AxeBuilder from "@axe-core/playwright";
import { test } from "@playwright/test";
import {
  contrastTargetKey,
  isApprovedBrandContrast,
  partitionApprovedBrandContrast,
} from "./approved-brand-contrast";

/**
 * Keep every axe rule enabled. Only the owner's exact brand-color decision is
 * separated from actionable defects; its raw failures stay in test attachments.
 * An empty returned violations array is not a WCAG-conformance declaration.
 */
export default class ProductAccessibility extends AxeBuilder {
  private auditPage: ConstructorParameters<typeof AxeBuilder>[0]["page"];

  constructor(options: ConstructorParameters<typeof AxeBuilder>[0]) {
    super(options);
    this.auditPage = options.page;
  }

  override async analyze() {
    const raw = await super.analyze();
    const approvedTargets = new Set<string>();
    for (const violation of raw.violations) {
      if (violation.id !== "color-contrast") continue;
      for (const node of violation.nodes) {
        // Unresolved frames/shadow targets remain failures, never exemptions.
        if (node.target.length !== 1 || typeof node.target[0] !== "string")
          continue;
        try {
          const control = await this.auditPage
            .locator(node.target[0])
            .evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                slot: element.getAttribute("data-slot"),
                variant: element.getAttribute("data-variant"),
                background: style.backgroundColor,
                color: style.color,
                tag: element.tagName,
                href: element.getAttribute("href"),
              };
            });
          if (isApprovedBrandContrast(control))
            approvedTargets.add(contrastTargetKey(node));
        } catch {
          // A detached/ambiguous selector cannot qualify for the exception.
        }
      }
    }
    const { results, approved } = partitionApprovedBrandContrast(
      raw,
      approvedTargets,
    );
    if (approved.length) {
      const count = approved.reduce((sum, item) => sum + item.nodes.length, 0);
      test.info().annotations.push({
        type: "approved-design-contrast",
        description: `${count} raw contrast failure(s) retained in attachment; not WCAG compliant.`,
      });
      await test.info().attach("approved-brand-contrast-known-failures", {
        body: JSON.stringify(
          {
            note: "Owner-approved exact brand colors. These remain raw WCAG contrast failures, separated from other actionable defects.",
            violations: approved,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
    }
    return results;
  }
}
