# Product direction

The product records what a person wanted, what an external agent actually did through Two Hands, what it delivered, and how that delivery was evaluated. It should become a reliable evidence layer across agent hosts, rather than another research chat or planning harness.

Two Hands is infrastructure in the consumer's existing conversation. A consumer asks for snowboard recommendations and receives research; session creation, tool routing, authorization, and research spending policy happen internally. New MCP sessions are authorized automatically by backend policy. The consumer's shopping budget remains a product constraint. The operator dashboard is for inspection and evaluation, not a required checkpoint in the consumer journey.

The useful unit is an **accepted intent and a versioned outcome**, not an HTTP request. A tool can return successfully while the answer misses the goal. An agent can report a setup failure honestly without demonstrating poor factual accuracy. Keep those distinctions in every score, case, and commercial dataset.

## Three uses of the same evidence

| Product use                  | Present foundation                                                                                                                                                             | What must come next                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model accuracy               | Fixed criteria, output versions, pass/fail/unknown reviews, coverage, reported model/reviewer provenance, minimum samples                                                      | Verified host/model identity, representative task cohorts, reproducible evaluations, independent review, uncertainty estimates, and controls against selection bias              |
| Refund or insurance evidence | Accepted budget, tool receipts, exact reviewed output, shortfall notes, case resolution, export consistency checks                                                             | A defined coverage/refund contract, authenticated parties, eligibility rules, billing reconciliation, independent adjudication, and an explicitly authorized payment integration |
| Tool-company improvement     | Offered options, actual tool selections, required selection summaries, observed execution, source evidence, downstream output reviews, workspace-wide aggregate sharing policy | A field-specific licensing/consent agreement, attribution methodology, privacy protections, buyer access controls, and a separately reviewed export product                      |

These are connected uses, but they should not share one ambiguous success metric. A provider execution statistic, an agent's explanation, a reviewed answer score, and a claims decision have different meanings and evidence requirements.

## Capture boundaries

The external host owns the conversation, planning, and tool decisions. The `apilayer` MCP server offers named provider tools; it does not silently route, switch providers, run a second planner, or inspect private chain of thought. Brief decision summaries are required for new provider calls and retain agent-reported provenance. Two Hands discovers suitable candidates using the immediate operation and relevant context; the external agent chooses.

An offered tool set records an opportunity to choose. It does not prove attention to every option or establish the counterfactual outcome of a tool not selected. A later vendor dataset should distinguish exposure, selection, execution, and outcome attribution. It should not label every unselected provider as rejected or every successful API call as a fulfilled intent.

The recorded intent is what the agent submitted, authorized under backend policy for MCP-created sessions. It is not proof that a human approved its rubric or that the rubric captures every nuance of the person's original conversation. Backend authorization, operator acceptance, and reported intent remain distinct in the audit history.

## Tool company learning loop

The local demo now supports separate organic selection counts, forced-provider diagnostic runs, attributed usefulness reviews, and baseline/follow-up test plans. It can identify a concrete integration issue without inventing a provider ranking. The first live sample exposed a stale Exa cost estimate and product-page excerpts that matched the right URL but omitted necessary sizing rows. Those are actionable findings; neither proves that one provider is generally better.

The next commercial proof should be a provider fixing one reproducible issue, then showing a repeatable improvement on a predeclared task family with independent evidence review. Interview providers about whether that feedback changes their decisions and what they would pay for it. More recorded calls alone do not establish product value, willingness to pay, or a reliable selection model.

## Next implementation priorities

1. Add authenticated user, host, model, and reviewer provenance before treating local scores or approvals as independently attributable.
2. Develop an evaluation protocol on a bounded task family. Keep assistant grading, human review, coverage, and uncertainty separate; audit disagreements and failure causes.
3. Add trusted usage reconciliation and external evidence custody before making any financial guarantee.
4. Define a vendor data contract around explicit fields and uses. Start with aggregate execution evidence; do not silently broaden existing consent to raw intent, source content, outputs, or explanations.
5. Extend the tool catalog only where it improves measured outcomes or offers a useful choice. Keep client setup and the observation UI small as the catalog grows.

The current local workflow supports product learning and integration validation. It intentionally makes the unresolved identity, evaluation, custody, and payment boundaries visible instead of presenting them as completed capabilities.
