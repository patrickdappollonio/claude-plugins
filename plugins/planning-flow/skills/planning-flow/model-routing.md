# Model Routing — who explores, who reviews

Distilled from the `use-premium-models-efficiently` skill; if that skill is
installed, read it too — it governs the general delegation pattern.

## The rule

The **premium** model makes every judgment. That is this session, when the
session runs on a premium model. It combines what the explorers found,
writes the plan, filters the question list, makes the technical decisions,
folds in review findings, and writes the closing message. **Cheaper** models
do bounded work: exploring one question each, running spikes, running the
on-the-spot review panel and its verifier.

The **zero-context reviewer** is the one delegated role that does not run on
a cheaper model. It runs on the **most capable tier your harness offers**.
Its whole value is judgment against the ask with no context, and a weaker
model finds the obvious gaps and misses the expensive ones.

| Provider | Premium (judge, zero-context reviewer) | Cheaper (explorer, spike, panel) |
|---|---|---|
| Anthropic | Claude Fable, Claude Opus | Claude Sonnet, Claude Haiku |
| OpenAI | GPT-5.6 Sol | GPT-5.6 Terra, GPT-5.6 Luna |

Model names change over time. The rule is about relative cost inside
whichever provider you use.

## Per role

| Role | Tier | Why |
|---|---|---|
| Synthesis, drafting, question filtering, authority decisions, closing | premium | judgment |
| Exploration subagents (one bounded question each, in parallel) | cheap | the question is narrow, and the answer comes back with evidence |
| Zero-context reviewer | most capable available | judgment with no context is the whole point |
| Cheap spikes | cheap | one measurable question each |
| On-the-spot review panel and its verifier | cheap | narrow charters; fresh context is the value |
| Installed `adversarial-review` skills | as the skill decides | run them as written |

## The trade you must state

A cheaper explorer misses things and sometimes reports what it expected
rather than what it saw. This is acceptable for two reasons. You read the
evidence it returns, paths, lines, and command output, instead of its
conclusions. The zero-context reviewer also checks the plan against the code
a second time.
Never let an explorer's summary stand in for a fact you needed; ask for the
line.

## If the harness cannot choose a model

Some harnesses run every subagent on the session model. Then: dispatch the
same roles the same way, say once in chat that all roles ran on the session
model, and keep the judgment steps local. If the session itself is on a
cheaper tier, say so and recommend the premium tier for planning work of this
size next time.
