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
  comment is acceptable only for a package comment or for a genuinely
  complex exported API, and then it is written as `godoc` prose with the
  constraints first.
- Package comment: `// Package uploader ...` directly above `package uploader`,
  in one file (`doc.go` when it is long). It orients; it does not repeat
  the doc comments of the exports.
- Struct fields: a short phrase is fine; the field name is the subject.
  Units, ranges, and "must be set before X" belong here.
- Deprecations use the `// Deprecated: use X instead.` paragraph form so
  tooling sees it.

## Five tenets

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

The one legitimate exemption is a decision table or state machine where
the mapping *is* the contract — and then the comment is mostly table.

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

### 5. No identifier that outlives nothing

None of these go in a comment: finding numbers (`F7`, "finding 3"),
iteration labels ("pass 2", "v2 of this"), wave/batch/task IDs, plan step
numbers, project phase names ("in this stage"), agent or session labels,
checklist positions. The context that gave them meaning is gone; the ID
stays forever. Tracker IDs (JIRA, GitHub issues) only if the project
already uses them in comments — grep first; otherwise ask.

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

## Red flags in your draft

- More than two or three lines and none states a constraint, invariant, or contract
- "used to", "previously", "we tried", "no longer", "originally", "instead of the old"
- "per review", "as discussed", "from the audit", "flagged by", "for context", "background:"
- "in this stage", "phase 2", "wave 4", "task 17", "pass 2", `F7`
- A prose translation of the identifier below it
- About the feature, route, or policy while the code is a call or a branch
- Longer than the code it annotates
- Names an identifier, file, or test you have not confirmed exists
- A section banner repeating the name beneath it
- Names what the variable or block *should* be called
- A `TODO` with no stated gap; copied code with no link; an apology or hedge

## Checklist

- [ ] Every exported identifier has a doc comment: sentence, starts with the name, ends with a period, written for the caller
- [ ] Every comment above a declaration is one or two lines (or a table that cannot compress)
- [ ] Every comment is present tense and survives the cover test and the subject test
- [ ] No comment narrates a previous attempt, a past bug, or this edit; any fixed regression is pinned by a test named after the invariant
- [ ] No session-scoped identifiers; tracker IDs only if the repo already uses them
- [ ] Every name, path, test, and number a comment mentions was confirmed
- [ ] No comment stands in for a rename or a split
- [ ] Comments near every changed line were re-read and still hold
- [ ] Directive comments untouched; commented-out code gone; TODOs state the gap in the repo's form
