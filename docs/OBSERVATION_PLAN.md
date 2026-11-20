# Intent and outcome observation

Started 2026-11-01 11:53 America/Los_Angeles. Two-hour implementation and validation window.

The external agent (Claude, Codex, or another MCP host) owns the conversation, query planning, provider selection, evidence interpretation, and final answer. APILayer exposes explicit tools over MCP, executes authorized calls, and preserves intent, choices, results, and evaluations. It does not claim to capture private reasoning.

## This implementation

- Add an observation session with an immutable accepted intent, criteria, budget, explicit tool choices, output versions, and criterion-level evaluation.
- Expose provider-specific MCP tools alongside session registration, tool discovery, outcome submission, and session inspection. Keep the deterministic research workflow accessible as historical/local research tooling.
- Preserve observed events separately from agent-stated reasons and human evaluations. Track model identity as reported unless verified by a host integration.
- Keep estimates distinct from provider-reported usage. Reserve budgets atomically, make operations idempotent, and record incomplete attempts after restart.
- Provide review-case evidence for potential refunds, without issuing payments or representing an insurance policy.
- Enable commercial aggregate sharing for all observation sessions under the November 3 workspace policy. Show company usage from the first eligible recorded activity and exclude raw content; no automatic publication to vendors. Independent answer-review minimum samples remain required.
- Replace the primary UI with a quiet dark dashboard: Geist, shadcn primitives, Untitled UI icons, subtle pane shading, normal capitalization, no eyebrow copy.
- Connect Claude and Codex locally, verify protocol and end-to-end execution where authentication permits, test failure paths and persistence, and retain screenshots and reports.

## Evaluation boundaries

A tool success is not a fulfilled intent. A model's self-assessment is not an independent evaluation. A supplied selection explanation is not private chain of thought. A model label supplied by the model is not verified model provenance. A candidate list returned by the catalog does not establish that every candidate was considered. Workspace aggregate sharing does not authorize publication of raw prompts or outcomes. Historical consent events remain in the audit trail.
