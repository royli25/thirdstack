/**
 * Fixed vocabularies that let seller reports group activity without exposing raw text.
 * Both values are supplied by the calling agent, so they are agent-reported, never observed.
 */
export const taskTypes = [
  "current_events",
  "company_or_market",
  "technical",
  "product_or_shopping",
  "academic_or_longform",
  "people",
  "other",
] as const;
export type TaskType = (typeof taskTypes)[number];
export const taskTypeLabels: Record<TaskType, string> = {
  current_events: "News and recent events",
  company_or_market: "Company and market research",
  technical: "Technical documentation",
  product_or_shopping: "Product comparison",
  academic_or_longform: "Academic and long-form",
  people: "People lookup",
  other: "Other",
};

export const reasonThemes = [
  "needs_page_text",
  "semantic_match",
  "excerpts_sufficient",
  "lower_cost",
  "recency",
  "domain_restricted",
  "known_url",
  "follow_up",
  "reliability",
  "other",
] as const;
export type ReasonTheme = (typeof reasonThemes)[number];
export const reasonThemeLabels: Record<ReasonTheme | "unclassified", string> = {
  needs_page_text: "Needed page text with the results",
  semantic_match: "Conceptual query, not keywords",
  excerpts_sufficient: "Short excerpts were enough",
  lower_cost: "Lower cost per call",
  recency: "Needed recent results",
  domain_restricted: "Search limited to chosen sites",
  known_url: "Already had the page address",
  follow_up: "Followed up an earlier result",
  reliability: "Expected it to be more reliable",
  other: "Another reason",
  unclassified: "No theme given",
};
