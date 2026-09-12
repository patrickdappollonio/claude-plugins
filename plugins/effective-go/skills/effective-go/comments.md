# Comments — the full guide

Read this file on first use of the skill in a session, and again before
adding, changing, or reviewing any comment or doc comment. `SKILL.md`
carries the summary; this file is the specification. It condenses the
standalone `appropriate-comments-code` skill for Go.

## The rule

**A comment earns its place by carrying information the code does not,
about the code as it is now, in as few lines as that takes.**

Three ways to fail it, equally fatal:

1. **Restating** the line below it.
2. **Narrating** how the code got here.
3. **Explaining at length** something true — that is documentation, and it
   lives in a package doc, a README, or the PR, not above a function.

The reader has none of your context, is skimming for one function, and pays
for every line above it. Twenty accurate lines are a worse comment than two.

## Doc comments (Go convention)

- Every exported identifier has one. Unexported ones get one when the
  purpose isn't obvious from the name.
- A complete sentence, beginning with the identifier's name, ending with a
  period: `// Client uploads local files to a Storage backend.`
- Written for the **caller**: what it does, what it returns, which errors
  it can return that a caller might check, whether it blocks, who owns a
  returned resource, what it panics on. Not how it is implemented.
- One or two lines above a declaration is the working limit. A longer doc
  comment is acceptable only on an identifier `godoc` publishes — an
  exported one, or the package — and then as a two-line summary followed
  by the constraints as `godoc` paragraphs or the `Deprecated:` form, each
  stating a contract. A comment above an unexported identifier is a plain
  comment under the limit, however it is written. Rationale, precedent,
  and the body restated are cut from a doc comment too.
- Package comment: `// Package uploader ...` directly above `package uploader`,
  in one file (`doc.go` when it is long). It orients; it does not repeat
  the doc comments of the exports.
- Struct fields: a short phrase is fine; the field name is the subject.
  Units, ranges, and "must be set before X" belong here.
- Deprecations use the `// Deprecated: use X instead.` paragraph form so
  tooling sees it.

## Six tenets

### 1. Two lines is the working limit

If you need more above a declaration, you are usually writing
documentation. Keep the two facts the caller cannot see; move the rest.

```go
// Bad — accurate, and nobody reads it
// Retry uses exponential backoff starting at 100ms and doubling each attempt
// up to a ceiling of 30 seconds. The ceiling exists because the upstream
// service's own timeout is 30 seconds ... (eight more lines)
func Retry(ctx context.Context, fn func() error) error {

// Good
// Retry backs off exponentially to a 30s ceiling, matching the upstream's own
// timeout. Jitter is required: workers that fail together must not retry together.
func Retry(ctx context.Context, fn func() error) error {
```

The one legitimate exemption is a decision table, a state machine, or a
one-rule-per-line list, and bullets do not grant it; two tests do, run on
every row before the exemption is claimed. The row test: a row is a
condition and its outcome, and then it ends; anything after the outcome is
a gloss (a dash or parenthesis opening an explanation, a clause starting
with "because", "since", "so that", "which", or "unlike", a second sentence)
and one glossed row makes the block prose, however many rules it holds. The body-match test: a row whose condition and outcome both sit in
the body below (the `if`, the log message and level, the return) is the body
restated, and a table whose every row matches is deleted whatever its shape.
Before finishing, list every comment of three or more lines in the change as
a whole comment, meaning the contiguous run of comment lines (appending a
note to a block makes the run yours, and "the task only asked for a note"
changes nothing), with its shape, the row and body-match counts for any
list, and the verdict; a table kept without both counts was kept on shape,
and a verdict of "deleted" with the lines still in the file is a failed
pass.

**A rule is a caller obligation or a guarantee**: a lock to hold, an
ordering to keep, what a return means on error. Rationale ("because a
manual batch fails just as badly"), precedent ("X already does this"),
a comparison with no neighbour in the file (a sibling difference in tenet
4's form stays), the body restated, and adjectives ("conservative") are not rules; cut them
first, and cutting them drops nothing. Rules that share a principle
compress into the principle, stated once. A prose comment still over four
lines after that is not kept under an exemption claim: show the user the
comment and a candidate home (package doc, README, ADR, PR description),
leave two lines in the code, or move it to the handoff when nobody can be
asked.

### 2. Describe the current state, never the path here

```go
// Bad
// We used to buffer the whole body but it blew memory on large payloads,
// so now we stream it.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {

// Good — the constraint, present tense
// Fetch streams the body: payloads are unbounded and a buffered read can
// exceed the container memory limit. The caller must Close the reader.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {
```

**A regression is pinned by a test, not a comment.** "Don't remove this
check, it caused a double refund" guards nothing; `TestRefundIsNotAppliedTwice`
does. Name the test after the invariant, never the incident.

### 3. The cover test

Cover the comment with your hand and read the code. If you lost nothing,
delete the comment. `// create a new client` above `client := New()` fails.
`// Postgres drops idle connections after 5m; Open reconnects lazily, so
callers must not cache the socket.` passes.

What a comment may carry: an external constraint (rate limit, spec clause,
protocol quirk); an invariant or precondition (`Callers must hold mu.`;
`items is sorted by ID; the binary search below depends on it.`); units,
ranges, ownership; why a non-obvious approach is required; why
wrong-looking code is correct; a workaround for an external defect with
its link and exit condition; a value that must stay in step with another
file; what a caller needs without reading the body.

```go
// net/http retries idempotent requests on a reset connection, which would
// double-submit this POST. See golang/go#12345 — drop once the minimum
// Go version is 1.30.
req.GetBody = nil
```

### 4. The subject test

A comment is about **its lines**, not the feature they implement. If the
comment describes a route, a product, a customer, or a policy and the code
below is a call, a wrapper, a branch, or a registration, it is on the wrong
subject. Ask *what is non-obvious about how this line is built?* — most
often, why it differs from its neighbours. Then write, in this order and
nothing else: that the difference is deliberate; the one mechanical
difference; what breaks if it is normalized.

```go
// Deliberately its own With chain: this route reports under the onboarding
// handler label, not the router's shared label. Folding it into the group
// would lump its metrics in with the asset endpoints.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)
```

A comment longer than the code it sits on is almost always about something
other than the code.

### 7. Name nothing the body already uses

Every identifier in a comment is a coupling the compiler never checks; a
rename leaves it confidently wrong. Name only what the body below does not
use: the lock a caller must hold, the neighbour a comment differs from, a
constraint in another file, an external system. The fields the body reads
and the helpers it calls stay out — the body is the authority on those. A
doc comment naming four things from its own body is the body restated; say
it in words or cut it.

### 5. No identifier that outlives nothing

None of these go in a comment: finding numbers (`F7`, "finding 3"),
iteration labels ("pass 2", "v2 of this"), wave/batch/task IDs, plan step
numbers, project phase names ("in this stage"), agent or session labels,
checklist positions. The context that gave them meaning is gone; the ID
stays forever. Tracker IDs (JIRA, GitHub issues) only if the project
already uses them in comments — grep first; otherwise ask.

### 6. Name the set, not its size

A count in a comment is a tally of something that lives elsewhere, true
the day it is written and silently wrong after the next addition, because
nothing recomputes it. **The count test:** could someone add one more of
the thing, in another file, without touching this comment? Then the number
goes, and the comment points at the set instead — a file, a build tag, a
pattern, an invariant — so it grows with it.

```go
// Bad — stale the moment anyone adds a test
// The current suite has 7 tests that verify this against Postgres. To switch
// to CouchDB you also need to run the 13 other integration tests.
func TestInsert(t *testing.T) {

// Good — names the set
// Verified against Postgres here; the CouchDB tests are in couchdb_test.go
// under the `integration` build tag.
func TestInsert(t *testing.T) {
```

Same for "both fields", "the three callers", "the four cases above". A
number stays only when it is a constraint this code enforces — "batch size
must stay under 50; the API rejects larger" — and then it is a named
constant the comment explains, not a literal in prose beside a literal in
code. A count that is genuinely load-bearing ("exactly two: the protocol
sends a pair") is an invariant, enforced by a test or a check and *then*
commented.

## Fix the code before you comment it

- A comment that names what a variable should be called is a rename
  request: `// n is the retry count` above `n := 3` → `retryCount := 3`.
- A comment explaining what a block does is a request for a function with
  that name.
- If you cannot say in two lines why a block exists, the block needs
  splitting, not a longer comment.
- "Magic, do not touch" and "not sure why this works" announce confusion
  without dispelling it. State the invariant or find out.
- Copied code links its source URL in one line.
- Incomplete work is a `TODO` in the project's existing form, stating the
  gap in the present tense: `// TODO: honour Retry-After on 429.` Never
  `// TODO: fix later` or `// TODO from review`.
- Commented-out code is deleted. Version control remembers it.
- Never delete or alter directive comments — `//go:build`, `//go:generate`,
  `//go:embed`, `//nolint`, `//lint:ignore` — they are code.

## Verify what a comment claims

Before writing or keeping a comment that names something, confirm it
exists: an identifier (grep it), a file path, a test name, a numeric claim.
A comment naming a method that was renamed sends the reader on a hunt.

## When you edit code, you own its comments

Re-read every comment above, inside, and just after the lines you touched.
Update or delete each one that no longer matches — especially one that
describes *one* of something your change made *two*.

## Reviewing comments

Every added or changed comment in a diff is a finding until it passes.
Label it `restates`, `narrates`, `documents` (true but too long or wrong
subject), `unverified`, or `stale`. Then **rewrite or delete — never keep
as-is**, and relocate accurate documentation to where it belongs (package
doc, README, PR). Report it beside the code findings; a comment on the
wrong subject is not a nit. Don't sweep comments outside the change.

## Where context belongs

| Context | Home |
|---|---|
| A bug that must never return | A test named after the invariant |
| Why this approach over the one it replaced | Commit message / PR |
| A review finding | The review thread |
| Follow-up work | The tracker |
| Alternatives rejected | Design doc / ADR |
| How a subsystem fits together | Package doc or README |
| A standing constraint on *this* code | A comment — the case comments are for |

## Rationalizations

| Rationalization | Reality |
|---|---|
| "The history explains why I changed it" | The reader sees today's code. State the constraint; the story goes in the commit. |
| "A comment warns the next person not to undo the fix" | Nothing checks a comment. Write the test. |
| "It's all true and relevant" | That is the bar for documentation. The bar for a comment is *and it fits in two lines*. |
| "The comment documents what the function does" | Doc comments say what the caller cannot see: errors, side effects, preconditions — not a prose copy of the body. |
| "It explains what this endpoint is" | Wrong subject. Comment why the line differs from its neighbours; describe the feature in the package doc. |
| "A comment will explain what `n` means" | Rename `n`. |
| "It's too complicated to explain briefly" | Then it is too complicated. Split or rename until two lines suffice. |
| "I'll leave the old code commented out" | Version control. Delete it. |
| "I shortened it, so it's better" | Only if every rule survived. A tidy comment missing `callers must hold mu` is a downgrade. |
| "Each sentence is a rule the caller depends on" | Most are reasons, precedents, or the body restated. Underline the obligations; what is left is the comment. Over four lines of prose, ask where it goes. |
| "It can go in CLAUDE.md" | CLAUDE.md instructs agents; no reader of the code looks there. Package doc, README, or ADR. |
| "It's a doc comment, so length rules don't apply" | Only on an exported identifier, and only as a summary plus contract paragraphs. Above an unexported function it is a comment. |
| "The count is accurate, I just checked" | Accurate today; nothing re-checks it when the eighth test lands. Name the set instead. |
| "It's a small number, it won't change" | Small sets are the ones that grow. "Both" becomes three more often than 40 becomes 41. |

## Red flags in your draft

- More than two or three lines and none states a constraint, invariant, or contract
- "used to", "previously", "we tried", "no longer", "originally", "instead of the old"
- "per review", "as discussed", "from the audit", "flagged by", "for context", "background:"
- "in this stage", "phase 2", "wave 4", "task 17", "pass 2", `F7`
- A tally of things that live elsewhere: "the 7 tests", "13 other", "three callers", "both", "all four"
- A prose translation of the identifier below it
- About the feature, route, or policy while the code is a call or a branch
- Longer than the code it annotates
- Prose over four lines that you are calling "rules"
- Names a field the body reads or a helper the body calls
- Names an identifier, file, or test you have not confirmed exists
- A section banner repeating the name beneath it
- Names what the variable or block *should* be called
- A `TODO` with no stated gap; copied code with no link; an apology or hedge

## Checklist

- [ ] Every exported identifier has a doc comment: sentence, starts with the name, ends with a period, written for the caller
- [ ] Every comment above a declaration is one or two lines (or a table or one-rule-per-line list); no prose over four lines kept under an exemption claim
- [ ] Every table or list kept under the exemption has no row glossed after its outcome and at least one row the body does not carry, and every comment of three or more lines in the change is listed whole, with counts and verdict
- [ ] No comment names a field the body reads or a helper the body calls
- [ ] Every comment is present tense and survives the cover test and the subject test
- [ ] No comment narrates a previous attempt, a past bug, or this edit; any fixed regression is pinned by a test named after the invariant
- [ ] No session-scoped identifiers; tracker IDs only if the repo already uses them
- [ ] No count of tests, callers, fields, cases, or steps that live elsewhere; every number left is a constraint this code enforces, as a named constant
- [ ] Every name, path, test, and number a comment mentions was confirmed
- [ ] No comment stands in for a rename or a split
- [ ] Comments near every changed line were re-read and still hold
- [ ] Directive comments untouched; commented-out code gone; TODOs state the gap in the repo's form
