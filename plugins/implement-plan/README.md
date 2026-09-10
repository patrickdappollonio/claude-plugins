# Implement Plan

Turn an agreed plan into merged, reviewed, tested, documented code — mostly hands-free, and
without deciding for you what is yours to decide. Every question it has for
you is asked in plain text with options and a recommendation, so it works in
any agent and can be answered while you are away.

You planned the work (plan mode, a `visual-plan`, a plan file, or a design you
agreed in chat). This skill is the "now build it" step: the agent splits the
plan into independent slices, gives each one a git worktree and a cheaper
executor working under strict TDD, then does the part that usually gets
skipped — it checks every slice **against the plan, item by item**, cleans up
the merged code, asks which adversarial review you want (quick, full, or
none), runs that one review, and fixes what it finds. Technical decisions are the agent's and get logged at the end of the plan
in plain language; operational and functional decisions are yours and get
parked with a recommendation, never assumed.

## What it does

- **Reviews the plan before building it** — recommends an adversarial review of
  a visual plan (or offers one for any other plan) so a wrong plan is not
  built faithfully.
- **Records the starting point** and recommends a branch once; whatever you
  choose, every slice merges back into that branch, and nothing is pushed.
- **Estimates capacity** with back-of-the-napkin math, reports real usage
  when the host can show it, warns politely if the work will not fit, and
  hands you a ready-to-paste `/goal` condition (Claude Code and Codex) so the
  run is hands-free. The check is informational: it never pauses the run.
- **Splits and dispatches** — one worktree and one executor per independent
  slice, cheap models for execution, the premium model for every judgment,
  with the trade stated out loud.
- **Executors follow TDD with unit tests as the floor — and update the docs
  in the same diff.** Every document that describes the behavior a slice
  changes (README, `docs/`, help text, CHANGELOG, specs, docstrings) is found
  and updated alongside the code; there is no separate documentation pass, and
  a slice whose docs still describe the old behavior is not done. Before
  writing any test, executors map the tests that already cover the surface
  and count the overlap — when an existing test on the same command or
  function already performs 60% or more of a new test's setup and action
  steps, the case goes into that test, and the review recounts every new
  test and sends duplicates back. Journey-style
  integration/E2E tests (real CLI, real endpoints; mock only what cannot run
  for real) and real dependencies via testcontainers are recommended, and you
  decide how much of that is enough. Executors also obey the
  minimum-sufficient-change discipline (see *Credit*).
- **Conformance review** on the premium model: enumerate the plan's promises,
  point at the line, the test, and the document for each, grep the docs for
  stale descriptions, send gaps back.
- **Cleans up before the review.** Once every slice is merged, one
  code-changing pass runs over the merged diff: the
  `appropriate-comments-code` skill (or its distilled version) rewrites or
  deletes every comment that narrates the session, restates its line, cites a
  finding or slice label, or is documentation in a comment's seat; then the
  `code-simplification` skill (or its distilled version) flattens nesting,
  names things, and removes dead code without changing behavior — every
  existing test must pass unmodified, and a merge of two look-alike functions
  is proposed to you, never made. Its two reference files are read fresh at
  that step, not recalled from the start of the run.
- **One adversarial review, at the end, on your say-so.** A panel is the most
  expensive step in the run, so it never starts on its own. After the cleanup
  pass, the agent sizes the change, recommends the `adversarial-review-quick`
  skill for small changes or the full `adversarial-review` skill for large
  ones (an on-the-spot six-reviewer panel when neither is installed), and
  asks which you want, or none. It runs exactly one, fixes what it finds, and
  asks again before any second review.
- **Never deletes a worktree without asking** — the last step before the recap
  is the deletion question.
- **Ends with four bullets:** what was done, decisions made, pending for you,
  what's next.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install implement-plan@patrickdappollonio
```

**Codex CLI** (after `codex plugin marketplace add patrickdappollonio/claude-plugins`):

```
codex plugin add implement-plan@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via
[`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill implement-plan
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to
target one agent. Update later with `npx skills update`.

## Running it

Once a plan is agreed:

> *"Implement the plan we agreed on."*

or invoke it explicitly:

```
/implement-plan:implement-plan
```

It pairs with, but does not require, the `visual-plan`, `adversarial-review`,
`adversarial-review-quick`, `use-premium-models-efficiently`, and
`use-claude-limits-efficiently` skills from this marketplace: when they are
installed it uses them; when they are not, it carries a distilled version of
each so it works standalone — and if you ask, it tells you how to install any
of them on Claude Code, Codex, or via `npx skills`.

## Credit

The executor discipline — minimum sufficient change, the
Outcome/Non-goals/Files/Proof mini-plan, the pause-and-confirm list, and "done
means" — is adapted from [@voxyz_ai](https://x.com/voxyz_ai).
