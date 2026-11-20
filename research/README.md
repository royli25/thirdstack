# Two Hands knowledge base

Interesting products, articles, conversations, and ideas to return to while building Two Hands. Start here when discussing product direction, competitors, positioning, or provider needs. The current [product direction](../docs/PRODUCT_DIRECTION.md) remains the source for agreed direction; saving a reference does not adopt its ideas.

## Saved references

| Added      | Note                               | Topics                                                               | Why revisit it                                     | Revisit when                                             |
| ---------- | ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| 2026-11-13 | [Restless](2026-11-13-restless.md) | adjacent products, agent experience, API recovery, provider feedback | Connects API observability to fixes agents can use | Before the next provider interview or positioning review |

## Earlier research

These notes are preserved in place. Their dates, product names, and implementation claims are historical context, not a fresh verification of the current product or market.

| Date       | Note                                                                         | Topics                                                          |
| ---------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 2026-11-11 | [What a tool company wants](2026-11-11-what-tool-companies-want.md)          | buyer hypotheses, provider interviews, feedback, pricing        |
| 2026-11-08 | [Flovia and the provider workbench](2026-11-08-flovia-provider-workbench.md) | adjacent products, provider intelligence, measurement to action |
| 2026-11-08 | [Tool routing workspace](2026-11-08-tool-routing-workspace.md)               | OpenRouter, Monid, dashboard references, routing                |
| 2026-11-03 | [Pivot options](2026-11-03-pivot-options.md)                                 | strategy, agent commerce, evidence, evaluation                  |

## How we use it

Tell the agent “save this to the knowledge base” with a link or idea. Optional context such as “I like their onboarding” is worth keeping verbatim. The agent should:

1. Search this index and existing notes for the same source. Update an existing note when appropriate; retain its original capture date and record the new review date.
2. Create `YYYY-MM-DD-short-name.md` from [the note template](_template.md). Keep the capture short: source, takeaway, relevance to Two Hands, and a concrete revisit trigger. An unread link can be saved as `captured` with unknowns left explicit.
3. Distinguish published claims, things actually tested, and our interpretation. Link claims to their sources, date the review, and preserve any reason the user gave for saving it. Never invent that reason.
4. Add a row above and link related notes. Use a few plain topic terms so both humans and agents can find it.
5. When we revisit, append a dated outcome: what changed, what we learned, and whether anything was adopted, deferred, or dismissed. Put agreed product changes in the relevant product doc or issue and link back here.

Use `captured`, `reviewed`, or `archived` for a note's status. `Reviewed` means someone read and summarized the sources; it does not mean the product was tested or its claims independently verified. Recheck changing claims before using them in a decision. Revisit triggers are prompts for future work, not scheduled reminders.

Search from the repo with, for example:

```sh
rg -n -i 'recovery|provider feedback|restless' research
```

## Why this format

For our current workflow, Markdown in this repo keeps references next to the product context and accessible to both Claude and Codex. Git can retain the history, links connect ideas, and there is no second account or synchronization step. This works best while capturing and revisiting through our coding conversations is convenient.

Keep this as the single source for now. If browser/mobile capture or collaboration outside the repo becomes frequent, reassess a shared notes tool. If we want a visual notes interface, these Markdown files can also be opened in a compatible local notes editor without moving the source. No application feature or database is needed to start collecting useful knowledge.
