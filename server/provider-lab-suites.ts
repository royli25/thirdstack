import { z } from "zod";
import type { Store } from "./store.js";
import { digest } from "./observation-store.js";
import { ObservationError } from "./observation.js";
import { publicEvidenceUrl } from "./url-policy.js";
import {
  suiteCases,
  suiteMethodology,
  suiteVersion,
} from "./provider-lab-suite.js";
import type { LabSuite } from "./provider-lab-types.js";
const publicUrl = z
  .string()
  .max(4096)
  .transform((value, ctx) => {
    try {
      return publicEvidenceUrl(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message:
          "Use a public HTTPS URL without credentials, IP addresses, or a custom port.",
      });
      return z.NEVER;
    }
  });
export const suiteInput = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
    expectedRevision: z.number().int().positive().optional(),
    cases: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
            title: z.string().trim().min(3).max(160),
            kind: z.enum(["search", "extract"]),
            input: z.string().trim().min(3).max(4096),
            referenceUrl: publicUrl,
            terms: z.array(z.string().trim().min(1).max(160)).max(20),
          })
          .strict()
          .superRefine((c, ctx) => {
            if (c.kind === "extract") {
              try {
                publicEvidenceUrl(c.input);
              } catch {
                ctx.addIssue({
                  code: "custom",
                  message: "Extraction inputs must be public HTTPS URLs.",
                  path: ["input"],
                });
              }
              if (!c.terms.length)
                ctx.addIssue({
                  code: "custom",
                  message:
                    "Add at least one required text marker for extraction.",
                  path: ["terms"],
                });
            }
          }),
      )
      .min(1)
      .max(20)
      .refine(
        (cases) => new Set(cases.map((c) => c.id)).size === cases.length,
        "Case IDs must be unique.",
      ),
  })
  .strict();
export class ProviderLabSuites {
  constructor(private store: Store) {}
  builtIn(): LabSuite {
    return {
      id: suiteVersion,
      revision: 1,
      title: "Public reference checks",
      description: suiteMethodology,
      cases: suiteCases,
      hash: digest(suiteCases),
      createdAt: "2026-11-01T00:00:00.000Z",
      builtIn: true,
    };
  }
  async list(): Promise<LabSuite[]> {
    const rows = await this.store.db
      .prepare(
        "SELECT body FROM provider_lab_suites s WHERE revision=(SELECT MAX(revision) FROM provider_lab_suites WHERE id=s.id) ORDER BY id DESC",
      )
      .all();
    return [
      this.builtIn(),
      ...rows.map((r) => JSON.parse(r.body as string) as LabSuite),
    ];
  }
  async get(id = suiteVersion, revision?: number): Promise<LabSuite> {
    if (id === suiteVersion && (revision === undefined || revision === 1))
      return this.builtIn();
    const row =
      revision === undefined
        ? await this.store.db
            .prepare(
              "SELECT body FROM provider_lab_suites WHERE id=? ORDER BY revision DESC LIMIT 1",
            )
            .get(id)
        : await this.store.db
            .prepare(
              "SELECT body FROM provider_lab_suites WHERE id=? AND revision=?",
            )
            .get(id, revision);
    if (!row) throw new ObservationError(404, "Test suite revision not found.");
    return JSON.parse(row.body as string) as LabSuite;
  }
  async save(raw: unknown, id: string) {
    const input = suiteInput.parse(raw);
    if (id === suiteVersion)
      throw new ObservationError(
        409,
        "Duplicate the built-in suite to edit it.",
      );
    return await this.store.transaction(async () => {
      const old = (await this.list()).find((s) => s.id === id);
      if ((old?.revision ?? undefined) !== input.expectedRevision)
        throw new ObservationError(
          409,
          "This suite changed. Reload it before saving another revision.",
        );
      const suite: LabSuite = {
        id,
        revision: (old?.revision ?? 0) + 1,
        title: input.title,
        description: input.description,
        cases: input.cases,
        hash: digest(input.cases),
        createdAt: new Date().toISOString(),
        builtIn: false,
      };
      await this.store.db
        .prepare(
          "INSERT INTO provider_lab_suites(id,revision,body) VALUES(?,?,?)",
        )
        .run(id, suite.revision, JSON.stringify(suite));
      return suite;
    });
  }
}
