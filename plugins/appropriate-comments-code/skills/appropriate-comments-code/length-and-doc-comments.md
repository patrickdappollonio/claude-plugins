# Length, rules, and doc comments — the worked examples

Read this file on first use of the skill in a session, and again before
keeping any comment over two lines or writing a doc comment on a public item.
`SKILL.md` carries the rules; this file shows them applied.

## An eight-line "list of rules" and its rewrite

Tenet 1 defines a rule as a caller obligation or a guarantee, and lists what is
not one: rationale, precedent, a comparison with no neighbour in the file, the
body restated, the signature restated, an adjective. This is what that looks
like on a real comment. Every sentence below was defended as "a rule the caller
depends on".

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

Underline the caller obligations in the bad version and two survive: the lock,
and the deliberate difference from the sibling rechecks in the same file.
"Fails just as badly" and "claimPending already re-checks" are rationale and
precedent. The read error, the budget expiry, "reconciled, marked confirmed",
and "returns the kept orders" are the body and the signature, a few lines
below. The argument for manual callers goes to the PR description. Five
identifiers left with them.

## A bulleted "decision table" that is the body restated

Tenet 1 exempts a decision table only after two tests: the row test (a row is
a condition and an outcome, and then it ends; anything after the outcome, a
reason, a comparison, a second sentence, is a gloss, and one gloss anywhere
makes the block prose) and the body-match test (a row whose condition and
outcome both sit in the body below is the body restated).
This block was kept under the exemption because it has bullets.

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

Row test: five rows, five glossed, so the block is prose and the glosses go
first. Body-match, run on the cleaned rows and never skipped because the rows
are clean: every row's condition is an `if` and its outcome a `return` a few
lines down, five of five, so what is left after the glosses restates the body
and goes too. Had the task been "add a note about the ordering to this
comment", the outcome is the same: the note is added, and the block it was
added to is one comment with the note, judged whole. The ledger line reads `rows 5  glossed 5
body-match 5/5 → deleted; one constraint kept as 2 lines`. The constraint
that survived is the ordering, which the body has but does not announce.

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

Row test: three rows, none glossed. Body-match: zero of three, because the
mapping is enforced by the database. The ledger line reads `rows 3  glossed 0
body-match 0/3 → kept; rows carried by the claims table CHECK constraint`.
The unmatched rows are named with the place that carries them; an unmatched
row with no such place is a loosened count.

## A comment that names its own body

Tenet 7 keeps the lock a caller must hold, the neighbour a comment differs
from, and things in other files. The fields the body reads and the helpers it
calls are the body restated, and each is a rename away from wrong.

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

A doc comment is whatever the project's documentation generator reads. The
marker is not the exemption; the audience is. If the generator does not publish
the item by default, its comment is a plain comment under the two-line limit,
whatever syntax it uses.

Examples, not a specification:

| Language | Doc comment |
|---|---|
| Rust | `///` on an item, `//!` on a module or crate |
| Go | The comment directly above an exported identifier |
| Python | The docstring |
| Java, JavaScript, TypeScript | `/** ... */` |
| C# | `///` |

The shape on a published item is a summary of one or two lines, then the
sections the language convention already defines, each stating a contract:

| Language | Sections after the summary |
|---|---|
| Rust | `# Errors`, `# Panics`, `# Safety`, `# Examples` |
| Go | Paragraphs of constraints; the `Deprecated:` paragraph |
| Python | `Args`, `Returns`, `Raises`, `Yields` in the project's docstring style |
| Java, JavaScript, TypeScript | `@param`, `@returns`, `@throws`, `@deprecated` |
| C# | `<param>`, `<returns>`, `<exception>` |

Sections grow length by structure. A prose paragraph after the summary is
still prose and meets the four-line question in `SKILL.md`. Every other tenet
applies inside a doc comment: no rationale, no precedent, no history, no body
restated, no internals named, no counts.

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

The billing-pipeline history goes to the PR description. The store-layer
precedent goes with it, and was unverifiable from this file besides.
