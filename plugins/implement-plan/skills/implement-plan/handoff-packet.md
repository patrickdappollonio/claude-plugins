# Handoff Packet

The prompt every executor receives. Executors have **no chat context**: nothing
you know reaches them unless it is in the packet. Write it as if to a capable
contractor who has never seen the project or the conversation.

## What goes in, in this order

1. **Repo path and branch.** The worktree path and the slice branch. "Work only
   inside this directory."
2. **The plan section, verbatim.** Copy the slice's part of the plan word for
   word — never paraphrase, a paraphrase is where requirements drift. Include
   the plan's non-goals and any item marked *undecided by the user*, with the
   instruction: **do not decide undecided items; leave them out and report them.**
3. **Scope.** Files and surfaces in scope; files explicitly out of scope (other
   slices' files, shared config the orchestrator owns).
4. **Announced deviations** already agreed with the user, if any.
5. **Testing and documentation rules** (below), plus the repo's actual test
   command, layout, any integration/E2E convention you found, and where its
   documentation lives (README, `docs/`, help text, CHANGELOG, specs).
6. **The executor discipline** (below), verbatim.
7. **Evidence to return** (below).
8. **Stop conditions** (below).

Parallel slices should not share files. When two slices must touch the same
file (a dispatch table, a router, a `switch` in the CLI entry point), either
serialize them or name the shared file in both packets as *append-only in your
own section* and own the merge yourself — the conflict is the orchestrator's,
never an executor's to resolve by editing the other slice.

## Testing and documentation rules

The floor is fixed and has three parts — TDD, a map of the existing tests
before any new one, and documentation in the same diff; the tiers above it
are whatever the user chose at G1. Include all three floor blocks verbatim,
then only the tiers that apply:

> **TDD is mandatory.** For every behavior: write a unit test, run it and
> watch it fail for the right reason, write the minimum code to pass, run it
> green, refactor with tests green. Tests written after the code do not count
> — if you notice code without a failing test behind it, delete the code and
> start that step over.
>
> Do not add test infrastructure for this task alone. Test the behavior this
> slice changes; do not backfill unrelated coverage.

> **Map the existing tests before writing one.** Before the mini-plan, find
> every test that already exercises the surface this slice changes: grep the
> test directories for the function, command, endpoint, type, and fixture
> names you will touch, and open every file that hits. Write the result down
> as a **test map** in your first message, under **Proof**: each existing
> test file or case that covers the surface, and for each behavior this slice
> changes, either *extend* — name the existing test and how (a new case in
> its table or describe block, a new assertion, an edited expectation) — or
> *new*, with the gap that justifies it. **Extend is the default.** A new
> test is justified only by a gap the map shows: no existing test exercises
> this surface, the existing test's setup cannot host the case, or the plan
> asks for a tier (integration, E2E, journey) this repository has no test
> for. A new test that stands up the same fixture as an existing one and
> exercises the same surface is a duplicate and will be sent back; add the
> case to the existing test instead. When the search finds no test for the
> surface, say so and name what you searched. A test extended under TDD still
> fails first: add the case, watch it fail, then write the code.

> **Documentation is updated in this same diff.** Before writing the
> mini-plan, search the repository for every document that describes the
> surface this slice changes: README and `docs/`, CLI help and usage text,
> man pages, config and environment-variable references, CHANGELOG when
> the repo keeps one, OpenAPI or schema files, example and sample files,
> and the doc comments or docstrings on any public API you touch. List each
> one under **Files** and update it alongside the code so that no document
> describes the old behavior when you finish. Extend existing documents;
> create a new one only when the plan section calls for it, otherwise
> report the gap. This is not a follow-up task and is not optional: a slice
> whose docs still describe the old behavior is not done. If the search
> finds no document describing this surface, say so in the evidence and
> name what you searched.

Add when the repo has integration/E2E tests, or the user asked for journeys:

> **Integration and E2E tests are user journeys.** Design each test the way a
> real consumer of this project behaves: run the real CLI binary, call the real
> HTTP endpoint, drive the real UI flow, read the real file the user would
> read. **Mock only what cannot run for real** — third-party services, the
> wall clock, external networks, paid APIs. Everything else executes from the
> real codebase. Follow this repository's existing layout, runner, fixtures,
> and naming exactly: `<describe>`.

Add when the user asked for real dependencies:

> **Real dependencies, not fakes.** For databases, queues, caches, object
> stores, and similar, use testcontainers (or this repository's existing
> equivalent) to run a real instance in the test. Do not stub the driver.

## Executor discipline

Include verbatim:

> Complete the task with the **minimum sufficient change**.
>
> **Before editing**
> - Read the relevant code, tests, and configuration directly. Do not work from
>   search snippets or guesses.
> - If a requirement is ambiguous or a premise is unverified, stop and report
>   it; do not build on it.
> - State a minimal plan in your first message, in this shape:
>   - **Outcome** — the exact behavior requested
>   - **Non-goals** — what this task will not do
>   - **Files** — the smallest set expected to change
>   - **Proof** — the check that will prove the change works: the test map —
>     the existing tests for this surface, and per behavior, the test you
>     extend or the gap that justifies a new one
> - Take one implementation path. Do not split the work further.
>
> **While editing**
> - Reuse existing code, helpers, patterns, tests, and test setup before
>   adding anything.
> - Fix bugs at the root cause. Do not stack patches around a wrong premise.
> - Add an abstraction, adapter, or config layer only for a second real caller
>   in this task or a stated requirement.
> - Preserve behavior outside the requested change.
> - Do not design for rare or future cases nobody asked about.
> - Remove code you replace. Keep an old path only when compatibility is an
>   explicit requirement.
>
> **Pause and report — do not proceed — before:**
> - Materially expanding scope or touching files outside the stated set
> - Adding a dependency, framework, service, or new test infrastructure
> - Changing a public API, schema, storage format, or wire format the plan
>   does not already specify
> - Deleting or overwriting user data, discarding uncommitted work, rewriting
>   history, or dropping data
> - Keeping two implementations of the same behavior alive
> - Deciding anything the plan marks as undecided, or anything a user could
>   reasonably say "I didn't want that" about — output wording, new flags or
>   syntax, defaults
>
> **If the plan grows:** stop when the work starts adding future-use layers,
> workaround stacks, unrelated cleanup, or tests for unstated behavior. Report
> the smaller scope you propose and wait.
>
> **Done means**
> - The requested behavior works and every item of the plan section is met
> - Relevant checks pass, with the exact commands and their results reported
> - Every document that describes the changed behavior is updated in this
>   diff, or the evidence names the search that found none
> - Every touched file is necessary and the diff contains nothing unrelated
> - No debug code, backup copies, dead paths, or scratch files remain
> - Assumptions, limitations, and unverified runtime behavior are stated plainly

## Evidence to return

The orchestrator does the conformance review from this, so it must be complete:

- Each plan item, quoted, with the file:line that fulfils it and the test that
  proves it — or "not done" with the reason.
- The exact test commands run and their output summary (pass/fail counts).
- The test map as executed: the existing tests found for the surface (or the
  search that found none), and for every test added or changed, *extended*
  with the file:line of the case, or *new* with the gap that justified it.
- For each plan item, the documents updated for it (file:line) — or
  "no document describes this" with the search that established it.
- The commit hash(es) on the slice branch.
- Every assumption made, every item left undecided, every deviation from the
  plan section and why.
- Anything the stop conditions triggered.

The report is a lead, not a fact: the orchestrator reopens the cited files.

## Stop conditions

Stop and report instead of improvising when: the code does not match what the
packet describes; a command fails after one reasonable retry; the task needs
out-of-scope files; a pause-and-report condition fires; a test cannot be made
to fail first (the behavior may already exist — report it).

## Template

```
You are implementing one slice of an agreed plan in <worktree path>, branch <slice-branch>.
Work only inside that directory. Do not push. Do not touch other branches.

## The plan section you are implementing (verbatim — this is the spec)
<paste>

## Non-goals and items the user has not decided (do not decide them)
<paste>

## Scope
In: <files/surfaces>   Out: <files/surfaces>

## Already-announced deviations
<none | list>

## Testing and documentation rules
<paste the TDD floor, the test-map floor, and the documentation floor; then only the tiers the user chose at G1>
Repo test command: <cmd>. Test directories and naming: <describe>. Existing integration/E2E convention: <describe or "none">.
Where the docs live: <README, docs/, help text, CHANGELOG, specs — or "none found">.

## Discipline
<paste the Executor discipline block>

## What to return
<paste the Evidence to return block>

## Stop conditions
<paste the Stop conditions block>
```
