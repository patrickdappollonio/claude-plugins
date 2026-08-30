# Effective Go

An opinionated skill for **writing Go the way the Go community writes it** —
with a few house preferences that win when the sources disagree. It loads
whenever the agent writes, edits, or reviews Go, and it is a specification
with a checklist, not a mood board: the code is done when the checklist is
true and the gate output (`gofmt`, `go vet`, `go test -race`, the linter) is
in hand.

It condenses:

- [Effective Go](https://go.dev/doc/effective_go)
- the [Google Go Style Guide](https://google.github.io/styleguide/go/guide)
  and its [decisions](https://google.github.io/styleguide/go/decisions)
- the [Go Proverbs](https://go-proverbs.github.io/), each translated into a
  concrete "do this"
- the [Gruntwork Go style guide](https://docs.gruntwork.io/guides/style/golang-style-guide/)
  (minus Gruntwork-only conventions such as `FooE` error-returning variants)
- two community write-ups on Go standards, with their outdated advice
  (loggers in `context.Value`, a generic `pkg/`) dropped

…and layers a set of house rules on top, which supersede the sources above:

- **Errors read like sentences.** Operational errors are
  `failed to <verb> <object> [%q]: %w` — never a bare verb, never `"open %q: %w"`,
  never terse `"db: %w"`. Sentinels are noun phrases (`customer not found`).
  `errors.New` when nothing is formatted, `%q` instead of `'%s'`, `%w` last,
  `errors.Is`/`errors.As` to compare, and every error handled exactly once —
  no log-and-return.
- **Mocks are hand-written `Fn`-field structs that fail loudly.** A nil `Fn`
  returns a `not implemented` error naming the mock and field (or panics when
  the method has no error return), so a test that forgot to wire a dependency
  can never pass on a zero value. No mocking libraries, no `sqlmock`;
  `httptest` for HTTP.
- **Tests** are table-driven, use `t.Context()` / `t.TempDir()` /
  `t.Setenv()`, print got-before-want, and assert errors with `errors.Is`.
- **Dependencies:** stdlib first; a little copying beats a little dependency;
  use the Go version in `go.mod`.

It also carries Go-flavored condensations of two sibling skills, so a single
install has everything — this marketplace ships each skill standalone, and
nothing here reaches outside its own directory:

- **Comments** (from `appropriate-comments-code`): a comment earns its place
  by carrying information the code does not, about the code as it is now, in
  two lines; doc comments are sentences written for the caller; no history,
  no review rounds, no task IDs; regressions are pinned by tests.
- **Simplification** (from `code-simplification`): reshape only what's in
  scope, one change at a time, each pinned by a test that predates it;
  cyclomatic complexity counted and reported before splitting; near-duplicate
  functions are diffed and a merge is *proposed*, never done by reflex; a
  failing test means revert the change, never the test.

## Pairs with JetBrains' `use-modern-go`

This skill knows idiom and discipline; it does not know what shipped in the
Go release you target. JetBrains'
[`modern-go-guidelines`](https://github.com/JetBrains/go-modern-guidelines)
plugin (skill `use-modern-go`) runs a small CLI that lists version-specific
guidelines for the Go in your `go.mod` — newer than any model's training
data. It is deliberately **not** distilled here. Instead, the agent checks
whether `use-modern-go` is installed: if so it invokes it before editing and
treats its output as authoritative for which language features to use (house
rules still govern errors, mocks, comments, and process); if not, it
recommends it once per session with the install commands and carries on.

## Layout

- `SKILL.md` — the process, the summaries, rationalizations, red flags and
  the final checklist. Loads on every invocation.
- `errors.md` — the full error-writing specification.
- `testing.md` — tests, assertions, and the `Fn`-field mock pattern.
- `style.md` — naming, layout, control flow, types, receivers, interfaces,
  generics, concurrency, context, logging, dependencies.
- `comments.md` — doc comments and inline comments: what earns a line.
- `simplification.md` — reshaping working code without changing behavior.

The skill insists the agent read all five companion files on first use in a
session; the summaries in `SKILL.md` are reminders, not substitutes. It
references sibling files by bare filename only, so it works identically
under Claude Code, Codex, and any other agent that installs a skill directory.

## Install

```
/plugin install effective-go@patrickdappollonio
```

or, for any other agent:

```
npx skills add patrickdappollonio/claude-plugins --skill effective-go
```

Then just write Go — it loads itself.
