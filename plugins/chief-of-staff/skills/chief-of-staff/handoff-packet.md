# Handoff Packets — what every subagent is told

A subagent starts with nothing but its packet. Write it for a reader who has never seen this repository or this conversation. A `<slot>` you cannot fill is something you have not understood yet: read the source before you send.

Every subagent is one-shot: one packet, one report, then it ends. You never resume or message it. More work is a new subagent whose packet carries the earlier report.

## The skeleton

Every packet is this skeleton, with the role's lines from the sections below.

```text
<The role's opening line.> The repository is <path>, on <branch or worktree>.

## Goal
<What must be true when you are done, as a user or consumer of the project would see it, and why it matters.>

## What I know
<Observations with file paths, line numbers, commands and their output. No theory of the cause, and no preferred design unless the user decided it; then say it is their decision.>

## Starting point
This work began at commit <sha> on <branch>. Everything added since then is this work's own draft: change or undo it freely when the goal needs it. Do not hold a change back to protect users of code added since then. If a change would break something that existed before that commit, report it.

## Scope
In: <what you may change>
Out: <what you must not change, and what another subagent is working on now>

## How to work
<The role's lines.>

## Stop and report instead of improvising when
- the code does not match what this packet describes
- the task needs a file outside the scope
- the change would alter what a user or consumer gets in a way the goal does not state
- a command still fails after one reasonable retry

## Report
<The role's lines.>

## Anything else
Before you finish, tell me anything you noticed that worried you, looked wrong, or made this task harder than it should be, whether or not it is part of the task: a bug nearby, a test that proves nothing, a design that fights the change, a reason to think this task is the wrong fix. Say what you saw and where. Do not fix things outside the scope; report them. If you found nothing, say "Nothing".

This is a single task. Return your report when you are done and end; nobody will send you further instructions, so do not wait for a reply. If you cannot finish, report what stopped you and end. If a command may run longer than three minutes, run it in the background with its output and exit code going to a log, and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.
```

The *Anything else* part and the closing paragraph go in every packet, word for word. Name the model tier when you dispatch.

## Executor

Opening line: `You are implementing one change.`

How to work:

- Test first: write the failing test, run it, confirm it fails for the right reason, then write the code and see it pass.
- This repository has `<integration or end-to-end tests at <path> | no integration tests>`. When it has them, extend that suite in its style.
- Write integration and end-to-end tests as user journeys: do what a user or consumer of the project does, from the outside, and check what they would get. Mock only what cannot run for real.
- For a database or another dependency that can run locally, use `<testcontainers | what the repository already uses>`.
- Make the smallest change that meets the goal. Do not tidy or simplify other code; another agent does that over the whole batch.
- Comments: `<use the appropriate-comments-code skill for every comment you write or edit | the comment rules below>`.
- Run only the tests for your change: `<the exact command, scoped to a file, package, or journey>`. Do not run the full suite, a CI imitation, or a whole-repository build or lint.
- Commit your finished work locally on `<branch>` with a plain message that says what changed. Never push, open a pull request, or publish anything.

Report: what you changed, per file, in a sentence each; each test you added, with the output that showed it failing before the change and passing after; the exact test command and its result; decisions the packet did not cover and the alternative you rejected; what you did not do, and why.

Comment rules, for when `appropriate-comments-code` is not installed:

- Write a comment only for what the code cannot say: why it is this way, a constraint, a trap for the next reader.
- Never restate the line below, narrate what you changed or tried, or tell a future editor what to do.
- No ticket, task, or finding IDs, and no counts of tests, callers, or fields.
- Describe the code as it is now, not its history.
- Leave existing comments alone unless your change made them false.

Parallel executors must not edit the same files in one checkout: give each its own worktree, or scopes that do not overlap. A **fixer** is an executor whose *What I know* also carries the earlier executor's report in full and the findings you confirmed, each with file, line, and how to see it, stating what is wrong and not how to fix it. A **comment clean-up** is an executor on the cheapest tier whose scope is comments only.

## Proof of concept

Opening line: `I need one question answered by trying it.` The goal is a yes-or-no question, followed by what a yes and a no would each look like.

How to work:

- Build the smallest thing that answers the question, in a new directory under `<scratch path outside the work tree>`. Change nothing in the repository.
- Use the real code and the installed versions; read them, do not assume.
- Keep it to minutes. Install nothing into the user's environment, write to no service outside this machine, start nothing heavy. If the question cannot be answered inside those limits, stop and say what it would take.
- Delete what you built once you have your answer.

Report: yes, no, or could not tell; what you ran and what it printed, quoted; what the answer does not cover.

## Test runner

Send one at a time, once per batch, at its end. Skip it when the reviewer already ran the whole suite.

Opening line: `Run the full checks and report the result. Change no files.` The goal lists the commands CI runs, read from the repository's CI config or docs, in order.

How to work:

- Run them one after another, never in parallel.
- A failure is reported, not fixed. Run a failing test once more on its own to see whether it fails every time.

Report: each command, its exit code, and how long it took; each failure with the test name, the error text quoted, the file and line, and whether it failed again on its own; for each failure your read (caused by the change, already broken at the starting point, flaky, or environmental) and why. Nothing else from the output.

## Simplification

Send one over an integrated, reviewed batch that is big enough to be worth it, before the test runner.

Opening line: `Simplify the code one batch of work added, without changing what it does.` The goal says how to see the batch (`git diff <starting point>..<head>`) and what it was for.

How to work:

- `<Use the code-simplification skill, as written, scoped to this diff. | The rules below.>`
- Touch only code this diff added or changed. Behavior stays exactly as it is.
- Every test that exists now must pass unmodified. If a test needs a change, you changed behavior: undo that simplification.
- One simplification at a time, with the scoped tests run after each: `<command>`. Do not run the full suite.
- Look first across the batch: the same logic written twice, a helper that duplicates an existing one, a wrapper called once, dead code, a guard nothing can reach. Then inside each function: deep nesting, several jobs in one function, a name that says nothing.
- Do not merge two near-identical functions, and do not simplify code no test covers. Report both.

Report: each simplification, in a sentence; the test command and its result after the last change; merges you propose and code you left alone.

## Second opinion

The reviewer gets the goal and the change. It never gets your findings, your verdict, the executor's report, or a hint about where to look.

Opening line: `Review one change. Assume it is wrong and find out where. Change no files.` The goal is the one given to the executor, plus how to see the change.

How to work:

- Read the tests before the code. For each, ask whether it would fail if the change were removed or subtly broken.
- Check the change against the goal: what it was meant to do and does not, what it does that was not asked, and whether it is bigger than the goal needed.
- Look for what is missing: an unhandled input, an error path, a caller that was not updated, something mocked that could have run for real.
- Run the tests and report the result: `<the scoped command | the whole suite, when it runs in a couple of minutes>`. Otherwise do not run the full suite.
- Check each finding in the code before you report it. Drop what you cannot show.

Report: findings, most serious first, each with what is wrong, the file and line, how to see it, and what a user or consumer would notice; what you checked and found sound, one line each; what you could not check.

## Reading a report

The report is a lead: open the diff and the cited lines before you believe it. Read *Anything else* every time, record each item, and check it in the source before you act on it or set it aside. "Stopped because…" is a good outcome: decide, then send a new subagent with the answer in its packet.
