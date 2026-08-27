# Gathering the Evidence

A simplification pass has two kinds of work with very different token costs:
**finding** (which functions exceed the complexity threshold, which pairs share
a shape, which comments narrate, who calls what) and **comprehending** (why the
code is this way, whether a split preserves behavior, whether two functions are
really equivalent). Spend accordingly.

**Ask the user how much parallelism they want before fanning out.** One
question, once: how many subagents may run at a time, and which model tiers
are available. Parallel agents cost tokens the user is paying for and CPU on a
machine they may be using; do not pick a number for them.

**Route by task, not by habit:**

| Task | Tier | Anthropic harness | OpenAI harness |
|---|---|---|---|
| Pattern finding: complexity counts, same-shape candidates, call sites, narrating-comment grep | Cheap | Haiku, Sonnet | Luna |
| Bounded reading: summarize one function's branches, list its callers with context | Mid | Sonnet | Terra (low) |
| Comprehension and judgment: is this pair equivalent, does this split preserve behavior, what is this fence for | Premium | Opus, Fable | Sol (any reasoning level), Terra (medium–max) |
| Making and verifying the change | Premium — the model running this skill | | |

The split is by relative cost within whatever provider you are running, not by
brand; when these names are stale, apply the same rule — the most expensive
model takes the judgment seat, the cheaper tiers take the bounded heavy
lifting. Cheap models find, premium models decide.

**Keep with the premium model:** deciding which functions are worth
splitting or merging, judging whether two functions are equivalent, reading
conflicting finder reports and deciding what matters, making the change,
running the pinning tests, and writing the user-facing summary.

**Delegate to cheap subagents:** repo-wide searches, complexity inventories,
caller lists, same-shape candidate lists, comment red-flag sweeps, and reducing
long tool output to the lines that matter. Split independent slices *before*
reading everything yourself, and run them in parallel only up to the limit the
user gave.

**Write each handoff as if the subagent has no context — it doesn't.** Every
delegated prompt states: the repo path and the exact objective; the files or
directories in scope and anything explicitly out of scope; the evidence format
to return — file paths, line numbers, the command run, the number counted, and
any uncertainty; and stop conditions — if the code does not match the prompt,
a command fails after one retry, or the task needs out-of-scope files, **stop
and report instead of improvising**. A finder that returns "probably around
15" or "looks similar" has returned nothing; ask for the count and the diff.

**Do not delegate** a task that is tiny, tightly coupled to the change you are
making, or one where the validation itself needs judgment — the coordination
costs more than it saves.

**If the harness has one model or no subagents,** do the finding
programmatically instead of by reading: `grep`/`rg` for branch keywords and
comment red flags, `wc -l` for length, the project's complexity tool
(`radon`, `gocyclo`, `eslint` `complexity`, `lizard`) for counts, and
`grep -rn 'functionName('` for callers. Read a file whole only when the
question is about its meaning. Token spend is a cost the user bears; every
file read that a search could have answered is waste.

**Verify every finding yourself before acting on it.** A subagent's report is
a lead, not a fact — a cheap model cannot reliably tell a true positive from a
false one, and it will state both with the same confidence. Before any finding
turns into an edit, the model running this skill must:

- Open the reported location and confirm the pattern is there as described
- Recount a reported complexity number, or re-run the tool that produced it
- Re-diff a reported equivalent pair line by line — "they look the same" from a
  finder is exactly the case that hides a behavioral difference
- Re-run any test or differential check a subagent claims passed, and read the
  output, not the summary

A finding you have not reproduced is a hypothesis. Report it as one if you
report it at all, and never make a change on its strength alone.
