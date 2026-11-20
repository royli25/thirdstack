export type DashboardSection =
  | "overview"
  | "tools"
  | "activity"
  | "requests"
  | "usage"
  | "routing"
  | "connections"
  | "credits"
  | "keys";
export const dashboardSections = [
  "overview",
  "tools",
  "activity",
  "requests",
  "usage",
  "routing",
  "connections",
  "credits",
  "keys",
] as const;
