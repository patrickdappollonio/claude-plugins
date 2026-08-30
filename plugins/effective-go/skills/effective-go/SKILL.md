---
name: effective-go
description: Use when writing, editing, or reviewing Go code — any .go file, go.mod, a new package, a function, an error message, a test, a mock, a goroutine — or when asked whether Go code is idiomatic. Also use before answering a question about how something "should" be written in Go.
---

# Effective Go

## Overview

Write Go the way the Go community writes it, with a few house preferences
that win when the sources disagree. The sources, in the order they are
consulted: this skill's house rules, then *Effective Go*, the Google Go
Style Guide, the Go Proverbs, and the Gruntwork style guide.

When two rules conflict, resolve in this order — **clarity, simplicity,
concision, maintainability, consistency**. Clarity to a reader who did not
write the code beats every other consideration. Consistency with the
surrounding package is real, but it never justifies spreading a mistake.

This skill is a specification, not advice. "The code compiles and the tests
pass" does not make it done; it is done when the checklist at the end is
true.

## Read the Companion Files First

`SKILL.md` carries the rules and a short summary of each topic; five files
beside it carry the full text:

- `errors.md` — how to construct, wrap, check and handle errors
- `testing.md` — table tests, assertions, the `Fn`-field mock pattern
- `style.md` — naming, layout, receivers, interfaces, concurrency, context, logging, dependencies
- `comments.md` — doc comments and inline comments: what earns a line, what never does
- `simplification.md` — reshaping working code without changing behavior: nesting, splits, merges, dead code

**The first time you use this skill in a session, read all five before
doing anything else** — before opening the target code, before writing a
line, before answering a question. The summaries below are reminders of
text you have already read, not a substitute for it. Re-read the named
file at the step that names it. If a file is missing, say so; do not
proceed as if the summary were the whole skill.

## Companion: JetBrains' `use-modern-go`

This skill covers idiom and discipline; it does not know what changed in
the Go release you are targeting. JetBrains ships a skill for exactly that:
`use-modern-go` (plugin `modern-go-guidelines`, from
`github.com/JetBrains/go-modern-guidelines`) runs a CLI that lists
version-specific guidelines for the Go in `go.mod` — newer than any
model's knowledge cutoff. It is not distilled here on purpose; it is used
live.

**At step 2 of the process, check whether `use-modern-go` is among your
available skills.**

- **Installed** → invoke it, run its `list` for the file you are about to
  edit, and treat its output as authoritative for *which language and
  library features to use* (`for range n`, `slices`/`maps`, `min`/`max`,
  `sync.WaitGroup.Go`, `testing/synctest`, and whatever it adds later).
  The house rules in this skill still govern error wording, mocks, comments
  and process; where the two disagree on an idiom, `use-modern-go` wins
  because it knows the toolchain.
- **Not installed** → tell the user once per session, in one short
  paragraph at the end of your first Go reply, that `use-modern-go` would
  let you use Go features newer than your training data, with the install
  commands:
  - Claude Code: `/plugin marketplace add JetBrains/go-modern-guidelines`
    then `/plugin install modern-go-guidelines@goland-claude-marketplace`
  - Codex: `codex plugin marketplace add JetBrains/go-modern-guidelines`
    then `codex plugin add modern-go-guidelines@goland-codex-marketplace`
  - Other agents: see the repository README.
  It needs a Go toolchain on `PATH` (it `go install`s a small CLI on first
  use). Then carry on with this skill; do not block on the answer, and do
  not repeat the recommendation later in the session.

## When to Use

- Writing any new Go code: a package, a type, a function, a `main`
- Editing existing Go code, however small the diff
- Writing or changing tests or test doubles
- Reviewing Go code, yours or someone else's
- Answering "is this idiomatic?" or "how should I write X in Go?"
- Simplifying or cleaning up Go that already works

**Not** for choosing an architecture or a library — this skill governs how
Go is written once the decision is made.

## The Process

Work through these in order for every change. Each step names the file to
re-read when it applies.

1. **Read the surroundings.** Open the package you are changing. Note its
   naming, receiver style, error phrasing, test layout and logger. Match
   the package where it is right; where it deviates from this skill,
   write the new code correctly and do not "fix" untouched code unless
   asked.
2. **Check the toolchain.** Use the Go version in `go.mod` — never a
   feature it does not have, never a bump without being asked, and leave
   the `go` directive exactly as `go mod init` or the project wrote it.
   Prefer the standard library to a dependency; prefer copying a small
   helper to adding a module. **If `use-modern-go` is installed, invoke it
   now** for the file you are about to touch; if it is not, note that you
   will recommend it once at the end of this reply (see *Companion*).
3. **Design the API before the body.** Names first (see *Naming*), then
   signatures: `ctx context.Context` first, `error` last, accept
   interfaces / return concrete types, zero value useful, no `any` where
   a real type exists.
4. **Write the body with the happy path on the left.** Guard clauses and
   early returns; no `else` after a `return`; no nesting the success case
   inside `if err == nil`.
5. **Write every error message to the house form.** Re-read `errors.md`.
   `failed to <verb> <object> [%q detail]: %w`; `errors.New` for any
   message with no `%` in it — in `main` and in tests too. Handle each
   error exactly once.
6. **Write the tests — first, and more of them.** Re-read `testing.md`.
   Red → green: a new test fails before the code exists and passes after;
   a refactor's pinning test passes before and after, unmodified. Append
   to the existing `_test.go`; a new file only when none exists or a
   separate tier (smoke, e2e, journey) needs a build tag. Table-driven,
   `t.Context()`, got-before-want messages, hand-written `Fn`-field mocks
   whose nil fields fail loudly. For a feature, propose user journeys and
   write the ones the user picks.
7. **Comment only what the code cannot say.** Re-read `comments.md`.
   Doc comments on every exported identifier, starting with its name,
   ending with a period. Nothing that restates the next line; nothing
   about how the code got here.
8. **If you are reshaping code that already works** — flattening, splitting,
   extracting, merging, deleting — re-read `simplification.md`: one change
   at a time, each pinned by a test that predates it.
9. **Run the gates and read the output.** `gofmt -l .` (or `goimports`),
   `go vet ./...`, `go build ./...`, `go test -race ./...`, and the
   project's linter if it has one (`make lint`, `golangci-lint run`).
   Paste or report actual results; a claim without output is not a
   result.
10. **Walk the checklist** at the end of this file against the diff. Fix
    what fails, then re-run step 9.
11. **Stop before committing.** Report what changed and offer to commit.
    Commit when the user approves; **push only on the user's explicit
    say-so**, which "commit it" does not include. In a non-interactive run
    (a subagent, a background job, a pipeline) leave the work uncommitted
    and say so in the report. Making a change permanent is the user's
    call, never the agent's.

## Committing and pushing

The user has the last word on when work becomes permanent.

- **Never push without explicit approval for that push.** Not to a branch,
  not to a fork, not because the commit was approved, not because the PR
  already exists, not because "it's just a follow-up". A standing
  instruction from the user ("push after every commit on this branch")
  counts as approval; an inference does not.
- **Commit on approval whenever possible.** Finish the change, run the
  gates, walk the checklist, fix what fails — *then* say what you would
  commit and wait. A WIP commit to set work aside is acceptable when the
  user asked for that workflow or the environment requires it; say so.
- Commit messages are plain sentences describing the change; no
  co-authorship, no generated-by lines, no session links.
- If you were told to commit but not to push, the report ends with "committed,
  not pushed" and nothing more happens.

## Errors (summary — full text in `errors.md`)

| Rule | Write | Never |
|---|---|---|
| Operational messages | `fmt.Errorf("failed to open config file %q: %w", path, err)` | `"open %q: %w"`, `"opening file: %w"`, `"error: %w"` |
| Sentinels are states | `errors.New("customer not found")` | `errors.New("failed to find customer")` |
| Validation quotes the value | `fmt.Errorf("unknown tier %q", tier)` | `"unknown tier"`, `"failed to validate tier"` |
| Wrapped error last | `"...: %w"` | `"%w: ..."`, `%v` for an error you mean to wrap |
| No directives → `errors.New` | `errors.New("BUCKET is required")` | `fmt.Errorf("BUCKET is required")` |
| Quote strings | `%q` | `'%s'`, `"%s"` |
| Casing | lowercase start; proper nouns/acronyms allowed (`"AWS region is unset"`) | `"Failed to ..."`, trailing period |
| Compare | `errors.Is` / `errors.As` | `err.Error() == ...`, `strings.Contains(err.Error(), ...)` |
| Callers decide | exported sentinel or typed error | in-band `-1`/`""`/`nil` |
| Handle once | return **or** log **or** exit | log-and-return |
| `Close` | `defer f.Close()` for readers; check `Close` on writers | ignoring a writer's `Close` |
| Panics | programmer errors and `Must*` at init with literal input | anything a user can trigger |
| Prefixes | context added per layer | `"pkg: "` on every message |

A chain must read as a sentence:
`failed to load configuration: failed to parse "config.yaml": yaml: line 3: mapping values are not allowed`.

## Testing (summary — full text in `testing.md`)

- Table-driven with named cases and visible Arrange / Act / Assert.
- `t.Context()`, `t.TempDir()`, `t.Setenv()`, `t.Cleanup()`, `t.Helper()`, `t.Parallel()` where safe.
- Messages: `t.Errorf("Func(%v) = %v, want %v", in, got, want)` — got before want. `t.Fatalf` only when continuing is meaningless.
- Errors asserted with `errors.Is`/`errors.As`, never by string.
- Mocks are hand-written structs with one `Fn` field per method. A nil `Fn` returns `errors.New("mockT.Method: methodFn not implemented")`; a method without an error return panics with the same text. Add call counters when the code under test swallows errors.
- `httptest` for HTTP; real or in-memory implementations for stores; no mocking or assertion libraries added to a project that has none; no `sqlmock`.
- Tests are cheap when the agent writes them: cover every reachable branch, edge and error path. Red → green for new code; for a refactor, a pinning test that passes before and after with no edits.
- Features get **user-journey tests**: propose the end-to-end paths a user would take (happy and unhappy), write the ones the user picks, one journey per test, driven through the public surface, in a build-tagged file.
- **Append to the existing `_test.go`.** A new test file only when (a) none exists for that source file or package, or (b) a separate tier — unit / smoke / e2e / journey — needs a build tag, a black-box package, or infrastructure the unit tests must not touch.
- `go vet ./...` and `go test -race ./...` before claiming green.

## Style (summary — full text in `style.md`)

**Naming.** `MixedCaps`, never underscores. Initialisms keep one case:
`userID`, `ServeHTTP`, `xmlAPI`. Name length scales with scope: `i` in a
loop, `pendingUploads` at package level. No `Get` prefix on getters. No
type in the name (`users`, not `userList`). Package names short, lowercase,
singular, no `util`/`common`/`helpers`; don't repeat the package name in
its exports (`widget.New`, not `widget.NewWidget`). Receivers are one or
two letters, the same on every method of the type.

**Layout.** `gofmt`/`goimports` clean, always. Imports in groups: stdlib,
third-party, local. `cmd/<binary>/main.go` for entrypoints; `internal/` for
everything not meant to be imported by other modules; a top-level package
or `pkg/` only for code deliberately published. Start flat; split packages
by responsibility (`billing`, `auth`), never by kind (`models`, `utils`).
Flags only in `main`; libraries take config through their API.

**Functions.** Small, one job, named for it. Parameters: `ctx` first,
options struct or functional options once there are more than a few,
`error` last. Prefer returning a value to mutating through a pointer.
Named results only when they add clarity; no naked returns outside tiny
functions. No `else` after `return`; `switch` over long `if`/`else if`
chains.

**Types.** Make the zero value useful. Pointer receivers when the method
mutates, the type holds a mutex, or the struct is large — and when in
doubt; never mix pointer and value receivers on one type. Use `any`, not
`interface{}`, and only when no concrete or narrow type will do. Field
names in struct literals for types from other packages. `len(s) == 0`
for emptiness, never `s == nil`.

**Interfaces.** Defined by the consumer, next to the code that calls
them, with only the methods it calls. Accept interfaces, return structs.
No interface "in case"; no interface whose only purpose is to mock a
type you own. Compile-time check when it matters: `var _ Storage = (*S3)(nil)`.

**Concurrency.** Every goroutine has an owner and a documented exit;
prefer a synchronous function and let the caller add `go`. Channels
orchestrate, mutexes serialize. `ctx` is always first, never stored in a
struct, never a custom context type; forward the caller's `ctx`, don't
invent one. `context.WithValue` only for request-scoped data crossing
API boundaries, never for loggers or dependencies. `-race` on anything
concurrent.

**Logging.** `log/slog` with key-value attributes, injected — never
pulled from a context or a global. Errors are logged once, at the top of
the stack, never by a layer that also returns them. A library may emit
`Info`/`Debug` progress lines through an injected logger when its caller
gave it one for that purpose; it never `Fatal`s.

**Dependencies.** Standard library first. A small helper is copied, not
imported. Pin versions; run the Go version in `go.mod`.

## Comments (summary — full text in `comments.md`)

A comment earns its place by carrying information the code does not,
about the code as it is now, in as few lines as that takes. Doc comment
on every exported identifier: a sentence, starting with the name, ending
with a period, written for the caller. Two lines above a declaration is
the working limit. Cover test: hide the comment — if the code lost
nothing, delete it. Subject test: the comment is about *these lines*
(usually why they differ from their neighbours), not the feature. Present
tense only; no "used to", "per review", finding numbers, pass labels, task
IDs, phase names. A regression is pinned by a test named after the
invariant, not by a warning comment. Verify every name a comment
mentions. Never touch `//go:build`, `//go:generate`, `//nolint` directives.

## Simplification (summary — full text in `simplification.md`)

Reshape only the code in scope, with behavior preserved exactly and
proven by a test that existed **before** the change and passes after it,
unmodified. Understand why code exists before removing it (git history,
callers, edge cases). One change at a time, gates run after each; a
failing test means revert the change, never the test. Cyclomatic
complexity = 1 + each `if`/`else if`/`case`/`for`/`&&`/`||`; over 10,
split along decision clusters into pure, named, tested functions — never
into once-called fragments. Two functions with the same shape are diffed,
their callers counted, and a merge is **proposed**, never done by reflex.
No tests in the repo → ask before adding any; declined → report the
change as unproven. Prefer the stdlib idiom (`slices`, `maps`, `errors.Join`)
to a hand-rolled loop.

## The Go Proverbs, applied

| Proverb | Do this |
|---|---|
| Don't communicate by sharing memory; share memory by communicating | Hand data off over a channel instead of two goroutines touching one variable under a lock |
| Concurrency is not parallelism | Add goroutines to structure independent work, not because "it could run at once" |
| Channels orchestrate; mutexes serialize | A mutex guards a field; a channel coordinates a pipeline — don't swap them |
| The bigger the interface, the weaker the abstraction | One to three methods, defined where they are used |
| Make the zero value useful | `var b Buffer` works without a constructor |
| `interface{}` says nothing | Reach for a concrete type, a narrow interface, or a type parameter first |
| Gofmt's style is no one's favorite, yet gofmt is everyone's favorite | Run it; never argue with it |
| A little copying is better than a little dependency | Twenty lines of helper are copied, not imported |
| Syscall / cgo must always be guarded with build tags; cgo is not Go | OS-specific and C code lives behind `//go:build`; avoid cgo when a pure-Go path exists |
| With the unsafe package there are no guarantees | Don't; if forced, isolate it and document why |
| Clear is better than clever | The boring version wins |
| Reflection is never clear | Type switches, generics or explicit code before `reflect` |
| Errors are values | Build helpers around them; they are not exceptions |
| Don't just check errors, handle them gracefully | Wrap with context, retry, degrade, or surface — a bare `return err` is the minimum, not the goal |
| Design the architecture, name the components, document the details | Names first; a good name shrinks the doc comment |
| Documentation is for users | Write doc comments for the caller, not the maintainer |
| Don't panic | `error` for anything a user can cause |

## Rationalizations

| Excuse | Reality |
|---|---|
| "The Google guide says `open %q: %w` is fine" | The house rule wins where they disagree. `failed to open file %q: %w`. |
| "Short error messages are more idiomatic" | Terse chains are unreadable at the top. Every layer names what it tried to do. |
| "Logging it here too gives more context" | It gives the same failure twice. Put the context in the wrap and log once at the top. |
| "`fmt.Errorf` with a constant string is harmless" | It is `errors.New`. Linters flag it; reviewers flag it; write it right the first time. |
| "A struct-field mock is simpler than `Fn` fields" | A struct-field mock passes silently when the code calls a method the test forgot about. Nil `Fn` must fail. |
| "`context.Background()` in a test is fine" | `t.Context()` cancels when the test ends and kills leaked goroutines. Use it. |
| "I'll add an interface so it's mockable later" | Interfaces are defined by consumers when they need them. Later is later. |
| "This helper deserves its own package / dependency" | A little copying beats a little dependency. Copy it. |
| "The package already does it this other way" | Match the package where it is right; write new code correctly where it isn't. Consistency doesn't spread mistakes. |
| "It compiles and the tests pass, it's done" | Done is the checklist below being true, with the gate output in hand. |
| "I'll skip `-race`, there's no concurrency here" | If there's a goroutine, channel, or shared map anywhere in the package, run it. It's cheap. |
| "The comment helps explain what this line does" | If the line needs explaining, rename or split; comments carry *why*. |
| "I'll push so the user can see it in the PR" | Pushing publishes. Say it's ready; the user decides when it leaves the machine. |
| "The commit was approved, so pushing is implied" | Two approvals. Commit means commit. |
| "A new test file keeps things organized" | The existing file's bottom is the organization. A new file is for a missing file or a separate tier, nothing else. |
| "Tests after the refactor prove it works" | They prove the new code does what the new code does. The pinning test predates the change. |
| "Journeys are the user's job" | Proposing them is yours. Writing the picked ones is yours. |
| "Reading the companion files is overkill for a one-line change" | One-line changes are where error strings and `'%s'` slip in. Read them. |
| "The comment explains the history of this fix" | The reader sees today's code. State the constraint; the story goes in the commit. |
| "The tests need a small tweak after my refactor" | You changed behavior. Revert the refactor, not the test. |
| "I'll fix the error wording while I'm refactoring" | That's a behavior change hiding in a refactor. Separate step, stated in the report — or leave it. |
| "Those two functions are basically the same, I'll merge them" | Diff, count callers, propose. A near-duplicate is sometimes two things that change for different reasons. |

## Red Flags — stop and fix

- An error string that starts with a verb, a gerund, `error`, or a package name
- `%w` first, `%v` on an error you meant to wrap, `'%s'` anywhere
- `fmt.Errorf` with no `%` in it
- `err.Error()` compared to a string, or `err == ErrX` on a wrapped error
- A `logger.Error(...)` immediately followed by `return fmt.Errorf(...)`
- `context.Background()` in a test; a `ctx` stored in a struct
- A mock with plain result fields instead of `Fn` fields; a mock method that returns zero values when unwired
- An interface with one implementation, defined next to that implementation
- `interface{}`, `GetFoo()`, `snake_case`, `utils` package, `Url`/`Id`
- A goroutine with no owner, no `WaitGroup`/errgroup, no `ctx.Done()` path
- A `panic` reachable from input; a `Must*` fed runtime data
- "It builds" reported without the `vet`/`test -race` output
- A comment that says "used to", "per review", names a finding or pass number, or is longer than the code beneath it
- A refactor that needed a test edited to pass, or that touched code outside the request
- A new `_test.go` beside an existing one for the same source file, with no build tag and no separate tier
- A feature change with no journeys proposed to the user
- `git push` in your plan without a user message approving *that* push; a commit the user has not asked for
- You reached step 3 without checking whether `use-modern-go` is available, or you are recommending it for the second time this session
- You have not opened `errors.md`, `testing.md`, `style.md`, `comments.md` and `simplification.md` this session

## Checklist — before calling Go code done

- [ ] Read `errors.md`, `testing.md`, `style.md`, `comments.md` and `simplification.md` this session
- [ ] `use-modern-go` invoked if installed, recommended once if not
- [ ] Toolchain matches `go.mod`; no new dependency that the stdlib or twenty copied lines could replace
- [ ] Names: `MixedCaps`, consistent initialisms, scope-sized, no `Get`, no type suffixes, singular lowercase packages
- [ ] Signatures: `ctx` first, `error` last, accept interfaces / return structs, no `any` where a type exists
- [ ] Happy path unindented; no `else` after `return`
- [ ] Every operational error: `failed to <verb> <object> [%q]: %w`; sentinels are noun phrases; `errors.New` when nothing is formatted; `%q` not `'%s'`
- [ ] Every error handled exactly once; no log-and-return; no ignored error without a comment
- [ ] Errors compared with `errors.Is`/`errors.As`
- [ ] Receivers consistent per type; zero value useful; no copied mutexes
- [ ] Goroutines have owners and exits; `ctx` forwarded, never stored
- [ ] Doc comment on every exported identifier, sentence form, ends with a period; every comment passes the cover and subject tests; no history, no session IDs
- [ ] Any reshaping of existing code: one change at a time, pinned by a pre-existing test, complexity reported for splits, merges proposed first
- [ ] Tests: table-driven, `t.Context()`, got-before-want messages, `errors.Is` assertions, `Fn`-field mocks that fail loudly, `t.Parallel()` where safe
- [ ] Interface changed → every implementation and every mock updated
- [ ] New tests failed before the code and pass after; refactors pinned by a test that passes unmodified before and after
- [ ] Tests appended to the existing `_test.go`; a new file only for a missing file or a separate build-tagged tier
- [ ] User journeys proposed for any feature change; the approved ones written and tagged
- [ ] `gofmt`/`goimports`, `go vet ./...`, `go build ./...`, `go test -race ./...`, project linter — run, and the output reported
- [ ] Nothing committed without the user's approval; nothing pushed without explicit approval for that push
