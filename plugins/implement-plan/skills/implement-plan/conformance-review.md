# Conformance Review — the plan versus the work

"The tests pass and the diff is clean" is not "this is what was agreed". A
faithful implementation of the wrong thing has no bugs and no failing tests;
only a check against the plan catches it. This review is yours — the
orchestrator's, on the premium tier — and it runs **before** any adversarial
review skill, on every slice, every iteration.

## Procedure

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
   - **untested** — present but no test would fail if it broke.
3. **Hunt extras.** Anything in the diff the plan did not ask for: a new flag,
   a changed default, a renamed label, a reordered flow, an "improvement".
   Each is either an announced deviation (fine) or an unannounced one (a gap).
4. **Chase undecided-but-decided.** For every item the plan left to the user,
   check the executor left it out. If it made a choice, that is a functional
   decision made for the user: **revert to the plan and park it under
   *Pending*** with the executor's choice as one option.
5. **Chase what a missing item took with it.** A dropped element usually
   orphans its data — it gets rendered somewhere wrong rather than nowhere.
   Find where the value went.
6. **Run the suite yourself.** Record the exact command and counts. Then run
   the plan's user journeys by hand where cheap (the CLI, the endpoint).
7. **Verdict.** Pass only when every item is *present* and *tested*, there are
   no unannounced extras, and nothing undecided was decided. Otherwise, write
   the gaps as a list that quotes the plan line and states what the code does
   instead, and send that list back in a corrected packet.

## Output shape (keep it; it is the record for the next iteration)

| Plan item (quoted) | Status | Evidence (file:line) | Test |
|---|---|---|---|
| "`todo add` accepts `--priority <level>`" | present | `src/cli.js:14` | `test/cli.test.js` "add with priority" |
| "invalid level exits with code 2" | different — exits 1 | `src/cli.js:18` | none |
| "empty-list export: not decided" | decided by executor — header only | `src/export.js:9` | revert + park |

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
