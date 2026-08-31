# Capacity Check, `/goal`, and the Resume Line

Distilled from the `use-claude-limits-efficiently` skill; if it is installed,
read it too — it owns the pause-and-resume mechanics for hitting the cap
mid-run.

## Back-of-the-napkin estimate

Count agent-runs before you start. Each is one subagent dispatch:

```
executors   = slices × expected rounds (assume 2: build + one fix round)
conformance = 0 agent-runs (you do it) — but budget your own reading
review      = quick: 8 reviewers + 1 verifier + 1 validator ≈ 10
              full:  18 + 2 ≈ 20
              fallback panel: 6 + 2 ≈ 8
fix rounds  = 1 executor + a quick re-review (≈ 10) per round; assume 1 round
total       ≈ executors + review + fix rounds
```

A three-slice plan with a quick review is roughly 6 + 10 + 11 ≈ 27 agent-runs;
with a full review ≈ 37. Each executor run on a real codebase commonly costs
in the low hundreds of thousands of tokens; reviewers less. This is an
estimate — label it as one.

## Check real usage — never invent it

Use the host's own usage report. In Claude Code, non-interactively:

```sh
claude -p "/usage"
```

Read only the 5-hour session percentage and reset time, and the weekly
percentages. If the host has no usage command, **ask the user to run `/usage`
(or their platform's equivalent) and paste the numbers.** Do not estimate
usage from token counts; do not install a tool to guess.

**Stop rule:** at or above **95%** of the active 5-hour or weekly window, do
not launch new work. Between waves of executors, re-check.

## Tell the user, then let them choose

If the estimate does not comfortably fit the remaining window, say so politely
with the numbers — the estimate, the observed usage, the reset time — and
offer: proceed anyway (they may have headroom you cannot see), start with the
first slice and re-check, or wait for the reset. **Their call.** If it fits,
one line: "Estimated ~N agent-runs; usage is at X% with reset at T; that fits."

## Run it hands-free: `/goal`

Claude Code and Codex both have `/goal`: it sets a session goal condition, and
after each turn a separate evaluator checks whether it is met and keeps the
session working until it is. Hand the user a ready-to-paste condition at
kickoff. Template:

```
/goal Every item in <plan file> is implemented and merged into <starting branch>;
the conformance review passed item by item; the adversarial review ran and every
confirmed finding is fixed and re-verified or parked as a user decision; the
decisions log is appended to the plan; the worktree-deletion question was asked;
and the four-bullet recap (done / decisions / pending / next) was delivered.
```

The gates that need the user (G1–G5 in `SKILL.md`) still pause the loop — that
is by design, and the closing line below is what resumes it.

## The resume line — when there is no `/goal`, or at any gate

Every stop ends the same way, so resuming costs one word:

```
**Where we are:** phase <n> of 10 — <one line>.
**Done:** <slices merged, reviews run>.
**Pending:** <worktrees alive, parked decisions>.
**Needed from you:** <the exact question, with options and your recommendation>.
Reply `continue` to keep going.
```

Carry enough state that the next turn can act on `continue` alone: the
starting branch and commit, the slice list with status, worktree paths, the
review's outstanding findings, and the next action. Do not rely on
conversation momentum — a resumed session may have been summarized.

## If the cap is hit mid-run

Let in-flight executors finish (interrupting loses work). Then stop with the
resume line, name the window that is over threshold and its reset time, and —
if the host has a wake/resume tool — schedule a self-contained wakeup that
re-checks usage before continuing (the `use-claude-limits-efficiently` skill
describes chained wakeups). On resume, compare the reset time with the one you
recorded: a different reset time proves the window rolled over; elapsed time
does not.
