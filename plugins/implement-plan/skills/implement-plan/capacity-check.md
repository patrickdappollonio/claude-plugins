# Capacity Check, `/goal`, and the Resume Line

Distilled from the `use-claude-limits-efficiently` skill; if it is installed,
read it too — it owns the pause-and-resume mechanics for hitting the cap
mid-run. Here the capacity check is **advisory**: it produces one line of
context for the user and never pauses the pipeline.

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

## Check real usage — informational, never a gate

The usage figure is context for the user, not a permission slip. **Never
stop the run to obtain it.** Try once, report what you found in one line,
and move on to the split.

Use the host's own usage report if one exists. In Claude Code,
non-interactively:

```sh
claude -p "/usage"
```

Read only the 5-hour session percentage and reset time, and the weekly
percentages. If the host has no usage command, or the command fails, or you
cannot read the report (Codex, a sandbox, a headless run), **say so in one
line and proceed with the estimate labeled as unverified**: "Estimated ~N
agent-runs; I cannot read usage here — run `/usage` if you want to compare."
Never invent a usage figure, never estimate usage from token counts, never
install a tool to guess, and never make the next phase wait on the answer.
If the user later pastes the numbers, fold them into the next resume line.

## Tell the user, then keep going

One line either way, then continue to the split:

- It fits: "Estimated ~N agent-runs; usage is at X% with reset at T; that
  fits."
- It may not fit: say so politely with the numbers — the estimate, the
  observed usage, the reset time — and name the choices they can make
  **while you keep going**: let it run (they may have headroom you cannot
  see), tell you to stop after the current slice, or wait for the reset.
  The default is to proceed. This is information for them to act on, not a
  question you wait for; they answer in plain language whenever they like.
- Usage unreadable: the unverified line above.

At **95% or above** of an active window, the worst case, add a stronger
warning that the run may get close to the usage cap, that the host may cut
it short, and that in-flight work is safe to resume from the resume line.
Still do not stop on your own: the user asked for the plan to be
implemented, the host enforces its own limits, and **the user can interrupt
a live run at any moment (Esc in Claude Code and Codex)**. A stop is only
ever theirs to make — by interrupting, or by telling you in plain words.

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

The gates that need the user (G1–G4 in `SKILL.md`) still pause the loop — that
is by design, and the closing line below is what resumes it.

## The resume line — when there is no `/goal`, or at any gate

Every stop ends the same way, so resuming costs the user a short reply in
their own words:

```
**Where we are:** phase <n> of 10 — <one line>.
**Done:** <slices merged, reviews run>.
**Pending:** <worktrees alive, parked decisions>.
**Needed from you:** <the exact question, with options and your recommendation>.
Say the word and I keep going.
```

There is no keyword. "Go ahead", "approved", "please continue", "yes, option
2", "looks good" — any plain-language reply that answers the question or
signals assent resumes the run; do not ask the user to repeat it in a
particular form. Carry enough state that the next turn can act on such a
reply alone: the
starting branch and commit, the slice list with status, worktree paths, the
review's outstanding findings, and the next action. Do not rely on
conversation momentum — a resumed session may have been summarized.

## If the cap is hit mid-run

The host, not you, decides when the window is exhausted. If it does, let
in-flight executors finish where possible (interrupting loses work), then end
with the resume line so a short reply picks the run back up: name the window that
ran out and its reset time if you know it. If the host has a wake/resume tool,
you may schedule a self-contained wakeup that re-checks usage before
continuing (the `use-claude-limits-efficiently` skill describes chained
wakeups). On resume, compare the reset time with the one you recorded: a
different reset time proves the window rolled over; elapsed time does not.
