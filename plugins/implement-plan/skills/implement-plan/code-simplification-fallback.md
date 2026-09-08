# Code Simplification — using the skill, or running the pass on the spot

The simplification pass runs over the merged diff after the last fix round and
before the decisions log, together with the comment pass. It reduces the
complexity the run introduced **without changing behavior**: the nesting an
executor left because the tests were already green, the helper extracted once
and never called twice, the generic name that made sense while the slice was
being written, the two near-identical functions two executors wrote in two
worktrees without seeing each other. The test is always the same: **would a
new team member understand this faster than the original?**

## Prefer the installed skill

Check the skill list your harness gives you. If `code-simplification` is
installed (it ships in the plugin of the same name; install lines are in
`companion-skills.md`), **run it as written** with the scope set to the merged
change: it reads its own companion files, routes finding to the cheap tier and
judgment to the premium tier, and insists on a test that predates every change.
Do not paraphrase it from memory. When it is not installed, run the pass below.

Either way, the scope is the merged change only: `git diff
<starting-commit>..HEAD`. Code outside that diff is not touched. "While I am
here" is the phrase that ends the scope; a refactor of the surrounding code is
its own change and is never part of this run.

## The five principles

1. **Preserve behavior exactly.** Same output for every input, same error
   behavior, same side effects and ordering, same edge cases. Every existing
   test passes **unmodified**. A test that needs a tweak to pass means the
   behavior changed: revert the simplification, never bend the test.
2. **Follow project conventions.** Read the project's instructions file and
   the neighbouring code first; match its naming, declaration style, error
   handling, and idioms even where you would write it differently.
   Simplification that breaks consistency is churn.
3. **Prefer clarity over cleverness.** A five-line conditional a reader scans
   in two seconds is simpler than a one-line nested ternary. When in doubt,
   write the boring version.
4. **Maintain balance.** Do not inline a helper that names a concept, merge
   unrelated logic into one function, remove an abstraction that exists for
   testability, or remove validation because the result looks cleaner. Fewer
   lines is not the goal; faster comprehension is.
5. **Scope to what changed.** Every changed line traces back to a
   simplification you can name, inside the merged diff.

## The pass

**Understand before touching.** For each function the diff adds or changes:
what is its responsibility, what calls it, what does it call, which tests
define its behavior, and why might it be shaped this way (a platform
constraint, a performance reason, a plan item that asked for it). If you
cannot answer, you are not ready to simplify it.

**Find the opportunities.** Cheap work; on a multi-model harness route it to
the cheap tier or to `grep` and the project's complexity tool, then verify
every lead yourself — open the location, recount, re-diff. Signals:

| Pattern | Signal | Simplification |
|---|---|---|
| Deep nesting (3+ levels) | Happy path buried under conditions | Guard clauses and early returns; extract a helper only if it decides one nameable thing |
| Long function (50+ lines) | Several responsibilities | Split along responsibilities, each with a descriptive name and its own tests |
| Cyclomatic complexity over 10 | Too many paths to test one by one — count 1, plus 1 per `if`, `else if`, `case`, loop, `catch`, ternary, and `&&`/`||` in a condition | Split along decision clusters into pure, testable functions; report the number before and after; never into once-called helpers that just relocate lines |
| Two functions with the same shape | Same branches and calls, different names or literals — typically written by two executors in two slices | **A proposal, never a reflex** — see below |
| Repeated conditional | The same check in several places | Extract a well-named predicate |
| Boolean parameter flags | `doThing(true, false)` | Named options or separate functions |
| Generic or abbreviated names | `data`, `result`, `tmp`, `cfg`, `evt` | Rename to describe the content, unless the abbreviation is universal (`id`, `url`) |
| Misleading name | A "get" that mutates | Rename to what it does |
| Duplicated logic | The same five-plus lines in several places | Extract a shared function |
| Dead code | Unreachable branch, unused variable, commented-out block, orphaned helper, unused import | Remove, after confirming it is dead |
| Unnecessary wrapper | A layer adding nothing over what it wraps | Inline it |
| Speculative abstraction | Strategy with one strategy, config nobody sets, a hook for a "later" the plan does not name | Replace with the direct approach |
| Hand-rolled idiom | A loop for something the language or stdlib does idiomatically, and the codebase already uses that idiom | Use the idiom |
| Comment that is a rename or split request | `// n is the retry count`, `// convert to cents` | Rename or extract, then delete the comment |

**Apply one change at a time, tests between.** For each simplification:

1. Confirm a test that **already exists** pins the behavior you are about to
   reshape — it must pass on the code as it stands. Under this skill every
   slice shipped under TDD, so the test should be there; if none covers the
   function, do not simplify it — record it under *Pending for you* with the
   simplification you would make, because adding a test after the fact proves
   only that the new code does what the new code does.
2. Make the change.
3. Run the test suite. Green → keep it and move on. Red → revert and
   reconsider; the tests are not touched.

"Extracted four helpers" is four changes with four test runs, not one.

**Merges are proposals.** Two functions with the same skeleton were written
twice — but a merge crosses the scope of one slice and changes an API surface,
and a near-duplicate is sometimes two things that change for different
reasons. Diff them line by line; a behavioral difference (error handling,
validation, mutation, ordering) ends the review — they are not equivalent.
Count the callers of both. Then **park the merge under *Pending for you*** with
the diff summary, the caller count, and the unified signature you recommend.
Do not make it in this run.

**Verify the result.** Step back over the whole pass: is the simplified
version genuinely easier to understand; does it introduce any pattern the
codebase does not use; is the diff clean, with nothing unrelated in it; would a
teammate call it a net improvement? If a "simplification" is harder to read or
to review, revert it. Reverting is a valid outcome. Build with no new warnings;
linter and formatter pass; no dead code left behind by the pass itself.

## The authority split still applies

A simplification is, by definition, invisible to users — that is what
behavior-preserving means. The moment a change would alter output, ordering,
timing, defaults, error text, an API, a stored format, or a public signature
callers outside the diff depend on, it is not a simplification and it is not
yours: park it under *Pending for you* with the recommendation. Log every
simplification you did make in the decisions log, one line each, in plain
language: what was reshaped and why it reads better.

## After the pass — it is still a change

The pass produced a diff that nobody has reviewed. Re-run the conformance
check on the files it touched — the plan's promises are still the spec, and
a rename or a split can lose one — then run the quick adversarial panel on
the pass's diff exactly as step 7 of `SKILL.md` does for a fix round, and fix
or park what it finds by the authority split. The pass does not repeat after
that review: a second simplification round on the same diff is the loop
this skill does not have.

## Reporting

In the recap's *What was done*, one line: what was simplified (nesting
flattened, helpers named, dead code removed, complexity numbers before and
after for any function split), and that every existing test passed
unmodified. Each proposed merge and each function that could not be
simplified for want of a pre-existing test goes under *Pending for you* with
the recommended change.
