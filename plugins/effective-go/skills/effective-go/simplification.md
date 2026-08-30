# Simplification — the full guide

Read this file on first use of the skill in a session, and again before
reshaping working Go code: flattening nesting, splitting a function,
extracting or inlining a helper, merging near-duplicates, removing dead
code, or renaming. `SKILL.md` carries the summary; this file is the
specification. It condenses the standalone `code-simplification` skill for
Go.

## The goal

Code a new team member understands faster than the original, with
**exactly** the same behavior. Not fewer lines. Not cleverer. Every change
must pass: *would a reader understand this faster?* and *does a test that
predates the change still pass, unmodified?*

## Scope

Default to the code you are already changing: this session's edits, the
working diff, the branch. Widen only when asked. No drive-by refactors,
no reformatting files you pass through, no "improving" a neighbour. Keep
refactoring and feature work in separate commits.

## Principles

1. **Preserve behavior exactly** — inputs, outputs, side effects, ordering,
   error values **and error message text**, edge cases. If unsure, don't.
   Rewording an error message during a refactor is a behavior change:
   callers, logs, and dashboards may match on it. Fix the message only
   when the message is the target of the change, as its own step, and say
   so in the report.
2. **Follow the package's conventions** — simplification makes code more
   like *this* codebase, not more like your preferences. Where the package
   is wrong by this skill, write the new lines right; don't rewrite the
   package.
3. **Clarity over cleverness** — five plain lines beat a dense one-liner;
   a named intermediate beats a chained expression.
4. **Balance** — don't inline a helper that named a concept; don't merge
   unrelated logic; don't strip an abstraction that exists for testability;
   never remove validation or error handling because it "looks cleaner".
5. **Chesterton's Fence** — before removing or changing anything, know why
   it is there: what calls it, what it calls, its edge cases, its tests,
   and what `git log -p`/`git blame` say. If you can't answer, read more.

## What to look for (Go-specific signals)

| Signal | Simplification |
|---|---|
| Nesting 3+ deep; success path inside `if err == nil` / `else` | Guard clauses and early returns; happy path unindented |
| `if`/`else if` chain | `switch` (bare or on a value); type switch for assertions |
| Function over ~50 lines or complexity > 10 | Split along decision clusters into pure, named, tested functions |
| Two functions with the same shape (`loadUserConfig` / `loadProjectConfig`) | Diff, count callers, **propose** a merge — never merge by reflex |
| Boolean parameters `New(cfg, true, false)` | Options struct or functional options; or two named functions |
| Same predicate repeated | Extract a named predicate (`isRetryable(err)`) |
| Same 5+ lines in several places | One helper — if they change for the same reason |
| Hand-rolled loop for something in `slices`, `maps`, `strings`, `errors`, `sync` | Use the stdlib call (`slices.Contains`, `slices.SortFunc`, `maps.Keys`, `errors.Join`, `sync.OnceValue`) |
| Manual `for` copy into a new slice | `slices.Clone`, `append([]T(nil), s...)` |
| `interface{}` + type assertions where a type parameter fits | Generic function with a narrow constraint — only if it removes real duplication today |
| Wrapper that adds nothing over what it wraps | Inline it; call the thing directly |
| Interface with one implementation and no test seam | Delete it; use the concrete type |
| Factory-for-a-factory, strategy with one strategy, config nobody sets | The direct approach |
| `data`, `result`, `tmp`, `val`, `item`, `obj` | Name the content: `pendingUploads`, `validationErrs` |
| `usr`, `cfg`, `btn`, `evt`, `mgr` | Full words unless universal (`id`, `url`, `ctx`, `err`, `req`) |
| A `Get`/`Load` that also mutates | Rename to what it does |
| Comment explaining *what* | Delete it, or rename/split so it isn't needed |
| Unused parameters, unreachable branches, unused vars kept alive with `_ =`, commented-out code | Remove — after confirming it is truly dead (`go vet`, `staticcheck`, grep callers) |
| Named results used only for a naked `return` | Unnamed results, explicit `return x, err` |
| `err` shadowing with `:=` inside a nested block that then silently discards it | Assign with `=` or restructure |
| `defer` inside a loop holding files/locks open until function exit | Move the body into a helper function with its own `defer` |
| Goroutine + channel for something sequential would do | Sequential code |
| `sync.Mutex` protecting a value only one goroutine touches | Remove the lock |
| `context.WithCancel` whose `cancel` is never deferred | `defer cancel()` |

## Cyclomatic complexity

Count: **1, plus 1 for each `if`, `else if`, `case`, `for`, `&&`, `||`** in
the function. Use `gocyclo` or `golangci-lint`'s `gocyclo`/`cyclop` when
the project has it; otherwise count by hand and say so. Report the number
before and after any split.

| Complexity | Meaning | Action |
|---|---|---|
| 1–10 | Straightforward | Leave unless another signal applies |
| 11–20 | Hard to test fully | Split along decision clusters |
| 21+ | Untestable as one unit | Split — not optional |

Split procedure:

1. Find the **decision clusters** — branches that decide one nameable
   thing (a tier, a rate, a validation).
2. Extract each as a **pure function**: inputs in, value out, no mutation
   of the caller's state.
3. Leave **orchestration** in the original: it reads as the sequence of
   decisions, not their bodies.
4. Test each extracted piece — this is where the win lands.
5. Re-run the tests that pinned the original, unmodified.

Splitting must not become **fragmentation**: a once-called helper with a
vague name that relocates three lines is worse than the inline code. Every
extracted function is nameable by what it decides and testable alone. A
helper more complex than the piece it replaced means you moved the tangle.

## Roughly equivalent functions

Same control-flow skeleton, same external calls in the same order, names
differing by a qualifier, bug fixes that had to land in both — one
function written twice. Handle by **proposal, never reflex**:

1. **Diff them** line by line. Only names and literals differ → candidates.
   Different error handling, validation, or mutation → not equivalent; stop.
2. **Count and read every caller** of both.
3. **Propose** to the user: both names, the unified signature (a parameter
   for the literal that varied, or nothing), the caller count. Wait.
4. If approved: pin both with tests, write the unified function, route
   every caller, run the pinning tests unmodified, delete the originals.
   Thin exported wrappers over a shared body are a valid endpoint when
   callers are external.

Never merge coincidental similarity — two short loops in unrelated domains
gain nothing from a shared helper with a vague name.

## Process

```
FOR EACH SIMPLIFICATION:
1. Confirm a test pins the behavior you are about to reshape.
   None? Write one first (a characterization test of what the code does
   TODAY — including its odd edge cases). Run it on the ORIGINAL; it must pass.
2. Make ONE change.
3. go build ./... && go vet ./... && go test -race ./...
4. Pass → keep, next.  Fail → revert the change. Never edit the test to pass.
```

"Extracted four helpers" is four changes. If a refactor would touch more
than ~500 lines, use tooling (`gofmt -r`, `gopls rename`, `gorename`,
`sed` with review) rather than hand edits.

**If the repository has no tests covering the code in scope, stop and ask
before creating any.** A test file, framework, or dependency is a decision
about their project. Ask once, with the specifics (which functions, where
the tests live). Do not change first and ask after; silence is not
consent; deadlines do not waive this. If the user declines, say the change
is unproven, use a throwaway differential check (old vs new over the same
inputs) as the best remaining evidence, report what it covered, and keep
the change mechanical — a deleted script is not proof.

## Evidence

Finding is cheap; deciding is expensive. Locate candidates with `grep`/`rg`,
`gocyclo`, `staticcheck`, `go vet`, `gopls` — or, on a multi-agent harness,
a cheap subagent after asking the user how much parallelism they want.
Judgment, the change, and verification stay with you. **A subagent's report
is a lead, not a fact**: open the location, recount, re-diff, re-run before
acting on it.

## After the pass

- Is it genuinely easier to understand? If not, revert — reverting is a
  valid outcome.
- Is the diff clean, reviewable, and free of unrelated changes?
- No new pattern the package doesn't use; no removed validation; no dead
  code left (unused imports, orphaned helpers, unreachable branches).
- Would a teammate call it a net improvement?

## Rationalizations

| Rationalization | Reality |
|---|---|
| "Fewer lines is simpler" | Comprehension speed is the measure, not line count. |
| "I'll simplify this adjacent code while I'm here" | Unscoped edits bury the change reviewers came to read. Stay in scope. |
| "This abstraction might be useful later" | Speculative abstraction is complexity without value. Remove; re-add on the second use. |
| "The original author must have had a reason" | Maybe — check git history. Often it's residue of pressure. Know which before touching. |
| "I'll refactor while adding the feature" | Two changes. Two commits. |
| "The tests need a small tweak to pass" | You changed behavior. Revert the change, not the test. |
| "No tests and we ship tomorrow, I'll be careful" | Careful is not proof. Ask about pinning tests; if declined, report the change as unproven. |
| "I verified with a throwaway script" | A deleted check guards nothing. Tests stay, or the report says unpinned. |
| "I split it into helpers, so it's simpler" | Only if each decides one nameable thing and has tests. Otherwise it's fragmentation. |
| "Those two are basically the same, I'll merge them" | Diff, count callers, propose. Near-duplicates sometimes change for different reasons. |
| "Complexity is subjective" | It's a count. Count it, report before and after. |
| "A generic would remove this duplication" | Only if two call sites with different types exist today and the constraint is narrow. |
| "The subagent already checked it" | A lead. Open it, recount, re-run, then act. |

## Red flags

- A test had to change for the simplification to pass
- An error message's wording changed inside a change that was supposed to be a pure refactor
- An extracted helper has no test of its own — the original's table exercising it indirectly is not the same
- The "simpler" version is longer or harder to follow
- Renaming to your taste instead of the package's convention
- Removing error handling or validation because it looks cleaner
- Changing code you don't understand yet
- Batching several simplifications into one untested edit
- Touching code outside the requested scope
- Changing an untested function without having asked about tests
- Proof of equivalence is a script you intend to delete
- Merging without a line-by-line diff and a caller count
- An extracted helper's complexity went up
- Acting on a subagent finding you haven't reproduced

## Checklist

- [ ] Scope is the code being changed, or what the user named
- [ ] Every reshaped function is pinned by a test that existed before the change and passes after it, unmodified
- [ ] No tests in the repo → the user was asked before any were added; declined → reported as unproven
- [ ] Complexity reported before and after any split; no helper more complex than what it replaced; every helper decides one nameable thing and has tests
- [ ] Any merge was proposed with diff and caller count before being made; every caller updated
- [ ] Each change applied and tested individually; failures reverted, never the test
- [ ] Follows the package's conventions; no validation or error handling removed; no dead code left
- [ ] `gofmt`, `go vet`, `go test -race`, linter — run, output in hand
- [ ] A teammate would call the diff a net improvement
