import type { Task } from "./types.js";
export function organizationKey(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}
export function acceptedOrganizations(task: Task) {
  const grouped = new Map<
    string,
    {
      name: string;
      sourceIds: Set<string>;
      notes: Set<string>;
      evidence: Record<string, Set<string>>;
    }
  >();
  for (const a of task.assessments) {
    if (a.disposition !== "accepted") continue;
    const key = organizationKey(a.organization);
    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        name: a.organization.trim(),
        sourceIds: new Set(),
        notes: new Set(),
        evidence: Object.fromEntries(
          task.intent.criteria.map((c) => [c, new Set<string>()]),
        ),
      };
      grouped.set(key, entry);
    }
    entry.sourceIds.add(a.sourceId);
    entry.notes.add(a.note);
    for (const criterion of task.intent.criteria)
      for (const id of a.evidence?.[criterion] || [a.sourceId]) {
        entry.sourceIds.add(id);
        entry.evidence[criterion].add(id);
      }
  }
  return Array.from(grouped.values()).map((g) => ({
    name: g.name,
    sources: task.sources
      .filter((s) => g.sourceIds.has(s.id))
      .map((s) => ({ id: s.id, title: s.title, url: s.url })),
    notes: [...g.notes],
    criteria: Object.fromEntries(
      Object.entries(g.evidence).map(([c, ids]) => [
        c,
        task.sources.filter((s) => ids.has(s.id)).map((s) => s.url),
      ]),
    ),
  }));
}
export function csvCell(value: string) {
  return `"${(/^[\s]*[=+@\-\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
}
export function resultCsv(task: Task) {
  const rows = acceptedOrganizations(task);
  return (
    "\uFEFF" +
    [
      [
        "Organization",
        ...task.intent.criteria,
        "Evidence links",
        "Reviewer notes",
      ],
      ...rows.map((r) => [
        r.name,
        ...task.intent.criteria.map((c) => r.criteria[c].join(" | ")),
        [...new Set(r.sources.map((s) => s.url))].join(" | "),
        r.notes.join(" | "),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
