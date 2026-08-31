# Model Routing — who executes, who judges

Distilled from the `use-premium-models-efficiently` skill; if that skill is
installed, read it too — it governs the general delegation pattern.

## The rule

The **premium** model (this session, when it is one) is the orchestrator and
the judge: it splits the work, writes the packets, does the conformance
review, reads reviewer output, resolves conflicts, decides technical direction,
and writes the recap. **Cheaper** models execute bounded work: implementing a
slice, running reviewers, verifying findings, applying validated fixes.

| Provider | Premium (judge) | Cheaper (executor) |
|---|---|---|
| Anthropic | Claude Fable, Claude Opus | Claude Sonnet, Claude Haiku |
| OpenAI | GPT-5.6 Sol | GPT-5.6 Terra, GPT-5.6 Luna |

Names drift; the rule is relative cost within whatever provider you run.

## The trade you must state

A cheaper executor is cheaper because it makes more mistakes. That is
acceptable **only** because the judgment layer catches them: the conformance
review, the adversarial review's reading, and the decision about what to fix
stay on the premium tier. **Routing both execution and judgment to the cheap
tier removes the safety net** — and it is the default drift, because the cheap
executor's report reads as if the work were done.

At the split step, say it to the user in one sentence:

> Executing on `<cheap model>`; conformance review and all decisions stay on
> `<premium model>`. Cheaper execution means more mistakes, so the review is
> where the rigor goes.

Then act on it: the executor's report is a lead, never the review.

## Per role

| Role | Tier | Why |
|---|---|---|
| Split, packets, conformance review, authority decisions, recap | premium | judgment |
| Implementing a slice with TDD | cheap | bounded, fully specified by the packet |
| Adversarial reviewers, verifier, validator | cheap (the review skills already do this) | narrow charters; fresh context is the value, not the model |
| Applying validated review fixes | cheap | bounded — but the conformance re-check is premium |
| Tiny or tightly coupled work | premium, locally | coordination would cost more than delegation saves |

## If this session is not on a premium model

Say so, and keep the judgment steps local anyway — do not delegate the
conformance review or the authority decisions downward. Recommend the user
run the orchestrator on the premium tier next time for work of this size.
