---
name: implement-plan
description: Use when the user has an agreed plan — a visual plan, a plan-mode plan, a plan file, or a design agreed in chat — and asks to implement, execute, build, or "do the work we agreed on", especially when the work is big enough to split across subagents and worktrees, must be checked against the plan afterwards, and must run mostly hands-free.
---

# Implement Plan

## Overview

Turn an **agreed plan** into merged, reviewed, tested, documented code — hands-free where
possible, and never deciding for the user what is theirs to decide. The
orchestrator (you) plans the split, dispatches executors, checks their work
against the plan **thoroughly**, runs an adversarial review, fixes what it
finds, cleans up the comments and the shape of the code it merged, and keeps
going until the plan is done.

The executor discipline in this skill (minimum sufficient change, the four-line
mini-plan, pause-and-confirm, "done means") is adapted from
[@voxyz_ai](https://x.com/voxyz_ai). The orchestration around it — worktrees,
conformance review, adversarial review, model routing, capacity, the
keep-going contract — is this skill's own.

**Three rules bind everything below:**

1. **The plan is the spec.** Work is measured against what was agreed, item by
   item — never against "does it look right".
2. **Technical direction is yours; operational and functional direction is the
   user's.** Never assume for them. The table under *Two Authorities* decides
   which is which.
3. **Keep going.** Stop only at the named gates, and when you stop, make the
   resume a single word.

## Read the Companion Files First

This skill ships in two layers. `SKILL.md` carries the rules and a summary of
each step; six files beside it carry the full procedures:

- `handoff-packet.md` — the executor prompt: scope, TDD, the test map, the documentation rule, user-journey tests, the executor discipline, stop conditions
- `conformance-review.md` — the thorough plan-vs-work check, item by item
- `adversarial-review-fallback.md` — how to run the installed review skills, the plan-as-diff variant, and the on-the-spot panel when no skill is installed
- `model-routing.md` — which model executes, which judges, and the trade you must state
- `capacity-check.md` — the back-of-the-napkin estimate, the advisory usage check, `/goal`, and the resume line
- `companion-skills.md` — the skills this one uses when installed (`adversarial-review`, `adversarial-review-quick`, `visual-plan`, `appropriate-comments-code`, `code-simplification`, `use-premium-models-efficiently`, `use-claude-limits-efficiently`), what each adds, and how to install them on Claude Code, Codex, or via `npx skills`

**The first time you use this skill in a session, read all six before doing
anything else** — before opening the plan, before sizing the work, before
answering a question about it. The summaries here are reminders for a reader
who has already seen the full text; they are not a substitute for it. Re-read
the relevant file at the step that names it. If a file is missing, say so and
work from the summary — do not pretend the summary was the whole skill.

Two more files are **not** part of that first read. They belong to the last
code-changing step, and they are read there, fresh, immediately before the
pass they describe — never recalled from an earlier read:

- `appropriate-comments-fallback.md` — the comment pass over the merged diff: the labels, rewrite-or-delete, the ratio check, and how to run the installed `appropriate-comments-code` skill instead
- `code-simplification-fallback.md` — the behavior-preserving simplification pass: the signals, one change per test run, merges as proposals, and how to run the installed `code-simplification` skill instead

Every companion skill is optional: this skill carries a distilled version of
each, and uses the real one when it is installed. If the user asks how to
install one, read `companion-skills.md` and give them the commands for their
harness — do not install anything yourself mid-run.

## When to Use

- The user says implement / execute / build / "do the work we agreed", and a plan exists: a visual plan, a plan-mode plan, a plan file, or a design agreed in this conversation.
- The work has several parts, some independent, and the user wants it done while they are away.

**When NOT to use:**

- There is no agreed plan. Say so and stop: this skill executes agreements, it does not invent them. Point the user to planning (the `planning-flow` skill, plan mode, or the `visual-plan` skill).
- The change is one small edit in one file. Do it directly with TDD; the machinery below would cost more than the work.

## Two Authorities

| Yours (technical) — decide, then log it | The user's (operational / functional) — ask, never assume |
|---|---|
| Data structure, algorithm, file layout, naming, error type | What the user sees: output format, wording, new flags or syntax, defaults |
| Which test framework pattern to follow; how to isolate a test | Whether a behavior the plan left open should exist at all |
| How to fix a bug the review found, when the fix is invisible to users | A fix that changes user-visible behavior, an API, a schema, a stored format |
| Order of slices, worktree layout, which model executes | Anything the plan marks "not decided", "TBD", or "user to decide" |
| Keeping a plan-specified detail when the plan's own example contradicts it | Deviating from what the plan specifies — even to "improve" it |

**The tell:** if a reasonable user could say "I didn't want that", it is theirs.
"The user pre-authorized fixing whatever the review finds" covers *how* to fix
defects, never *whether* to change what the product does. Log every technical
decision at the end of the plan (see *Decisions log*); park every functional
one under *Pending for you* and build the rest.

**A technical decision that changes what users or operators experience is no
longer technical — it is the user's.** The category of the choice does not
decide who owns it; its consequence does. Before you make any technical call,
trace its effect: does it change output, ordering, timing, defaults, error
behavior, what gets stored or where, how the thing is deployed, configured,
monitored, or paid for? If yes, park it with your recommendation, even though
the choice started life as "just an implementation detail". Examples that
cross the line: a storage format change that makes old files unreadable; a
faster algorithm that changes the order of tied results; a retry policy that
changes how long a failure takes to surface; a dependency that adds a runtime
requirement or a cost; a cache that changes when data looks fresh. Examples
that stay yours: the same behavior with a different internal structure, name,
or test layout.

## Keep-Going Contract

Default: **do not stop between phases.** Capacity → split → dispatch →
conformance → adversarial review → fix → iterate → comment and simplification
pass is one continuous effort.

The **only** legitimate stops, each a gate below: (G1) the starting-point
question, (G2) permission to run the full adversarial panel, (G3) a functional
or operational decision the plan leaves to the user **when the next slice cannot
proceed without it**, (G4) worktree deletion. Not a stop reason: "let me
check in", "the session is long", "I'll ask before the next slice", "the user
should see progress first", "I need the usage numbers first". Capacity is
information you hand over in passing, never a gate: an unreadable usage
report gets one line and the run continues.

**Every stop ends with the same closing.** State the phase, what is done, what
is pending, the exact question, and that you will keep going as soon as they
answer. **No keyword**: "go ahead", "approved", "please continue", "yes, the
first option" all resume the run — read the reply for its meaning, never
demand a specific word. Carry enough state that such a reply resumes the work
(`capacity-check.md`).

**How to ask.** Ask in plain text, in the message itself — not through a
harness-specific question tool. Give the options, the consequence of each,
and your recommendation, then stop. Plain text works in every harness, and a
question with its reasoning beside it is the one the user can answer while
away. Bundle every open question into one stop, so one reply resumes the run.

When `/goal` is available (Claude Code, Codex), hand the user a ready-to-paste
goal condition at kickoff (template in `capacity-check.md`); the gates still
pause the loop by design. Without `/goal`, the closing line is the loop.

## The Process

Do every step in order. Gates are marked. Read the named file at its step.

### 0. Locate the plan and check it was reviewed

Find the agreement: the visual plan's file, the plan-mode plan, the plan file,
or the chat agreement (quote it into a file so executors can read it). A plan
file under `.plans/` or `.planning-flow/` at the repo root comes from the
`planning-flow` skill: its *Decisions* section is already decided — every
entry there is settled, by the user or on their behalf, and is never re-asked
— and its tickets are the plan items, with *Depends on* fixing the order and
*Size* sizing the slice. Append the decisions log (step 9) to that same file.
Then:

- **Visual plan** → if no adversarial review of the *plan* has run, **recommend
  one** before building; a wrong plan built faithfully is the most expensive
  failure. Run it as `adversarial-review-fallback.md` § *Reviewing a plan*
  describes (the plan is an all-additions diff; the brief is the user's ask).
- **Any other plan** → offer a quick plan review; the user may decline.
- A review already ran → say so and move on.

### 1. Record the starting point — G1

Capture and state: `starting branch`, `starting commit`, clean or dirty tree.
**Recommend a branch once** if the user is on `main` or a shared branch:
*create a branch* (name it) / *stay on this branch*, with your recommendation.
If they stay, that is the answer — no second nag. In the same stop, state the
**testing depth** you will require (see *Testing*) so they can raise or lower
it in the same reply. **Everything merges back into the
starting branch, whatever it is.** Never push, never open a PR, unless asked.

### 2. Capacity check

Read `capacity-check.md`. Estimate the agent-runs the plan will cost (slices ×
rounds + conformance + review + fixes) and try once to read real usage with
the host's usage command. Report both in one line and **keep going**: this
step is informational. If usage cannot be read, say so and label the
estimate unverified; if the estimate looks like it will not fit, say so
politely with the numbers and name what the user can do (let it run, tell
you to stop after this slice, wait for the reset) while you proceed. Never invent a usage figure,
and never stop to ask the user for one — the split starts in the same turn.
Then suggest `/goal` with the condition template.

### 3. Split the work

For each plan item decide: independent, or depends on another. Independent
items with no shared files become **slices**; each slice gets a git worktree
off the starting commit and one executor. Dependent items run after their
prerequisite merges. Keep coupled or tiny work local. Default throttle: at most
**3 executors in flight**.

```bash
git worktree add ../<repo>-<slice> -b <slice-branch> <starting-commit>
```

State the split to the user in one paragraph: slices, order, model per role
(next step), and the trade that implies.

### 4. Dispatch executors

Read `model-routing.md` and `handoff-packet.md`. Executors run on the cheaper
tier by default; judgment (this session, the conformance review, the review
fixes' validation) stays on the premium tier. **Say the trade out loud:** a
cheaper executor makes more mistakes, so the review is where the rigor goes —
never route both execution and judgment to the cheap tier.

Every packet is self-contained (the executor has no chat context): repo path,
the plan section verbatim, in/out of scope, **TDD required**, **documentation
required**, the repo's integration/E2E conventions, the user-journey testing
rule, the executor discipline, evidence format, stop conditions. Parallel slices go out in one
message.

### 5. Conformance review — thorough, not a skim

Read `conformance-review.md`. Before any review skill runs, **you** check the
work against the plan: enumerate every promise in the plan section, then for
each one point at the diff line that fulfils it, the test that proves it, and
the document that describes it — or the search that showed no document does.
Record *missing*, *different*, *extra*, *undocumented*, *duplicated*
(a new test where an existing test on the same command or function already performs 60% or more of the new test's setup and action steps), and
*undecided-but-decided*. Any of the first five → back to step 4 with a
corrected packet that quotes the gap. An
"undecided-but-decided" item is a functional decision the executor made for the
user: revert it to the plan and park it under *Pending*.

Merge a passing slice into the starting branch; then unblock its dependents.

### 6. Adversarial review

Read `adversarial-review-fallback.md`. Size the merged change:

| Change | Review |
|---|---|
| ≤ 300 changed lines **and** ≤ 5 files **and** one subsystem **and** no schema/auth/concurrency/external I/O | **Small → Quick** — run without asking |
| Anything else — one line over, one file over, or one of those angles touched | **Large → Quick now, then Full after G2** |

The line is hard: "one over" is over. A large change does **not** wait for
permission before any review runs — run the quick panel immediately (it needs
no permission), fix what it finds, and **then** stop at **G2** to ask whether
to run the full panel on the result. That ordering keeps the run hands-free
and still puts the token-heavy decision in the user's hands. If they decline,
say in the recap which angles went unreviewed.

Prefer the installed skills — `adversarial-review-quick` for the quick panel,
`adversarial-review` for the full one — **run as written** — their verifier and fix validator are part of the review;
reproducing a finding yourself is extra evidence, never a replacement for
them. Neither installed → run the on-the-spot panel from the fallback file.
Give every reviewer the plan as the brief, verbatim, plus the announced
deviations.

### 7. Fix everything it found — with the authority split

Fix every confirmed finding. A fix that is invisible to users → do it, log it.
A fix that changes user-visible behavior, syntax, defaults, an API, or storage →
**park it under *Pending* with the recommended fix**, unless the plan already
decided that behavior. A `design_is_wrong` finding is always the user's.
Re-run conformance on the fixes, then re-review the fixed diff with a quick
panel — **every** fix round, including the last small one; a fix nobody
reviewed is an unreviewed change. The loop ends when a review returns no
confirmed findings, or after **three** fix rounds — then park what remains
under *Pending* with the validated fixes as recommendations. **You assess
every iteration; executors never grade themselves.**

### 8. Comment and simplification pass

The last step that changes code. Before touching anything, run this pre-flight
and tick each line in your todo list — the pass does not start until all four
are true:

- [ ] Checked the harness skill list for `appropriate-comments-code` and `code-simplification`; recorded which is installed. **An installed skill is the pass** — it is the full procedure, and it is run as written, in its own review-a-diff mode, scoped to the merged change. The fallback file is for the skill that is absent.
- [ ] For each skill **not** installed, the matching file — `appropriate-comments-fallback.md`, `code-simplification-fallback.md` — read **now**, in full: not at session start, not from memory
- [ ] `conformance-review.md` and `adversarial-review-fallback.md` re-opened, because both run again on this pass's diff
- [ ] Scope fixed to the merged change, `git diff <starting-commit>..HEAD`; nothing outside it is opened up

- **Comments first.** Every comment the run added or changed is a finding
  until it passes: it restates the line, narrates how the code got here, is
  documentation in a comment's seat, cites a finding number, slice, wave, or
  pass label, counts things that live elsewhere, names something that does not
  exist, or is stale. Rewrite or delete — never keep as-is, never merely
  shorten; relocate accurate documentation and say where it went. Existing
  comments in test files are left alone. The pass changes comment lines only.
- **Then shape.** Behavior-preserving only, one change per test run, every
  existing test passing **unmodified**; a test that needs a tweak means the
  behavior changed — revert. Flatten nesting, name generic things, remove dead
  code and once-called wrappers, split functions whose decision count is over
  ten along decision clusters. A function no pre-existing test covers is not
  simplified; it is parked with the change you would make. **A merge of two
  near-identical functions is a proposal under *Pending*, never made here.**
- **The authority split holds.** Anything that would change output, ordering,
  defaults, error text, an API, a stored format, or a public signature is not
  a simplification — park it. Log each simplification you made in the
  decisions log, one line each.
- **It is still a change.** If the pass moved any code line, re-run
  conformance on the touched files, then a quick adversarial panel on the
  pass's diff exactly as a fix round gets one; fix or park by the split. A
  pass that changed comment lines only needs neither. No second pass after
  that review.
- **The ratio check is not a gate.** A file whose changed region is still half
  comments after the pass goes to *Pending for you* with the ratio, what the
  comments say, and the recommended home; the material moves to the decisions
  log with short pointers left in the code. The run keeps going.

### 9. Decisions log

Append a `## Decisions made during implementation` section at the **end of the
plan file** (the visual plan when there is one — it live-reloads; otherwise the
plan file; otherwise the chat summary). One bullet per technical decision, in
plain language: what was chosen, the alternative, and why. Functional items
waiting on the user go in the same place with the recommended option; in a
visual plan, use a `question` fence so the answer comes back as a comment.

### 10. Worktree cleanup — G4

List every worktree and branch you created, with its merge status. **Ask**,
in the message: delete all / keep all / choose. **Nothing is deleted until
the answer arrives.** "They are fully merged" is not consent. If kept, list them
under *Pending for you*.

### 11. Recap

Exactly these four bullets, short:

- **What was done**
- **What were the decisions you made** (technical, with the reason)
- **What's pending for me to decide on** (functional/operational, each with your recommendation)
- **What's next**

## Testing and documentation — the floor is TDD plus current docs; the rest is the user's to size

**The user decides how much testing is enough.** The skill sets a floor,
recommends more where it pays, and never demands the full stack up front.
The floor has two parts, and both are mandatory on every slice.

- **Floor — always required: TDD with unit tests.** For every behavior the
  slice changes: a failing test first, watched to fail, then the minimum code,
  then green, then refactor. No test-after. Unit tests are what prove a change
  works and keep working when the next change lands — this is the one thing
  the skill insists on even when the user asks for "just the code".
- **Floor — always required: map the existing tests and count the overlap
  before writing one.** Before the mini-plan, the executor finds every test
  on the surface the slice changes — the command, function, endpoint, or
  type the code lands in, never the feature name — and writes one entry
  per behavior in a **test map**: the nearest existing test (the one that
  calls the same command or function and shares the most setup steps with
  the test the executor would write), the setup and action steps of that
  would-be test, each marked when the nearest test already performs it,
  and the share: marked steps divided by listed steps, as a percentage.
  Assertions are not steps and never make a test new. **At 60% or more the
  case is added to that test**: a table row, a workflow step, an assertion
  after the step it checks. Under 60%, a new test is written and the step
  list stays in the map as the evidence for that decision. When the plan's
  acceptance criterion already names the test, that test is the answer and
  no count is needed. A new test at 60% or above, one with no list, or a
  "nearest: none" for a command some test already calls, comes back from
  the conformance review with a recount.
  The full procedure and the entry shape are in `handoff-packet.md`.
  "No test mentions the feature" is never a gap; "no test asserts on the
  file" is never a gap; "the existing test would lose focus" is never a
  reason. Reading the existing suite costs minutes; a duplicate costs every
  future change.
- **Floor — always required: documentation updated in the same diff.** A
  slice is not done while any document that describes the behavior it
  changed still describes the old one. Before the mini-plan, the executor
  searches the repo for every document that mentions the surface it is
  changing — README and `docs/`, CLI help and usage text, man pages, config
  and environment-variable references, CHANGELOG when the repo keeps one,
  OpenAPI or schema files, example and sample files, doc comments and
  docstrings on the public API touched — lists them under **Files**, and
  updates them alongside the code. There is no separate documentation pass:
  the slice ships with its docs or it does not ship. When the search finds
  nothing, the evidence says so and names what was searched. Existing
  documents are extended; a document that does not exist is created only
  when the plan calls for it — otherwise report the gap.
- **Encouraged, optional — integration / E2E as user journeys.** When the
  repo already has integration or E2E tests, executors follow their layout,
  runner, and conventions for the behavior they touch. When it does not,
  recommend journey tests for user-facing surfaces (run the real CLI, hit the
  real endpoint) and let the user decide; do not add a test tier the user did
  not ask for. When journeys are written: **one journey owns each workflow**
  — a feature on a workflow an existing journey walks is a step or branch in
  that journey, counted the same way: at 60% or more shared setup and action
  steps it goes into the existing journey — and **mock only what cannot run for
  real** (third-party services, the clock, external networks); everything
  else runs from the real codebase.
- **Encouraged, optional — real dependencies.** For databases, queues, caches
  and similar, recommend testcontainers (or the repo's equivalent) over fakes;
  the user chooses.
- No new test infrastructure for one task; test the behavior the plan
  changes, do not backfill unrelated coverage.

State the depth at G1 in one line — *"Testing: TDD with unit tests and docs
updated in the same diff; a case where an existing test already performs
60% or more of its setup and action steps goes into that test; the repo has
no integration tests, so
I'll add none unless you want CLI journey tests (recommended for the new
commands)."* — and put whatever the
user chooses in every packet. The three floors go in every packet regardless.

## Executor Discipline (summary — full text in `handoff-packet.md`)

Minimum sufficient change. Read the real code and the tests that already
cover it before editing. Write the four-line mini-plan (**Outcome / Non-goals
/ Files / Proof**) before touching anything; **Proof** holds one test-map
entry per behavior: nearest existing test, marked step list, extend or new. Reuse before
adding — tests included; fix at the root; no abstraction for one caller;
no future-proofing; remove what you replace. Stop and report instead of
improvising when scope grows, a dependency is needed, a public surface changes,
or data would be lost. Done means: behavior works, every document that
describes the changed behavior is updated in the same diff, exact commands and
results reported, nothing unrelated in the diff, no debug or scratch left,
assumptions stated plainly.

## Rationalizations — Observed, and Wrong

| Excuse | Reality |
|---|---|
| "The user pre-authorized fixing whatever the review found" | That authorizes *fixing defects*. A fix that changes what users see or type is a functional decision. Park it. |
| "They were merged, so I deleted the worktrees" | Merged is not consent. Deletion waits for G4, always. |
| "I recommended a branch and created it" | Recommending is asking. Creating one unasked moves the merge target and leaves the user with a branch they never chose. |
| "The user is away, so I skipped the permission question" | Absence does not grant permission. Stop with the closing line; resuming costs them a short reply in their own words. |
| "It's one file over the threshold, and asking would block for hours, so I ran the quick panel and named the gap" | One over is over. Run the quick panel now, fix, then stop at G2 for the full one — that is the ordering, not a skip. |
| "I reproduced the findings myself, so the verifier was unnecessary" | Your reproduction is extra evidence. The review skill's verifier and validator run as written. |
| "The last fix is 17 lines; my own check is enough" | A fix round without a review is an unreviewed change. A quick panel on 17 lines is cheap; skipping it is not. |
| "The plan's example shows it this way, but keeping the old column is nicer" | The plan is the spec. Deviating from it is the user's call, not yours. |
| "It's a technical choice — storage format, algorithm, retry policy — so it's mine" | Only while its effect stays invisible. The moment it changes what users or operators experience, it is theirs. Trace the consequence first. |
| "Tests pass and the diff is clean, so it matches the plan" | A faithful build of the wrong thing has no failing tests. Enumerate the plan and check item by item. |
| "The user said just the code, so no tests" | Unit tests under TDD are the floor, not an option. Everything above them is the user's to size; the floor is not. |
| "I'll do the docs in a follow-up pass once the code settles" | There is no follow-up pass. Docs are the second half of the floor and ship in the same diff as the code, or the slice is not done. |
| "Nothing user-facing changed, so there are no docs to update" | That is a search result, not a belief. Grep the repo for the surface you touched and report what you searched; "none found" is evidence, "probably none" is not. |
| "A fresh test file is cleaner than editing the old one" | The old one is where the next person will look. A second file for the same surface is a duplicate with a nicer name. Extend it. |
| "No existing test covers priority, so it's a new surface" | Priority is the feature. The surface is `add` and `list`, and both have tests. Grep for the command, count the steps. |
| "Extending the workflow test would blur its single-purpose narrative" | Its purpose is the workflow. The feature is one more step in it. A second copy of the workflow is the blur. |
| "The table can't host this case, it needs a JSON assertion" | Then the table gets a column. A missing column is an edit, not a gap. |
| "Nearest is none — no existing test reads the file back" | Nearest is the test that calls the same command, whatever it asserts. Reading the file back is one more assertion after the `add` that test already makes. |
| "It's 5 of 9 steps, 56%, under the line" | Nine included four assertions, and all four were the unshared ones. Drop them: 5 setup and action steps, all 5 shared. 100%. Extend. |
| "TDD says write a failing test, so I wrote one" | TDD says the test fails first. It does not say the test is new. An added case in an existing test fails first just the same. |
| "The README is out of scope for this slice" | A document that describes the behavior this slice changes is in scope by definition. Only another slice's files are out. |
| "A real project needs journeys and containers, I'll add them all" | Encouraged is not required. State the recommendation at G1 and build what the user chose. |
| "Sonnet wrote it, Sonnet can verify it" | The cheap executor's mistakes are why judgment stays premium. Never cheap on both sides. |
| "The change is small, I'll skip the adversarial review" | Small changes get the quick panel; nothing gets no panel. |
| "Let me pause so the user can see progress" | Not a gate. Keep going. |
| "I'll put the decisions in a new recap document" | The decisions live at the end of the plan file, where the plan is. A new document is extra cost and a second place to look. |
| "No usage tool, so I'll estimate usage" | Never invent a usage number. Say you cannot read it, label the estimate unverified, and keep going. |
| "I can't read usage, so I'll stop and ask for it" | The capacity check is advisory. One line — estimate, usage or "unreadable", reset if known — then the split starts in the same turn. Waiting for numbers is not a gate. |
| "Usage is high, better pause until they confirm" | Warn with the numbers and name the choices, then continue. The host enforces its own limits, the user asked for the plan to be built, and they can interrupt a live run with Esc whenever they want. Stopping is their move, not yours. |
| "The review came back clean, so the code is done" | Clean means no defects. The executors' comments still narrate the session and their helpers still carry slice names. Step 8 runs on every plan. |
| "I read the comment and simplification files at the start, I remember them" | They are read at step 8, fresh, by design — a summary recalled across a long run is what the pass exists to catch in others. Open both files, then start. |
| "I'll simplify this while I'm in the file" | Scope is the merged diff. A refactor of the code around it is its own change. |
| "Those two executors wrote the same function twice, I'll merge them" | A merge changes an API surface and crosses two slices. Diff, count callers, park it under *Pending* with the proposal. |
| "I only shortened the comments, nothing to re-review" | Comment-only changes are the one case that skips the panel. If a single code line moved, the pass's diff gets a quick review like any fix round. |

## Red Flags — Stop and Re-read the Step

- Any `git worktree remove`, `git branch -d/-D`, or `rm -rf` of a worktree before the G4 answer
- A merge into any branch other than the recorded starting branch
- A `git push`, a PR, or a commit to `main` the user did not ask for
- An executor's report used as the conformance review
- A slice merged that changes a flag, default, output, command, or API some document describes, without a change to that document in the same diff
- A new test file or test function whose test-map entry has no step list, or a share of 60% or more
- A test map whose nearest test is "none" while some test already calls the same command or function — the grep was for the feature name, the setup, or the assertion instead
- A conformance verdict with no test-to-code line ratio at the top
- An evidence report with no documentation line — neither the files updated nor the search that found none
- A reviewer, verifier, or conformance check running on the cheap tier while the executor was also cheap
- A user-facing change applied because "the review said so"
- A new flag, syntax, default, or output format the plan did not specify
- A technical choice logged as yours whose effect a user or operator would notice
- A full adversarial panel dispatched without the G2 answer — or a large change that never reached G2
- A fix round merged without its own quick review
- Skipping the companion files because "I remember this skill"
- A decisions log or recap written while the step 8 pre-flight still has an unticked line
- The comment or simplification pass started without `appropriate-comments-fallback.md` and `code-simplification-fallback.md` opened at that step — an earlier read does not count
- A simplification that touches a file outside the merged diff, modifies a test, or merges two functions
- A stop that does not end with the resume line, or one that asks the user for a specific keyword instead of a plain-language answer

## Checklist

Create a todo per item.

- [ ] Read all six companion files (first use in this session)
- [ ] Plan located; plan review recommended (visual plan) or offered (other) — outcome recorded
- [ ] Starting branch + commit recorded; branch recommended once (G1)
- [ ] Capacity estimated and usage reported in one line (or marked unreadable) without stopping; `/goal` condition handed over
- [ ] Split stated: slices, order, worktrees, model per role, the trade said out loud
- [ ] Testing depth stated at G1 (TDD unit floor + test-map floor + docs-in-the-same-diff floor + what the user chose) and copied into every packet
- [ ] Every packet self-contained: plan section verbatim, scope, testing and documentation rules, discipline, evidence, stop conditions
- [ ] Conformance review done by me, item by item — line, test, and document for each; diff measured, every new test recounted — duplicates at 60% or more sent back
- [ ] Slices merged into the starting branch, no push
- [ ] Adversarial review sized; large → quick now, G2 asked for the full one; fallback panel if no skill
- [ ] Every finding fixed or parked by the authority split; every fix round re-reviewed; loop ended clean or at three rounds
- [ ] Step 8 pre-flight ticked: installed `appropriate-comments-code` / `code-simplification` checked first; the fallback file read fresh at that step only for a skill that is absent; conformance and review files re-opened
- [ ] Comment pass run on the merged diff — the installed skill as written, else the fallback: every flagged comment rewritten or deleted, test-file comments left alone, ratio-check files parked
- [ ] Simplification pass run on the merged diff — the installed skill as written, else the fallback: behavior-preserving, tests unmodified and green, merges parked as proposals; code changes re-checked for conformance and quick-reviewed
- [ ] Decisions log appended at the end of the plan file
- [ ] Worktree deletion asked (G4) — nothing removed before the answer
- [ ] Four-bullet recap delivered
