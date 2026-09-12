# Capacity Check, `/goal`, the Resume Block, and Goal Loops

Distilled from the `use-claude-limits-efficiently` skill; if it is installed,
read it too — it owns the pause-and-resume mechanics for hitting the cap
mid-run. Here the capacity check is **advisory**: it produces one line of
context for the user and never pauses the pipeline.

## Back-of-the-napkin estimate

Count agent-runs before you start. Each is one subagent dispatch:

```
executors   = slices × expected rounds (assume 2: build + one fix round)
conformance = 0 agent-runs (you do it) — but budget your own reading
review      = none: 0 (the user's choice at G2)
              quick: 8 reviewers + 1 verifier + 1 validator ≈ 10
              full:  18 + 2 ≈ 20
              fallback panel: 6 + 2 ≈ 8
              runs once, after the cleanup pass; a second run only on a yes
fix rounds  = 1 executor per round, conformance by you; assume 1 round
total       ≈ executors + review + fix rounds
```

A three-slice plan with a quick review is roughly 6 + 10 + 1 ≈ 17 agent-runs;
with a full review ≈ 27; with none ≈ 7. Each executor run on a real codebase commonly costs
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
/goal Every item in <plan file> is implemented and merged into <starting branch>,
or is waiting on a decision or an input only the user can provide; the
conformance review passed item by item; the adversarial review ran and every
confirmed finding is fixed and re-verified or parked as a user decision; the
decisions log is appended to the plan; the worktree-deletion question was asked;
and the resume block (where we are / done / pending / needed from you, with
every command and question written out in full) was delivered.
```

The "or is waiting on the user" clause is not optional. The goal evaluator
judges the condition literally: "every item implemented" can never hold while
one item needs a file from the user's laptop, so the evaluator rejects every
stop, the harness re-prompts, and the user comes back to a wall of
"blocked" one-liners. A condition that counts a delivered resume block as
met gives the loop a legal exit. If the user wrote their own condition
without that clause, say so once, in the first message after the goal is
set, and offer the wording above.

The gates that need the user (G1–G4 in `SKILL.md`) still pause the loop — that
is by design, and the resume block below is what resumes it.

## The resume line — when there is no `/goal`, or at any gate

Every stop ends the same way, so resuming costs the user a short reply in
their own words:

```
**Where we are:** phase <n> of 11 — <one line>. <k> of <m> slices merged (<p>%).
**Done:** <slices merged, reviews run>.
**Pending:** <worktrees alive, parked decisions>.
**Needed from you:** <every open question, with options and your recommendation;
every command or file you need, written out in full>.
Say the word and I keep going.
```

The progress figure is `k / m` where `m` is the number of slices in the
split and `k` the number merged into the starting branch, rounded to a whole
percent; before the split, write "not yet split". It counts slices, never
time or lines. A user who comes back at a random moment reads that one
figure and knows whether to wait or walk away.

**Needed from you** is complete on its own, every time. The command the
user must run appears in a code block; the question they must answer
appears with its options and your pick; the file they must send is named.
Never "the two commands from my last message", "as discussed above", or
"see the earlier recap": the reader's screen holds the last message and
nothing else. Repeating text you wrote an hour ago is the intended cost.

There is no keyword. "Go ahead", "approved", "please continue", "yes, option
2", "looks good" — any plain-language reply that answers the question or
signals assent resumes the run; do not ask the user to repeat it in a
particular form. Carry enough state that the next turn can act on such a
reply alone: the
starting branch and commit, the slice list with status, worktree paths, the
review's outstanding findings, and the next action. Do not rely on
conversation momentum — a resumed session may have been summarized.

## Under a goal loop, every stop is the last message

You are in a goal loop when any of these has appeared in the conversation:
the user said they set a goal; a harness message beginning `A session-scoped
Stop hook is now active with condition:` (Claude Code); a system prompt that
carries an `<objective>` block and says `Continue working toward the active
thread goal` (Codex); or a message beginning `Stop hook feedback:` or `Goal
check-in:`. Once seen, assume the loop is on until the harness reports the
goal cleared or paused. Neither harness tells you which stop the evaluator
will accept, so **every stop is written as if it is the one the user will
read**: the full resume block, never a shortened one.

Between stops, keep chat to one line: the progress figure and the next
action ("4 of 6 slices merged (67%), phase 5 of 11; landing slice E next").
A paragraph written mid-run under a loop is never seen; the block at the
stop is.

When the harness re-prompts and nothing has changed since your last stop —
the same blocker, the same open questions — send the **same resume block
again, word for word**, with one line above it saying the goal check asked
you to continue and the blocker is unchanged. Do not write a shorter
version: a run of shrinking "still blocked" replies buries the one message
that held the commands, and the last thing on screen is the one the user
reads. Identical repeats are the signal that nothing moved. If the goal
condition cannot be met without the user, say so in that line and name the
way out: `/goal clear` on Claude Code, or a reply that supplies the input.
(Claude Code's own instruction forbids suggesting `/goal clear` only after
success; a blocked run is not success.)

On Codex, the loop also punishes status restatements as "no progress" and
lets you mark the goal `blocked` through `update_goal` once the same blocker
has repeated for three consecutive turns. Do that at the third repeat, with
the resume block as the reason, so the loop ends cleanly instead of running
its budget down.

Claude Code force-ends the turn after nine rejected stops in a row and shows
the user "Goal paused". Nine identical full blocks is noisy; nine different
one-liners is the failure this section exists to prevent.

## If the cap is hit mid-run

The host, not you, decides when the window is exhausted. If it does, let
in-flight executors finish where possible (interrupting loses work), then end
with the resume line so a short reply picks the run back up: name the window that
ran out and its reset time if you know it. If the host has a wake/resume tool,
you may schedule a self-contained wakeup that re-checks usage before
continuing (the `use-claude-limits-efficiently` skill describes chained
wakeups). On resume, compare the reset time with the one you recorded: a
different reset time proves the window rolled over; elapsed time does not.
