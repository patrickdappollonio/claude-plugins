# Conformance Review — the plan versus the work

"The tests pass and the diff is clean" is not "this is what was agreed". A
faithful implementation of the wrong thing has no bugs and no failing tests;
only a check against the plan catches it. Nor does a passing suite notice a
README that still documents the old flag — only opening the docs does. This review is yours — the
orchestrator's, on the premium tier — and it runs **before** any adversarial
review skill, on every slice, every iteration.

## Procedure

0. **Measure the diff before you read it.** Run
   `git diff --numstat <start>..<slice>` and add up the lines added in test
   files and in everything else. Write both numbers and the ratio at the top
   of the verdict. Step 6a recounts every new test whatever the ratio; a
   ratio over 2 to 1 is a warning that the slice added tests it did not
   need, and the verdict says so.
1. **Enumerate before you look.** Open the plan section and write a flat
   checklist of every concrete promise: each field, flag, default, ordering,
   error case and exit code, output format, message, migration, endpoint,
   permission, non-goal, and every item marked *undecided*. Do this **before**
   reading the diff, so the diff cannot define what you go looking for.
2. **Walk the checklist against the code.** For each item, open the file
   (not the executor's report) and record one of:
   - **present** — file:line that fulfils it, and the test that proves it;
   - **missing** — nothing implements it;
   - **different** — implemented, but not as specified (quote both);
   - **untested** — present but no test would fail if it broke;
   - **duplicated** — proved by a new test function or file whose setup
     and action steps are 60% or more already performed by an existing
     test on the same surface, whatever it asserts at the end. A setup
     block copied from another test is the strongest sign; look for it
     first. Quote both and the count;
   - **tainted** — the diff or a commit message carries a label from this
     run (a gate ID, slice or wave name, round, pass, finding, or step
     number, a ticket title). Quote the line; it goes back whatever else is
     right;
   - **undocumented** — present and tested, but a document that describes
     this surface (README, `docs/`, help text, CHANGELOG, spec, docstring)
     still describes the old behavior or omits the new one. Do not take the
     executor's "no document describes this" on faith: run the search.
3. **Hunt extras and over-build.** Anything in the diff the plan did not ask
   for: a new flag, a changed default, a renamed label, a reordered flow, an
   "improvement". Each is either an announced deviation (fine) or an
   unannounced one (a gap). Over-build is an extra too: a component, helper,
   wrapper, or dependency added where the codebase, the standard library,
   the platform, or an installed dependency already provides it. When the
   executor added it beyond the plan, name the lower rung and send it back.
   When the plan itself prescribed it, the choice is the user's: park it
   under *Pending* with both paths and their cost, and stop at G3 if the
   next slice depends on it. Never swap in the simpler path yourself.
4. **Chase undecided-but-decided.** For every item the plan left to the user,
   check the executor left it out. If it made a choice, that is a functional
   decision made for the user: **revert to the plan and park it under
   *Pending*** with the executor's choice as one option.
5. **Hunt stale docs.** Grep the repository's documentation for the old
   name, flag, default, message, or shape of everything the slice changed. Any
   hit outside the diff is an *undocumented* item, whatever the report said.
5a. **Hunt leaked labels.** Grep the added lines of the diff and the commit
   messages (`git log <start>..<slice> --format=%B`) for this skill's own
   vocabulary: `\bG[1-4]\b`, `slice`, `wave`, `round \d`, `pass \d`,
   `finding`, `\bF\d+\b`, `step \d`, `Pending`, and every ticket title from
   the plan. A hit that is not a domain word the code already used is
   *tainted*: quote the line and send it back for removal, whatever else the
   slice got right. The plan file is usually ignored by git, so the label
   points a future reader at nothing.
6. **Chase what a missing item took with it.** A dropped element usually
   orphans its data — it gets rendered somewhere wrong rather than nowhere.
   Find where the value went.
6a. **Recount every new test.** For each test function or file the diff
   adds, find its map entry in the evidence, then redo the count yourself:
   list the new test's setup calls and actions (not its assertions), grep
   the test directories for the command, function, or endpoint it calls
   (not the feature name the executor may have grepped for), take as the
   nearest the existing test that calls it and shares the most setup
   steps with the new test (on a tie, the one nearest the top of the
   file), and mark each step that test already performs. At 60% or more the new test is
   *duplicated*: send it back with the existing test named and your list,
   so the executor moves the case there and deletes the copy. Redo the
   count yourself, whatever the evidence says, when the nearest test is
   given as none for a command some test already calls, or when the step
   list includes assertions. A new test with no listed steps goes back for
   the list. When
   the plan's acceptance criterion already names the test to extend, a
   test written anywhere else is *different*, with no count needed. Do
   not take "no existing test covers this" on faith any more than "no
   document describes this".
7. **Run the suite yourself.** Record the exact command and counts. Then run
   the plan's user journeys by hand where cheap (the CLI, the endpoint).
8. **Verdict.** Pass only when every item is *present*, *tested*, and
   *documented* (or shown to have no describing document), there are
   no unannounced extras, and nothing undecided was decided. Otherwise, write
   the gaps as a list that quotes the plan line and states what the code does
   instead, and send that list back in a corrected packet.

## Output shape (keep it; it is the record for the next iteration)

Diff: 41 test lines added, 28 non-test (1.5 to 1).

| Plan item (quoted) | Status | Evidence (file:line) | Test | Docs |
|---|---|---|---|---|
| "`todo add` accepts `--priority <level>`" | present | `src/cli.js:14` | `test/cli.test.js` "add with priority" | `README.md:41`, `src/cli.js:9` (help text) |
| "invalid level exits with code 2" | different — exits 1 | `src/cli.js:18` | none | `README.md:44` still says exit 1 |
| "`--priority` default is `normal`" | undocumented | `src/cli.js:15` | `test/cli.test.js` "default priority" | `README.md:41` lists no default |
| "`--priority` rejects unknown levels" | duplicated | `src/cli.js:18` | new `test/priority.test.js` shares 5 of 6 steps (83%) with `test/cli.test.js` "add with priority" — move the case there | `README.md:44` |
| "empty-list export: not decided" | decided by executor — header only | `src/export.js:9` | revert + park | — |

Below the table: **Extras** (unannounced), **Announced deviations** (confirmed
they match what was announced), **Verdict**, **Return to executor** (the gap
list, if any).

## Pull to resist

| The pull | The reality |
|---|---|
| "The executor's report lists every item as done" | Reports are leads. Open the files. |
| "I read the diff, it looks like the plan" | Looking like the plan is the failure mode. Enumerate first. |
| "It's a fix round, the change is tiny" | Fix rounds are where scope creeps in unnoticed. Same procedure, shorter checklist. |
| "The extra flag is harmless" | Harmless is the user's call. It is an unannounced deviation until they say so. |
| "The docs can be tidied in a later pass" | There is no later pass. An item whose document still describes the old behavior is *undocumented* and goes back to the executor with the rest. |
| "The executor said no docs mention it" | A report is a lead. Run the grep; it takes seconds. |
| "The `slice-3` comment is harmless, the code is right" | The code is right and the comment points at a plan nobody will have. Grep for the labels; a hit goes back on its own. |
| "The new test file is well written, no reason to send it back" | Well written twice is still twice. Count the steps; at 60% the case goes into the existing test and the copy goes. |
| "The executor said no existing test covers this" | A lead, not a fact. It grepped for the feature name; grep for the command or function and recount. |
| "The executor's count says 56%, under the line" | Its count is a claim. Redo it with setup and actions only; the two counts either agree or the higher one wins. |
| "Nearest is none, no test reads the JSON file" | Nearest is chosen by the command the test calls, never by what it asserts. Some test calls `add`; that is the nearest. |
