# What a tool company wants from octolab

Research date: November 11, 2026. Inputs: public writing on agent experience and AI visibility, pricing pages of adjacent products, Flovia's public demo and docs (see `flovia-teardown.md` one folder up), and this repository. **No provider was interviewed for this note.** Everything below is a hypothesis about buyers until someone at a tool company confirms it. Section 7 is the interview plan.

## 1. The buyer's problem in one paragraph

A tool company used to win developers: a person searched, read docs, signed up, and showed up in the company's own analytics. Now an agent often does the finding, choosing and calling. Microsoft's developer team frames the resulting discipline, agent experience (AX), as two questions: **propensity** (does the agent find and choose you?) and **efficacy** (once chosen, does it use you correctly?), with **cost** as the third measure ([Microsoft](https://developer.microsoft.com/blog/what-is-agent-experience-ax/)). The company can see its own API logs. It cannot see the tasks where it was considered and lost, what the agent was trying to do, what else was called alongside it, or whether its result ended up in the answer. That blind spot is what we would sell into.

## 2. Who buys, and what each one asks

| Role | Their question | What they would act on |
| --- | --- | --- |
| Developer relations / developer experience | Do agents use us correctly? Where do they get stuck? | Fix docs, tool descriptions, error messages, examples |
| Growth / marketing | Do agents pick us or a rival, and for which tasks? | Positioning, listings, comparison content |
| Product | What are agents trying to do that we serve badly or not at all? | Roadmap, new endpoints, response shape |
| Sales / partnerships | Which kinds of users and use cases are growing? | Who to pursue, which hosts to partner with |
| Finance / pricing | Does our price or quota make agents back off? | Pricing, free tier, pay-per-call terms |
| Engineering | How do we fail for agents compared with humans? | Timeouts, auth flow, rate limits |

The first two roles are the likeliest first buyers: they already have budgets for docs tooling and for AI-visibility tools.

## 3. What they want to know, by stage

The stages follow the funnel Flovia shows providers. "Have it" refers to octolab on `main` today.

| Stage | What the company wants to know | Data needed | Have it? |
| --- | --- | --- | --- |
| **Discovery** | Was I offered for tasks I can serve? Which tasks never surface me? | Offers per task, eligibility reason, task category | Partly. `tools_offered` records offers and eligibility. No task category |
| **Selection** | When I was eligible, was I chosen? Who won instead, and why? | Offer set, chosen tool, the agent's stated reason, the rival chosen | Mostly. Offers, choices and `statedReason` are recorded. Not reported as win/loss against named rivals |
| **Invocation** | Did calls work first time? What went wrong? | Status, HTTP code, latency, retries, parameter mistakes | Yes for status and latency. Parameter mistakes and retries are not classified |
| **Usefulness** | Did my result get used in the answer? | Evidence links from the final output to my calls | Yes. Outputs cite call IDs |
| **Outcome** | Did tasks that used me succeed? | Graded outcomes linked to my evidence | Yes, where a review exists. Small numbers; not causal |
| **Co-usage** | What am I used with? What replaces me? | Tools called in the same session, order, substitutions after failure | Partly. Same-session co-usage exists. Order and substitution are not reported |
| **Cost and payment** | Did price or quota stop a call? | Over-budget refusals, estimate versus provider-reported cost | Yes. Budget refusals and estimate calibration are recorded |
| **Who** | Which hosts, models and kinds of users? | Host, model, coarse segment | Partly. Host and model are agent-reported. No user segment |
| **Trend** | Is any of this getting better after I changed something? | Before and after on a fixed task set | Partly. Provider lab runs controlled suites; no scheduled runs |

Today's company portal exposes four counts: eligible offered sessions, sessions using the tool, completed calls, successful calls. The table shows we record far more than we report.

## 4. The asks, ranked by how likely a company is to pay

1. **Win/loss against named competitors, by task type.** "You were eligible in 400 tasks and chosen in 180. Tavily took 150 of the rest, mostly on news lookups." This is the centre of Flovia's demo (stage "Selected over competitors") and of every AI-visibility tool. It is the number a growth lead can take to their boss.
2. **The reasons, in the agent's own words.** Aggregated themes from stated reasons: "chose rival because it returns page text", "avoided because price was unclear". We already require a reason on every call. Companies cannot get this anywhere else.
3. **Demand they are missing.** Tasks where no tool, or only a rival, fit. This is roadmap input and the most defensible data we hold, because it comes from real tasks, not prompts the company thought to test.
4. **What to change, with proof it worked.** A specific fix (description, parameter default, price disclosure) and a before/after run. Microsoft's own tests show common AX advice often fails when measured, so companies need measurement, not best-practice lists.
5. **Failure analysis specific to agents.** Wrong parameters, auth friction, truncated results, timeouts.
6. **Co-usage and substitution.** Useful for partnerships and bundling. Interesting, rarely urgent.
7. **Benchmarks.** How they compare with the category on speed, reliability and cost. Wanted, but sensitive: see section 6.
8. **Distribution.** Being recommended more. Companies will ask for this first. Selling it would destroy the credibility of everything above, so it needs a deliberate decision, not a default.

## 5. What we must capture at call time

These cannot be backfilled, so they matter before the consumer side grows.

| Field | Why a company needs it | Status |
| --- | --- | --- |
| Task category (a small fixed list) | Every report is "by task type". Raw objectives cannot be shared | Missing. Highest priority |
| Full offer set with eligibility reasons | Denominator for win rate | Recorded |
| Who chose: agent or octolab | Routed calls are not agent preference | Recorded on `feat/routed-calls` |
| Reason theme (a fixed list derived from the stated reason) | Aggregate "why" without sharing raw text | Missing |
| Call order and what followed a failure | Substitution and co-usage | Order is recoverable from events; not modelled |
| Parameter and error class | Agent-specific failure analysis | Partly |
| Whether the result was cited in the output | Usefulness | Recorded |
| Host and model, marked as reported | Segmenting | Recorded |
| Coarse user segment (builder, researcher, trader) | "Who is using me" | Missing; needs a consent decision |
| Catalog and description version at decision time | Before/after attribution | Catalog version recorded; description text version is not |

## 6. What will make a company distrust it

- **Small numbers.** A win rate over 30 sessions is noise. Show counts and withhold rates below a threshold, as the catalog already does.
- **Our harness is not the market.** The data describes agents that connected to octolab. Say so on every report. The November 3 critique in this folder already names this.
- **Pay-to-play suspicion.** If a company can pay to rank higher, nobody believes the rankings. Keep measurement and placement separate, visibly.
- **Rivals seeing their data.** A company will want to see competitors and will not want competitors to see it. Flovia shows named rivals. Decide the rule early; it shapes the contract.
- **Privacy liability.** They want insight, not custody of someone's prompts. Aggregates and themes, never raw text. This matches current policy.
- **Simulated results sold as real.** Flovia's benchmark is a simulation. Measured data from real tasks is our advantage only if we never blur the two.

## 7. Willingness to pay: the nearest evidence

There is no public price for "agent funnel analytics for API companies". The closest market is AI-visibility tools for brands:

- Entry plans run from about $20 to $295 a month; Scrunch's core plan is $250 and agency plan $500; Profound removed its $99 tier and is now trial or custom enterprise ([IndustryLens](https://industry-lens.com/intelligence/ai-search), November 2026).
- Profound has raised about $155M and Scrunch was acquired by Sitecore in June 2026, so buyers are paying for "how do AI systems see us" ([Surmado](https://www.surmado.com/blog/best-ai-visibility-tools-2026)).
- Those tools measure mentions in chat answers using prompts the vendor runs. None measures real tool selection inside agent tasks.

A reasonable starting hypothesis is a few hundred dollars a month for a self-serve report and a custom price for named-rival analysis and before/after testing. That is a guess to test, not a finding.

## 8. Interview plan

Five to eight conversations, starting with the three companies already integrated (Exa, Tavily, Firecrawl), then two or three API companies without an MCP server.

1. Who at your company owns "how agents use us"? Is there a budget line?
2. What do you look at today to understand agent traffic? What is missing?
3. When did you last change docs, a tool description or pricing because of agents? How did you know it worked?
4. If I showed you tasks where you were eligible and lost, what would you do with it?
5. Which three numbers would you want every Monday?
6. Would you want to see named competitors? Would you accept them seeing you?
7. What sample size would you need before you trusted a win rate?
8. What would make you distrust the data?
9. Do you pay for any AI-visibility or docs analytics tool now? How much?
10. Here is a sample report built from real octolab data. What is useless? What is missing?

Bring a real sample report to question 10. `docs/PRODUCT_DIRECTION.md` already says the next proof is a provider fixing one reproducible issue and showing a repeatable improvement; these interviews should find the first company willing to try that.

## 9. Open decisions

- Do companies see named competitors, or only "category average"?
- Is paid placement ever on the table?
- Which task categories go in the fixed list?
- Does any user segment get collected, and under what consent?
