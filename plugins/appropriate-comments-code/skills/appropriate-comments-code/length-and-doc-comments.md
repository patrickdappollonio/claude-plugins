# Length, rules, and doc comments — the tenets in full, with worked examples

Read this file on first use of the skill in a session, and again before keeping any comment over two lines, writing a doc comment on a public item, or writing the test behind an editor-addressed comment. `SKILL.md` carries the summaries; this file carries the full text of tenets 1, 2, 3, 4 and 6 and the sibling rule, and shows them applied. The worked examples come first, the full rules after them.

## An eight-line "list of rules" and its rewrite

Tenet 1 defines a rule as a caller obligation or a guarantee, and lists what is not one: rationale, precedent, a comparison with no neighbour in the file, the body restated, the signature restated, an adjective. This is what that looks like on a real comment. Every sentence below was defended as "a rule the caller depends on".

```go
// Bad — eight lines, each sentence defended as "a rule the caller depends on"
// dropSettledLocked re-checks Status under the order lock, right before submit,
// for every caller (unlike the label and carrier rechecks, which are automation-only):
// a manual batch racing another event onto the same order fails just as badly, and
// claimPending already re-checks under its own lock for the same reason.
// An order already at want.state is dropped, reconciled to want.doneState, and marked
// confirmed; a Status read error keeps the order in the submit list (conservative).
// Bounded by s.recheckBudget; orders not yet checked when it expires are kept
// too. Returns the kept orders and the count dropped as already-in-state.
func (s *Submitter) dropSettledLocked(ctx context.Context, want target, orders []order) (kept []order, dropped int) {

// Good — the caller obligation and the sibling difference; nothing the body already shows
// dropSettledLocked must be called with the order lock held. Unlike the label and carrier
// rechecks it is not gated on automation: a manual batch can race the same order too.
func (s *Submitter) dropSettledLocked(ctx context.Context, want target, orders []order) (kept []order, dropped int) {
```

Underline the caller obligations in the bad version and two survive: the lock, and the deliberate difference from the sibling rechecks in the same file. "Fails just as badly" and "claimPending already re-checks" are rationale and precedent. The read error, the budget expiry, "reconciled, marked confirmed", and "returns the kept orders" are the body and the signature, a few lines below. The argument for manual callers goes to the PR description. Five identifiers left with them.

## A bulleted "decision table" that is the body restated

Tenet 1 exempts a decision table only after two tests: the row test (a row is a condition and an outcome, and then it ends; anything after the outcome, a reason, a comparison, a second sentence, is a gloss, and one gloss anywhere makes the block prose) and the body-match test (a row whose condition and outcome both sit in the body below is the body restated). This block was kept under the exemption because it has bullets.

```go
// Bad — five rows, every one glossed after its outcome, every one an if-and-return below
// classify maps a failed fetch to a retry decision:
//
//   - the context is done: giveUp — the caller has stopped waiting;
//   - a 429 with Retry-After: waitFor(header) — the server named the delay;
//   - a 5xx or a timeout: backoff — the usual transient case;
//   - any other 4xx: giveUp — retrying a client error changes nothing;
//   - a refused connection: backoff — the upstream is restarting.
func classify(err error, resp *http.Response) decision {
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return giveUp
	}
	if resp != nil && resp.StatusCode == http.StatusTooManyRequests && resp.Header.Get("Retry-After") != "" {
		return waitFor(resp.Header.Get("Retry-After"))
	}
	if resp != nil && resp.StatusCode >= 500 || isTimeout(err) {
		return backoff
	}
	if resp != nil && resp.StatusCode >= 400 {
		return giveUp
	}
	return backoff
}

// Good — the one fact the body's shape hides: the order is deliberate
// classify checks Retry-After before the status class: a 429 that names a
// delay waits that delay even when the client would back off sooner.
func classify(err error, resp *http.Response) decision {
```

Row test: five rows, five glossed, so the block is prose and the glosses go first. Body-match, run on the cleaned rows and never skipped because the rows are clean: every row's condition is an `if` and its outcome a `return` a few lines down, five of five, so what is left after the glosses restates the body and goes too. Had the task been "add a note about the ordering to this comment", the outcome is the same: the note is added, and the block it was added to is one comment with the note, judged whole. The ledger line reads `rows 5  glossed 5 body-match 5/5 → deleted; one constraint kept as 2 lines`. The constraint that survived is the ordering, which the body has but does not announce.

The same tests pass a table the body cannot show:

```go
// Good — no glosses, and the body cannot show this: the constraint lives in the schema
// Transitions the claims table accepts; anything else is rejected by its
// CHECK constraint, not by this code:
//
//   pending  → claimed, cancelled
//   claimed  → done, failed, pending
//   failed   → pending
func (s *Store) Transition(ctx context.Context, id string, to State) error {
```

Row test: three rows, none glossed. Body-match: zero of three, because the mapping is enforced by the database. The ledger line reads `rows 3  glossed 0 body-match 0/3 → kept; rows carried by the claims table CHECK constraint`. The unmatched rows are named with the place that carries them; an unmatched row with no such place is a loosened count.

## An editor-addressed comment, and where each part of it went

Tenet 2's editor test: a comment that tells a future editor what to do or not do is a promise nothing checks, however short. The verdict is an assertion in the test that already runs the code, the why above that assertion, and one line of fact in the code.

```go
// Bad — ten lines addressed to whoever edits this next; nothing fails if they ignore it
// BuildCustomerView converts the internal record into the portal shape.
//
// We deliberately withhold the SSN, the risk score, and the internal notes
// from the portal. The SSN is regulated PII and the portal is served over a
// CDN that caches responses, so it must never appear in any payload the
// portal can receive. The risk score is an internal fraud signal and exposing
// it would let a customer tune their behaviour against it. Do not add any of
// these fields to CustomerView without a review from the privacy team.
func BuildCustomerView(c Customer) CustomerView {

// Still bad — two lines, same audience, same enforcement: none
// BuildCustomerView drops the SSN, risk score and internal notes; never add
// them back to CustomerView without privacy-team review.
func BuildCustomerView(c Customer) CustomerView {

// Good — a fact about the code, and the test that makes it one
// BuildCustomerView converts the internal record into the portal shape;
// the portal never receives the SSN, risk score, or internal notes.
func BuildCustomerView(c Customer) CustomerView {
```

The existing test already builds the fixture and calls the function, so the assertion goes there, and the why goes above it, where test files allow length:

```go
func TestBuildCustomerView(t *testing.T) {
	c := sampleCustomer()
	v := BuildCustomerView(c)
	if v.Name != c.Name {
		t.Errorf("Name = %q, want %q", v.Name, c.Name)
	}
	// The portal is served through a CDN that caches by URL, so a field that
	// leaks once is served to every later request for that URL. The SSN is
	// regulated PII and the risk score is a fraud signal a customer could
	// tune against. Marshal the view rather than inspecting fields so that a
	// field added to CustomerView later is caught too.
	body, _ := json.Marshal(v)
	for _, secret := range []string{c.SSN, c.InternalNotes, "risk"} {
		if strings.Contains(string(body), secret) {
			t.Errorf("portal payload carries %q: %s", secret, body)
		}
	}
}
```

The privacy-team review is a process, and a test cannot run it: it goes to CONTRIBUTING or a CODEOWNERS entry on the file, and the comment drops it. The ledger line reads `export.go:9  10 lines  prose  → enforced by TestBuildCustomerView (assertion added; setup and call already there); 1 line kept; review step sent to CONTRIBUTING`.

A new `TestBuildCustomerViewOmitsSensitiveFields` was the wrong shape: it would call `sampleCustomer()` and `BuildCustomerView` exactly as the existing test does, which is 100% of the setup and action steps shared, and "it asserts a different invariant" describes the assertion, which is not a step. A handler with no test of its own is different: nothing performs its steps yet, so its test is new, named after the invariant, and the ledger says so with the count.

## What a long comment looks like in each language's own code

Every language has one long-form shape, and it is documentation. Outside it, the reference code of the language, the standard library, the compiler, the widely read projects, keeps comments to one or two lines.

| Language | The one long shape | The norm outside it |
|---|---|---|
| Go | `// Package x …` in `doc.go`; the doc comment on an exported identifier, as paragraphs | One or two lines; three is rare in the standard library |
| Rust | `//!` at the top of a module or crate; `///` with `# Errors`, `# Panics`, `# Safety`, `# Examples` | One or two lines; a `//` block over three lines is foreign |
| Python | The docstring on a public module, class, or function | One line above a statement, rarely two |
| JavaScript, TypeScript | JSDoc on an export | One or two lines |
| C, C++ | The header file comment; a block above a public declaration in the `.h` | One line in the body |
| Java, C# | Javadoc, `///` XML on a public member | One or two lines |

The consequence in Go and Rust: a non-doc comment over three lines is already outside what the language's own readers expect, so the four-line question is asked at three there, and a keep has to say which fact could not fit.

## A comment that names its own body

Tenet 7 keeps the lock a caller must hold, the neighbour a comment differs from, and things in other files. The fields the body reads and the helpers it calls are the body restated, and each is a rename away from wrong.

```go
// Bad — four names from its own body; two renames away from lying
// flush writes pending under mu, calls compact when len(pending) > maxPending,
// then resets lastFlush.
func (b *buffer) flush() error {

// Good — the caller obligation and the one external fact
// flush must be called with mu held. Writes are batched because the store
// rejects more than one open transaction per key.
func (b *buffer) flush() error {
```

## Doc comments: syntaxes and section conventions

A doc comment is whatever the project's documentation generator reads. The marker is not the exemption; the audience is. If the generator does not publish the item by default, its comment is a plain comment under the two-line limit, whatever syntax it uses.

Examples, not a specification:

| Language | Doc comment |
|---|---|
| Rust | `///` on an item, `//!` on a module or crate |
| Go | The comment directly above an exported identifier |
| Python | The docstring |
| Java, JavaScript, TypeScript | `/** ... */` |
| C# | `///` |

The shape on a published item is a summary of one or two lines, then the sections the language convention already defines, each stating a contract:

| Language | Sections after the summary |
|---|---|
| Rust | `# Errors`, `# Panics`, `# Safety`, `# Examples` |
| Go | Paragraphs of constraints; the `Deprecated:` paragraph |
| Python | `Args`, `Returns`, `Raises`, `Yields` in the project's docstring style |
| Java, JavaScript, TypeScript | `@param`, `@returns`, `@throws`, `@deprecated` |
| C# | `<param>`, `<returns>`, `<exception>` |

Sections grow length by structure. A prose paragraph after the summary is still prose and meets the four-line question below. Every other tenet applies inside a doc comment: no rationale, no precedent, no history, no body restated, no internals named, no counts.

```rust
// Bad — a public item; history and precedent inside the contract, no sections
/// Moves amount between accounts under the balances lock. Panics when amount
/// exceeds the limit, because a silent clamp hid a bug in the previous billing
/// pipeline, and the store layer already validates names for the same reason.
/// Errors are Overdrawn or UnknownAccount. Returns the remaining balance.
pub fn transfer(&self, from: &str, to: &str, amount: i64) -> Result<i64, LedgerError> {

// Good — two-line summary, then the convention sections, nothing else
/// Moves `amount` from `from` to `to` atomically under the balances lock and
/// returns the source's remaining balance, creating `to` at zero if missing.
///
/// # Errors
///
/// [`LedgerError::Overdrawn`] if the source balance is below `amount`;
/// [`LedgerError::UnknownAccount`] if the source does not exist.
///
/// # Panics
///
/// If `amount` exceeds the configured transfer limit; callers validate first.
pub fn transfer(&self, from: &str, to: &str, amount: i64) -> Result<i64, LedgerError> {

// A private helper: the three slashes buy nothing, so two lines
/// Must not be called with the balances lock held, unlike `record_reversal`:
/// the audit sink re-enters the ledger.
fn record_locked(&self, from: &str, to: &str, amount: i64) {
```

The billing-pipeline history goes to the PR description. The store-layer precedent goes with it, and was unverifiable from this file besides.

## Tenet 1 in full: the limit, the exemption, and what counts as a rule

Above a declaration — a function, type, variable, constant, or field — aim for **one or two lines**. Not as a hard cap, as a forcing function: if you need more, you are usually writing documentation, and it belongs somewhere a reader can find it on purpose.

The limit is not scoped to declarations. A comment above a **statement inside a body** — a call, a branch, a log line, an assignment — is one line, or two when it states a constraint or invariant, because it interrupts the flow of the function it sits in. Measure against the statement, not its line count: a call whose arguments span six lines is still one statement.

```go
// Bad — accurate, present-tense, breaks no other rule, and nobody reads it
// Retry uses exponential backoff starting at 100ms and doubling each attempt up
// to a ceiling of 30 seconds, because the upstream's own timeout is 30 seconds
// and a longer wait means the caller has already abandoned the request. Jitter
// is a random factor between 0.5 and 1.5 of the delay, which prevents the
// thundering herd when many workers fail together, for example on an upstream
// restart. We chose full jitter over equal jitter after measuring both.
func Retry(ctx context.Context, fn func() error) error {

// Good — the two facts a caller cannot see, and nothing else
// Retry backs off exponentially to a 30s ceiling, matching the upstream's own
// timeout. Jitter is required: without it, workers that fail together retry together.
func Retry(ctx context.Context, fn func() error) error {
```

The long version's content is not worthless. The measurement that chose full jitter belongs in a commit message or a design note. The reader of this function needs to know the ceiling is not arbitrary and the jitter is not decorative.

**Where the limit genuinely does not apply:** a decision table, a state machine, or a list of preconditions, one rule per line. Bullet markers and aligned columns are not the exemption. The exemption is earned by two tests, run on every row **before** the exemption is claimed, with the counts written in the ledger (`ratio-and-ledger.md`):

1. **The row test.** A row is a condition and its outcome, and then the row ends. Anything after the outcome is a gloss: a dash or parenthesis opening an explanation, a clause starting with "because", "since", "so that", "which", or "unlike", a second sentence. Read each row and stop at the first gloss. One glossed row anywhere and the block is prose wearing bullets. It is then measured by the four-line question below, after the glosses are cut: they are rationale and the body restated, which the list below already says are not rules.
2. **The body-match test.** For each row, find the line in the body that carries the row's condition and the line that carries its outcome: the `if` or `case`, the log message and its level, the return value. Count the rows with both. When every row has both, the table is the body restated, fails the cover test row by row, and is deleted whatever its shape. The exemption holds only for a table with at least one row the body cannot show, because the mapping lives in data, is spread across files, or is hidden by the code's shape. An unmatched row is named in the ledger with the place outside the body that carries it (a schema, a config file, another function). A row you cannot point to elsewhere is matched: a branch that returns early, a condition tested in two places, and an outcome spelled by a log message are all full matches.

The exemption never covers *why*; reasons go to the doc or the handoff.

**What counts as a rule.** A rule is something the caller must do or hold, or something the caller can rely on: a lock to take, an ordering to keep, what a return value means on error. These are not rules, and cutting them never drops one:

- rationale: "because a manual batch reverts just as badly"
- precedent: "X already does this for the same reason"
- a comparison with no neighbour in the file: a counterfactual, or code elsewhere (a sibling difference in tenet 4's form is about shape and stays)
- a description of the body: "reconciled, then marked confirmed"
- a restatement of the signature: "returns the kept orders and the count dropped"
- an adjective: "(conservative)", "(defensive)"

Cut those first. Then, when several rules share a principle, state the principle once: "every write path takes mu before touching the store" covers three callers' obligations in one line. A rule is dropped only when the new text no longer implies it. Never drop a rule to hit the limit; compress the prose around it. The eight-line "list of rules" at the top of this file is the worked example.

**A prose comment still over four lines is a question, not a keep.** After the tenets, do not keep a prose comment longer than four lines under an exemption claim. Show the user the comment and a candidate home (package doc, API doc, README, ADR, PR description), and leave one or two lines in the code. When there is no user to ask, move it to the handoff and say so. A table or a one-rule-per-line list is a different shape and is measured by the ratio check instead. In Go and Rust the question is asked at three lines, because the language's own code does not go past that outside a doc comment.

**Doc comments on public items are documentation, and are judged as such.** For a public item, the doc comment is where the documentation lives: the project's documentation generator renders it, and readers reach it on purpose. A doc comment is whatever that generator reads; the syntaxes and section conventions per language are in the table above.

Its shape is a summary and then sections. The summary is one or two lines, and that is where the limit lands. After it, the sections the language convention already defines, each stating a contract: Errors, Panics, Safety, Examples in Rust; Args, Returns, Raises in a docstring; the Deprecated paragraph in Go. Sections are the doc-comment form of the one-rule-per-line list, so length grows by structure. A prose paragraph past the summary is still prose and still meets the four-line question. Every other tenet applies unchanged: no rationale, no precedent, no history, no body restated, no internals named, no counts. A long doc comment is rewritten, not truncated.

**The marker is not the exemption; the audience is.** Three slashes on a private Rust function, a docstring on a private helper, or a Go comment above an unexported function is a plain comment under the two-line limit. The test is observable: does the project's documentation generator publish this item by default? If not, it is a comment, whatever syntax it uses.

## Tenet 2 in full: the editor test

The regression rule (a bug that must not come back is pinned by a test named after the invariant, never by a "don't remove this" comment) is one case of a wider one. Ask who the comment is addressed to. A comment addressed to a **caller** states something the reader is about to depend on: a lock to hold, a unit, who owns the buffer, what an error return means. It stays. A comment addressed to a **future editor** tells them what to do or not do to the code: "never send X to the portal", "always go through the builder", "do not lower this to Debug", "keep both", "keep this in step with the signup service", "restoring this needs a privacy review". It is a promise with no check, and no wording, however short, makes it one. It does not matter that it is present-tense, that it names a real constraint, that no incident has happened yet, or that it looks like a "forward-looking gate": the rule is exactly as enforced as a comment can make it, which is not at all. Rewriting it to two lines leaves a two-line pinky promise, and rewording it as a fact changes the sentence's audience, not who can break the rule.

The verdict for an editor-addressed comment is a check plus one line, and the check is written in this pass. It is not scope creep and not a follow-up: the ledger verdict is "enforced by …", and a verdict the file does not show is a failed pass, the same as "deleted" with the lines still there.

1. **Find or write the thing that fails.** A test assertion, a type that cannot hold the forbidden value, a validation, a lint rule. Prefer the one the project already uses for rules like it.
2. **Put the assertion in the test that already runs the code.** List the setup and action steps the assertion needs (assertions are not steps). If an existing test on the same function or command already performs 60% or more of them, the assertion goes into that test, whatever its name, and however different its "subject" feels. "The negative space reads better as its own function" and "it asserts a different invariant" are the same setup copied twice. A step is a call made, not a value passed: an erroring job instead of a succeeding one, an empty list instead of three, a mixed-case address instead of a lower-case one is the same step with a different argument, and the existing test takes the new value as a case or a second call, not a second function. A new test function is written only when no existing test performs the steps, and then it is named after the invariant.
3. **Put the why in the test or a doc.** Test files are where this skill allows length and history: the reasoning for the rule, the incident, the regulation, the CDN behaviour, goes above the assertion as a test comment, or in the package doc or ADR when one is in scope. Never in the code.
4. **Leave one line in the code, stated as a fact, not an instruction.** "Portal payloads never carry the SSN; pinned by TestBuildCustomerView" rather than "Never add the SSN to CustomerView". A fact describes the code; an instruction describes the editor. Naming the test is optional and only when it exists.

Two shapes cannot be enforced by a test, and the answer is still not a comment. **A process** ("needs privacy-team sign-off", "ask security before changing") is a contribution rule and lives in CONTRIBUTING, a CODEOWNERS entry, a PR template, or the team's doc; the comment drops it entirely. **A value that must be kept in step with something else** is enforced by sharing the value (one constant, one config key both read) or by a test that reads both; when neither is possible the one line names the other place, and the ledger says the coupling is unenforced.

The worked example at the top of this file ("An editor-addressed comment, and where each part of it went") shows the four steps applied. The "Do not lower this to Debug" log line in tenet 3's example is the same case: the level is asserted in the test that already runs the tick, with a captured log handler, and the one line "Info, not Debug: …" is what is left after the test exists, not instead of it.

## Tenets 3 and 4 in full: self-describing statements, workarounds, and siblings

**Self-describing statements.** A log call, a metric emit, an error message, an assertion message, or a panic already carries its prose: the message and its fields say what it is for. The cover test for these is stricter: cover the comment and read the *message*. If the message already says it, the comment is a restatement. First confirm the line should exist at all: a forgotten debug print gets deleted, not explained. Then the only comment it can earn is one line about a non-obvious choice in its **shape** (a level that looks wrong, a field deliberately omitted, a sampling rate, a message that must match an alert rule) or one line naming a verifiable external requirement that mandates it (a compliance rule, a spec clause). An argument is neither.

```go
// Bad — defends that the line exists; the message already says what is logged
// The job table only records jobs that finished. A tick that found no work
// leaves no row, and "why did nothing run between 02:00 and 03:00?" needs
// exactly those ticks. Emitting on EVERY tick, not only when a job runs, is
// what makes the gap visible. Do not lower this to Debug.
logger.Info("scheduler tick", "queue", q.Name, "picked", len(jobs))

// Good — one line, about the one choice in the line's shape; the level is asserted in the tick's test
// Info, not Debug: empty ticks are the only record that the scheduler was alive.
logger.Info("scheduler tick", "queue", q.Name, "picked", len(jobs))
```

The long version defends the line's **existence**; the short one explains its **shape**. A comment *arguing* that a line should exist is an argument with an imagined reviewer, and it goes to the handoff, not the file. Naming the rule that mandates the line is a citation, not an argument, and it stays.

**Workarounds.** The durable form points at something that outlives the session and states its own exit condition:

```js
// Safari <= 17 fires `resize` before viewport metrics settle; drop this once
// Safari 18 is the minimum. https://bugs.webkit.org/show_bug.cgi?id=254340
requestAnimationFrame(measure);
```

**The sibling-difference form (tenet 4).** A comment on a line that differs from its siblings has three parts, in this order, and nothing else, in **two lines total**. Before writing it, point at the actual neighbour: the sibling route, branch, or call this one differs from. If you cannot name one in the file, do not use this form: a comment built on a counterfactual ("not only on failure", "unlike a naive version") is defending existence, not shape. The line may still earn a comment under tenet 3 for a constraint or invariant; it just has no sibling difference to explain.

1. **That the difference is deliberate** — one word or phrase: "Deliberately", "On purpose", "Unlike the routes above".
2. **The one mechanical difference** — what this line does that the neighbours do not, named in the code's own terms (the wrapper, the label, the skipped step).
3. **What breaks if it is normalized** — the observable consequence of "fixing" it to match.

```go
// Bad — about the feature; the one fact that matters is buried in the last clause
// The cross-asset search is TOP-LEVEL: it is not "one asset's entries" but
// "where does this wallet (or customer, or asset) appear". It shares the
// surface's dual-credential auth and carries its own handler label for the
// same reason every other route here does.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)

// Good — says the line is intentionally different, and what would break
// Deliberately its own With chain: this route reports under its own handler
// label, not the router's shared one, or its metrics merge with the asset endpoints.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)
```

Everything the bad version says may be true. It is product documentation, and it belongs in the API doc or package comment, where a reader asking "what is cross-asset search" will look. Nobody asks that of a router file. When a comment is bigger than the code, it is almost always about something other than the code.

## Tenet 6 in full: name the set, not its size

| Wrote | Because you meant | Write instead |
|---|---|---|
| "the 7 tests in this file" | the tests here | "the tests in this file" |
| "all 13 integration tests" | a suite with a name | "the `integration`-tagged tests" |
| "the three callers" | callers exist and care | "callers depend on this ordering" |
| "both fields must be set" | a pair that may become three | "every credential field must be set" |
| "the 4 steps below" | a sequence | "the steps below, in order" |
| "retries 5 times" | a limit the code enforces | `maxRetries = 5` with a comment saying why 5 |

```go
// Bad — two tallies, both stale the moment anyone adds a test
// The current suite has 7 tests that verify this against Postgres. To switch
// to CouchDB you also need to run the 13 other integration tests.
func TestInsert(t *testing.T) {

// Good — names the set; grows with it
// Verified against Postgres here; the CouchDB tests are in couchdb_test.go
// under the `integration` build tag.
func TestInsert(t *testing.T) {
```

A count that is genuinely load-bearing — "must be exactly two, the protocol sends a pair" — is an invariant, and an invariant is enforced by an assertion or a test, then commented, not commented alone.

## A new member matches its siblings

When you add one element to a list of peers — a struct field, a class attribute, an enum variant, an interface property, a config key, a route registration, a table column, a switch case — the new element adopts the **comment density and placement its siblings already have**. If the siblings are bare, the new one is bare. If they carry trailing one-liners, the new one may carry one, and only if it passes the cover test. If the whole list is described once above the type, the new member's meaning goes into that description. Density sets the ceiling and the placement; it never requires a comment that carries nothing.

```go
// Bad — the only commented field, in a block its siblings do not have
type Config struct {
	PageSize     int
	Timeout      time.Duration
	// MaxRetries bounds retries against the upstream inventory API, which
	// rate-limits after ten rapid retries and locks the key for a minute.
	MaxRetries int
}

// Good — bare like its siblings; the constraint lives where it is enforced
type Config struct {
	PageSize     int
	Timeout      time.Duration
	MaxRetries   int
}

// Upstream locks the key for a minute past 10 rapid retries; 0 means none.
if c.MaxRetries < 0 || c.MaxRetries > maxUpstreamRetries {
```

Readers infer emphasis from asymmetry: the one commented field among twelve reads as the dangerous one. The block is there because the field is new to *you*, and "new" stops being true at merge. **The day-one test:** would this comment exist if the element had been here since the file was created? If not, it is about your edit, not the code. The same test catches the essay above a log line you happened to add today.

A real constraint on the new member — a unit, a range, an invariant — still goes somewhere: into the name first (`TimeoutMillis`, not `Timeout` plus a comment), then a trailing one-liner if the siblings use them, otherwise the type's doc comment or the validation that enforces it. A caller must never be left unable to learn a public field's unit because its siblings are bare.
