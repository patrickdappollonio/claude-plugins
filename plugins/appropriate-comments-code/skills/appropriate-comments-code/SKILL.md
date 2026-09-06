---
name: appropriate-comments-code
description: Use when writing, editing, or reviewing code in any language, and especially before adding or changing a comment or docstring — when tempted to narrate in a comment what was tried first, why an approach was replaced, or what a bug, regression, or review turned up; to restate what the next line already says; to write more than a couple of lines above a declaration, a statement, a log or metric call, or a field you just added; to comment the one new member of a list whose siblings have no comments; to edit or delete a comment inside a test file; when the comments you wrote in any one file add up to half its new code lines or more; or to cite a ticket, finding number, iteration label, wave or task ID, or any other session-scoped identifier; to write a count into a comment ("the 7 tests", "all 13 integration tests", "the three callers", "both fields") of things that live elsewhere and can be added to; or when a comment describes what a feature or endpoint *is* rather than why the line beneath it is built the way it is.
---

# Appropriate Comments in Code

## The Rule

**A comment earns its place by carrying information the code does not, about the
code as it is now, in as few lines as that takes.**

Three ways to fail it, and they are equally fatal:

1. **Restating** the line below it.
2. **Narrating** how the code got here.
3. **Explaining at length** something true and useful — that is documentation,
   and documentation does not live above a function.

The third is the one people miss. A comment can be entirely accurate, entirely
present-tense, free of every ticket number and iteration label, and still be
wrong for the spot it occupies.

## Read the companion file first

On first use in a session, before any other step, read `reviewing-comments.md`
in this skill's directory. It holds the full procedures for verifying what a
comment claims, fixing code before commenting it, reviewing comments in a
diff, and auditing in bulk. The summaries below are reminders of text you have
already read, not a substitute. Re-read it before any review or sweep.

## Overview

A comment describes the code as it is now, for a reader who has none of your
context: someone months from now who was not in this session, did not read the
pull request, and cannot ask you. That reader is **skimming** for one function,
and every line above it is a toll. Twenty accurate lines above a function is a
worse comment than two, because nobody reads twenty.

**The length of a comment tracks the reader's need, never your deliberation.**
The line you argued about for an hour, the field you just added, the log call a
reviewer questioned — each feels like it deserves a paragraph because *you*
thought hard about it. That is not a property of the line.

**Decide the destination before you write.** Anything past two lines has three
homes, and you choose one on purpose:

1. **The file**: the one or two lines a reader of *this line* needs, or the
   decision table, state machine, or one-rule-per-line preconditions tenet 1
   exempts.
2. **A document**: package doc, README, ADR, or API doc, if editing it is in scope.
3. **The handoff**: the PR description, or your final message to the user.

The standing constraint stays in the file. The deliberation that led to it,
the alternatives, and the argument for the change go to the handoff by
default. Tell the user; do not leave it in the file for them to find.

This skill is language-agnostic. Apply it with whatever comment syntax and
documentation convention the project already uses.

## When to Use

- Writing any new function, type, or module
- Editing code that already has comments above or inside it
- Fixing a bug and feeling the urge to explain the fix in place
- Applying review feedback, whether from a human or from an automated reviewer
- Writing doc comments / docstrings for a public API
- Reviewing someone else's diff that adds comments
- **Auditing existing comments** in bulk — read `reviewing-comments.md` first

**When NOT to use:** the user explicitly asked for annotated, tutorial, or
teaching code, where narrating every line *is* the deliverable. Say that you are
setting the skill aside and why.

## Test files are exempt

**By default, existing comments in test files are not rewritten or deleted
under this skill, and bulk audits skip test files entirely.** A test file is whatever the
project treats as one: a test suffix or prefix in the filename, a spec file, or
anything under a tests, testdata, or fixtures directory.

The reason is that the core tenet inverts in a test. A regression test exists
*because* of an incident, so the incident is its subject: the date, what
broke, what was tried, the runbook link, the odd fixture value. That is
specification and history, and a reader uses it to learn what the test protects.
"First delivery" / "same event, redelivered" above two identical-looking calls
is the map that makes the test readable. Deleting any of it is a loss nothing
fails on.

That is the default, and it covers sweeps and incidental edits. Two cases
step outside it:

- **You changed a line in a test.** You still own the comments describing that
  line: a fact your edit made false gets corrected, and the history around it
  stays. Other comments in the file are not opened up by your edit.
- **The user explicitly asked for test comments to be reviewed.** Then review
  them under the relaxed rules below, existing and new alike.

**The relaxed rules for test files.** Two tenets still hold: no session-scoped
identifiers (tenet 5), and the cover test (tenet 3), so no restating the call
or assertion below it. Everything else is off, including every length and
count rule elsewhere in this skill: length and history are allowed when they
explain the test's sequence, fixture, or reason to exist. Apply them
to every comment you write in a test file; to existing comments only when the
user asked for the review, and then to all of them in scope.

If you were asked to sweep a package and it contains test files, say that you
left their comments alone and why; do not silently include them.

## The Six Tenets

### 1. Two lines is the working limit, anywhere

Above a declaration — a function, type, variable, constant, or field — aim for
**one or two lines**. Not as a hard cap, as a forcing function: if you need more,
you are usually writing documentation, and it belongs somewhere a reader can find
it on purpose.

The limit is not scoped to declarations. A comment above a **statement inside a
body** — a call, a branch, a log line, an assignment — is one line, or two when
it states a constraint or invariant, because it interrupts the flow of the
function it sits in. Measure against the statement, not its line count: a call
whose arguments span six lines is still one statement.

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

The long version's content is not worthless. The measurement that chose full
jitter belongs in a commit message or a design note. The reader of this function
needs to know the ceiling is not arbitrary and the jitter is not decorative.

**Where the limit genuinely does not apply:** a comment stating a decision table
or a state machine, where the mapping *is* the contract and prose cannot replace
it, or a set of independent preconditions each of which is a rule. If you claim
this exemption, the comment should be mostly table or mostly rules, one line
each, not prose about them. Never drop a rule to hit the limit; compress the
prose around it.

### 2. Describe the current state, not the path that got you there

The code has one state: the one on disk. A comment that narrates the journey —
what was there before, what failed, what was swapped out — describes something
the reader cannot see and cannot act on. It also rots the instant anyone touches
the code again.

```go
// Bad — narrates the journey
// We used to buffer the whole response here but that blew up memory on
// large payloads, so now we stream it. The earlier attempt with a
// sync.Pool didn't help either.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {

// Good — describes the present, and the constraint that shaped it
// Fetch streams the response body: payloads are unbounded and a buffered read
// can exceed the container memory limit. The caller must Close the reader.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {
```

The good version still carries the *why* — but as a standing constraint that is
true right now, not as a story about a previous edit.

**A regression is documented by a test, not by a comment.** A comment saying
"don't remove this check, it caused a double-charge" is an honour-system
guardrail: nothing fails when someone removes the check. A test does.

```
Bug fixed → write the test that fails without the fix.
            Name the test after the invariant, not the incident:
            TestRefundIsNotAppliedTwice, not TestBugFix1234.
Then write the comment only if the code still needs one after the test exists.
```

### 3. A comment must carry information the code does not

**The cover test:** cover the comment with your hand and read the code. If you
lost nothing, delete the comment.

```python
# Bad
# Opens the DB connection
connection.open()

# Good — a fact the code cannot express
# Postgres closes idle connections after 5 minutes; open() lazily
# reconnects, so callers must not cache the underlying socket.
connection.open()
```

Comments that earn their place say things the code cannot:

| Comment carries | Example |
|---|---|
| A constraint from outside the code | Rate limit, spec clause, protocol requirement, hardware quirk |
| An invariant or precondition | "Callers must hold `mu`." / "`items` is sorted by `id`; binary search depends on it." |
| Units, ranges, encoding, ownership | "Timeout in milliseconds." / "Caller owns and must free the buffer." |
| Why a non-obvious approach is required | "Sequential on purpose: the API rejects concurrent writes to one account." |
| Why wrong-looking code is correct | "`min` not `max`: we want the oldest start, so the age is the worst case." |
| A workaround for an external defect | The upstream issue link, plus what to check to know it can be removed |
| A value that must be kept in step with something else | "Must match the retry ceiling in the deploy manifest." |
| What a caller needs without reading the body | Public API doc comments: behavior, errors, side effects |

**Self-describing statements.** A log call, a metric emit, an error message, an
assertion message, or a panic already carries its prose: the message and its
fields say what it is for. The cover test for these is stricter: cover the
comment and read the *message*. If the message already says it, the comment is
a restatement. First confirm the line should exist at all: a forgotten debug
print gets deleted, not explained. Then the only comment it can earn is one
line about a non-obvious choice in its **shape** (a level that looks wrong, a
field deliberately omitted, a sampling rate, a message that must match an alert
rule) or one line naming a verifiable external requirement that mandates it (a
compliance rule, a spec clause). An argument is neither.

```go
// Bad — defends that the line exists; the message already says what is logged
// The job table only records jobs that finished. A tick that found no work
// leaves no row, and "why did nothing run between 02:00 and 03:00?" needs
// exactly those ticks. Emitting on EVERY tick, not only when a job runs, is
// what makes the gap visible. Do not lower this to Debug.
logger.Info("scheduler tick", "queue", q.Name, "picked", len(jobs))

// Good — one line, about the one choice in the line's shape
// Info, not Debug: empty ticks are the only record that the scheduler was alive.
logger.Info("scheduler tick", "queue", q.Name, "picked", len(jobs))
```

The long version defends the line's **existence**; the short one explains its
**shape**. A comment *arguing* that a line should exist is an argument with an
imagined reviewer, and it goes to the handoff, not the file. Naming the rule
that mandates the line is a citation, not an argument, and it stays.

For a workaround, the durable form points at something that outlives the
session and states its own exit condition:

```js
// Safari <= 17 fires `resize` before viewport metrics settle; drop this once
// Safari 18 is the minimum. https://bugs.webkit.org/show_bug.cgi?id=254340
requestAnimationFrame(measure);
```

### 4. A comment is about its lines, not about the feature they belong to

The cover test asks whether the comment adds information. It does not ask whether
the information is about *these lines*. A comment can add plenty and still be
wrong for the spot, because it describes the product behind the code — what the
feature is, who uses it, what it means to the business — instead of the mechanism
in front of the reader.

**The subject test:** name the thing the comment is about. If it is a route, a
feature, a customer, a policy, or a decision, and the code below is a call, a
wrapper, a branch, or a registration, the comment is on the wrong subject. Ask
instead: *what is non-obvious about how this line is built?* Comment that, or
nothing.

The most valuable answer is usually **why this line differs from its
neighbours**. A route wired differently from the ten around it, a branch that
skips a step every sibling takes, a call with one extra wrapper — those look
like mistakes, and the next reader (or agent) will "fix" them back into line
unless the comment says the difference is deliberate and why.

A comment on a line that differs from its siblings has three parts, in this
order, and nothing else, in **two lines total**. Before writing it, point at the
actual neighbour: the sibling route, branch, or call this one differs from. If
you cannot name one in the file, do not use this form: a comment built on a
counterfactual ("not only on failure", "unlike a naive version") is defending
existence, not shape. The line may still earn a comment under tenet 3 for a
constraint or invariant; it just has no sibling difference to explain.

1. **That the difference is deliberate** — one word or phrase: "Deliberately",
   "On purpose", "Unlike the routes above".
2. **The one mechanical difference** — what this line does that the neighbours
   do not, named in the code's own terms (the wrapper, the label, the skipped step).
3. **What breaks if it is normalized** — the observable consequence of "fixing"
   it to match.

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

Everything the bad version says may be true. It is product documentation, and
it belongs in the API doc or package comment, where a reader asking "what is
cross-asset search" will look. Nobody asks that of a router file. When a
comment is bigger than the code, it is almost always about something other
than the code.

### 5. Never commit an identifier that outlives nothing

Identifiers minted during a working session are meaningless to every reader
except the person who was driving that session, and meaningless to *them* within
a day. The context that gave the ID meaning is gone; the ID stays in the file
forever. None of these belong in a comment:

- **Finding numbers** — `F7`, `R2`, "finding 3", "issue 12 from the audit"
- **Iteration labels** — "pass 2", "round 3", "v2 of this approach", "attempt 2"
- **Wave, batch, or task IDs** — "wave 4", "batch B", "task 17", a plan step number
- **Project phase names** — "in this stage", "until stage 3", "phase 2 will add"
- **Agent or session labels** — run IDs, subagent names, "per the reviewer agent"
- **Checklist positions** — "item 3", "the last bullet", anything that indexes into a document the reader does not have

```go
// Bad — "Review F7" existed for one session and explains nothing
// A failed POST leaves the syncer and force timer armed so the next poll
// retries immediately. Review F7 found this issue after flipping the
// previous test to false.

// Good — the same mechanism, stated as how the code behaves now
// A failed POST leaves the syncer and the force timer armed, so the next
// poll retries immediately rather than waiting for the backoff window.
```

Project phase names deserve their own mention because they look permanent and are
not. "Always X in this stage" becomes a **lie** the moment the next stage ships,
and it is a lie a reader will believe.

**Tracker IDs are a project convention, not a default.** Before writing a JIRA,
Linear, GitHub, or Notion ID into a comment, check whether the project already
does it — grep for the ticket prefix in existing comments. If the convention is
there, match it. If not, ask before introducing one.

### 6. Name the set, not its size

A count in a comment is a tally of something that lives elsewhere. "The 7
tests that cover this", "the 13 other integration tests", "the three callers",
"both fields" — each is true the day it is written and silently falsified by
the next addition, because nothing recomputes it. The reader trusts a wrong
number, or the next editor hunts down every tally a one-line change disturbed.

**The count test:** could someone add one more of the thing, in another file,
without touching this comment? Then the number goes, replaced by what it stood
in for — a name, a location, a pattern, an invariant — which grows with the set.

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

**Where a number belongs:** when it is a *constraint this code enforces or
depends on* — "backs off to a 30s ceiling", "batch size must stay under 50; the
API rejects larger". The value is the point, and it lives here. Even then, the
durable form is a named constant the comment explains, not a literal in prose
beside a literal in code.

| Wrote | Because you meant | Write instead |
|---|---|---|
| "the 7 tests in this file" | the tests here | "the tests in this file" |
| "all 13 integration tests" | a suite with a name | "the `integration`-tagged tests" |
| "the three callers" | callers exist and care | "callers depend on this ordering" |
| "both fields must be set" | a pair that may become three | "every credential field must be set" |
| "the 4 steps below" | a sequence | "the steps below, in order" |
| "retries 5 times" | a limit the code enforces | `maxRetries = 5` with a comment saying why 5 |

A count that is genuinely load-bearing — "must be exactly two, the protocol
sends a pair" — is an invariant, and an invariant is enforced by an assertion
or a test, then commented, not commented alone.

## The ratio check: half comments means it is a document

This check runs **after** the tenets, never instead of them. First write the
change the way this skill says: cover test, subject test, two lines above a
statement, constants named and explained once, deliberation to the handoff.
Then count, **per file**, the lines as they stand after your edit in the
region you added or changed, ignoring blank lines, test files, and functional
directives such as `//go:build` (code for the purpose of never deleting them,
excluded from this count). A **comment line** is a comment marker line, a line
inside a block comment, or a docstring line. A code line with a trailing
comment is a **code line**, and so is everything else. Count the code as the
project's formatter lays it out; never split or join statements, and never
move a comment to the end of a code line, to change the number. Skip the count
when fewer than five counted lines remain. When comment lines still reach
**half of the code lines or more** (one comment line for every two of code),
every comment left has earned its place individually and the region you wrote
is still a document with code in it. A shorter comment is not the fix.

**Stop and ask.** Do not trim to slip under the threshold, and do not quietly
finish. Tell the user the ratio, quote or summarise what the comments say, and
ask whether that material should become a document (name the candidate: the
package doc, a README section, an ADR, the API reference) or go to the PR
description, with one- or two-line pointers left in the code. Wait for the
answer. Only when the workflow cannot ask, or the user delegated the decision,
default to the handoff and the pointers, and say that you did.

A counting example, from the diff of your own change:

```text
added comment lines: 14      added code lines: 20      ratio: 70%  → ask
added comment lines:  4      added code lines: 20      ratio: 20%  → fine
```

Two shapes legitimately run hot and still get the question: a file that is
mostly a decision table or state machine (tenet 1's exemption), and a public
interface whose every method carries a doc comment. Ask anyway; the user may
prefer a reference page, and the question costs one message.

## A new member matches its siblings

When you add one element to a list of peers — a struct field, a class
attribute, an enum variant, an interface property, a config key, a route
registration, a table column, a switch case — the new element adopts the
**comment density and placement its siblings already have**. If the siblings
are bare, the new one is bare. If they carry trailing one-liners, the new one
may carry one, and only if it passes the cover test. If the whole list is
described once above the type, the new member's meaning goes into that
description. Density sets the ceiling and the placement; it never requires a
comment that carries nothing.

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

Readers infer emphasis from asymmetry: the one commented field among twelve
reads as the dangerous one. The block is there because the field is new to
*you*, and "new" stops being true at merge. **The day-one test:** would this
comment exist if the element had been here since the file was created? If not,
it is about your edit, not the code. The same test catches the essay above a
log line you happened to add today.

A real constraint on the new member — a unit, a range, an invariant — still
goes somewhere: into the name first (`TimeoutMillis`, not `Timeout` plus a
comment), then a trailing one-liner if the siblings use them, otherwise the
type's doc comment or the validation that enforces it. A caller must never be
left unable to learn a public field's unit because its siblings are bare.

## Verify, and fix the code first

Full text in `reviewing-comments.md`. The rules that hold without it:

- **Confirm anything a comment names exists**: an identifier (grep it), a path,
  a test, a numeric claim. A comment naming a renamed method is worse than
  silence, because the reader trusts it.
- **A comment is the second-best tool.** `// n is the retry count` is a rename
  request; `// convert to cents` is a helper request. If you cannot say in two
  lines why a block exists, split or rename it rather than writing ten.
- **Copied code links its source; a `TODO` states the gap** in the present
  tense and in the form the repo already uses.
- **Comment the workaround, never the incident**: the external defect, its
  link, its exit condition. The regression itself is pinned by a test.

## When you edit code, you own its comments

When you change a line, you own every comment describing it. A comment that was
accurate before your edit and wrong after it is worse than no comment: it
actively misleads, and readers trust it. Before finishing, re-read the comments
above, inside, and immediately after the lines you touched, and update or delete
each one that no longer matches.

Watch especially for a comment that describes **one** of something when your
change made it **two** — one direction, one caller, one status, one supported
mode. Those read as still-true and are not.

## Reviewing comments, in brief

Read `reviewing-comments.md` before reviewing a diff or auditing in bulk. The
rules that hold without it:

- **Every added or changed comment is a finding until it passes.** Label it
  `restates`, `narrates`, `documents`, `unverified`, `counts`, or `stale`.
- **A flagged comment is rewritten or deleted, never kept as-is** and never
  merely shortened: a trimmed comment on the wrong subject is still on the
  wrong subject. Relocate accurate documentation and say where it went.
- **Report it as a defect** in the same list as code findings, with the label
  and replacement text.
- **In bulk: cut in order of length, skip test files, and never drop a rule
  while compressing.** Do not touch comments outside the change you are making.
  Verify mechanically that no functional directive (`//nolint`, `//go:build`,
  pragmas) and no non-comment line changed.

## Where the context actually belongs

Nothing in this skill says to throw context away. It says to put it where it
stays true and where the right reader will find it.

| Context | Its home |
|---|---|
| A bug that must never come back | A test named after the invariant it protects |
| Why this approach over the one it replaced | The commit message / PR description |
| A finding from a review pass | The review thread on the change |
| Why a line should exist at all, argued against an imagined objection | The PR description, or your final message to the user |
| The history behind a regression test | The test file itself: this is where history is allowed |
| Planned follow-up work | The issue tracker |
| Alternatives considered and rejected | A design doc or ADR |
| How a subsystem fits together | A doc, a package-level comment, or a README |
| A standing constraint this code must respect | A comment — this is the case comments are for |

Note the difference between the last two rows. "This subsystem batches writes
because the API is rate-limited" is orientation: it goes in a package doc, once.
"Batch size must stay under 50; the API rejects larger" is a constraint on *this*
code: it goes above the constant.

## Rationalizations

| Rationalization | Reality |
|---|---|
| "The history explains why I changed it" | The reader sees today's code, not your diff. State the constraint in the present tense, or put the story in the commit message. |
| "A comment warns the next person not to undo the fix" | It warns nobody — nothing checks it. Write the test; it fails when someone undoes the fix. |
| "The finding ID keeps it traceable" | Traceable to a session that no longer exists, by a reader who never saw it. Even the same agent has lost that context by the next run. |
| "It's all true and relevant; detail beats vagueness" | True and relevant is the bar for documentation. The bar for a comment is *and it fits in two lines*, barring tenet 1's exemptions. Detail about process is noise, detail about present constraints is signal, and twenty lines of signal still goes unread. |
| "The comment documents what the function does" | If it restates the name and the body, it documents nothing. Document what the caller cannot see: errors, side effects, preconditions. |
| "It's obvious, but a comment makes it clearer" | If it is obvious from the code, the comment adds a maintenance obligation for zero information. |
| "This code is subtle enough to deserve the space" | Subtle code deserves a *precise* comment, which is usually shorter than a discursive one. If it truly needs paragraphs, it needs a doc — and possibly simpler code. |
| "I'll note the ticket number just in case" | Only if the project already does it. Otherwise ask first. |
| "I'll leave the old approach in a comment in case we need it" | That is what version control is for. Commented-out code and eulogies for deleted code both get deleted. |
| "The comment is slightly stale but still mostly right" | Mostly-right comments are how people get misled with confidence. Fix it or remove it. |
| "I shortened it, so it's better" | Only if every rule survived. A tidy comment missing a precondition is a downgrade. |
| "It explains what this endpoint / feature is" | That is documentation for the feature, filed above a line that is not the feature. Comment the mechanism in the line — usually why it differs from its neighbours — and put the feature description where feature descriptions live. |
| "It's context the reader needs" | The reader of *this line* needs to know why the line is shaped as it is. Context about the product goes in the package doc, once. |
| "A comment will explain what `n` means" | Rename `n`. A comment that names what the code should have been called is a rename request written in the wrong place. |
| "It's too complicated to explain briefly" | Then it is too complicated. Split or rename until two lines suffice; a long comment is a symptom, not a treatment. |
| "I'll just tighten it" | Tightening a comment on the wrong subject produces a shorter comment on the wrong subject. Rewrite it about the line, or delete it. |
| "The count is accurate" / "the number tells the reader how much there is" | Accurate today. Nothing re-checks it when the eighth test lands, and the reader will believe seven. The reader can count; they cannot tell whether your count is current. A name or location lets them see for themselves. |
| "It's a small number, it won't change" | Small sets are the ones that grow. "Both" becomes three more often than "the 40" becomes 41. |
| "The reviewer asked me to make the intent unmistakable" | Unmistakable is two precise lines plus a test, not a paragraph. Put the argument in the PR description; the reviewer reads that. |
| "The log line looks like leftover debugging without an explanation" | First decide whether it is: leftover debugging gets deleted. If it stays, explain the one choice in its shape, in one line. |
| "This field is new, so it needs explaining" | New to you. The reader sees a field among fields. Match the siblings; put a real constraint where it is enforced. |
| "I thought hard about this line, it deserves the space" | How long you deliberated is not a property of the line. Write what a reader needs; tell the user the rest. |
| "It's a test comment, and it narrates history" | Tests are where history lives. Leave existing test comments alone. |
| "The sweep covers the whole package, tests included" | Sweeps skip test files. Say you skipped them. |
| "Every one of these reasons has to sit next to its check" | Write it the skill's way first. If the change is still half comments, it is a document; ask the user whether the reasons go in a doc with pointers left in code. |
| "I'll shorten each comment so the ratio drops under half" | Trimming to pass the count hides the signal. The material is still documentation; ask where it goes. |

## Red flags in your own draft

Any of these means stop and rewrite:

- Reviewing or sweeping comments without having read `reviewing-comments.md`
  this session
- **It is more than two lines, or longer than the code it sits on** (a
  multi-line call is one statement), and none of them states a constraint,
  invariant, or contract; inside a body, more than one line without one
- Past-tense narration: "used to", "previously", "we tried", "was changed to",
  "no longer", "originally", "instead of the old"
- Process references: "per review", "as discussed", "from the audit", "flagged by"
- Project phases: "in this stage", "until stage 3", "for now, phase 1"
- An index into something the reader does not have: "finding 3", "item 3",
  "wave 4", "task 17", "pass 2", a bare ID like `F7` or `R2`
- **A tally of things that live elsewhere:** "the 7 tests", "13 other",
  "three callers", "both", "all four" — anything one more addition would
  falsify without touching this comment
- Restatement: the comment is a prose translation of the identifier below it
- **Wrong subject:** the comment is about the feature, route, policy, or business
  meaning while the code is a call, wrapper, branch, or registration
- **A comment above a log, metric, error, or assert** explains what it is for,
  when the message already says so
- **The comment defends that the line exists** rather than explaining its shape:
  the "neighbour" it differs from is a counterfactual, not a line in the file
- **The element you added is the only commented one among its siblings**
- **You are about to edit or delete a comment in a test file** and neither your
  own edit made it false nor the user asked for a test-comment review
- The comment would not exist if the line had been here from day one
- **Comment lines are still half the code lines or more** in a file after the
  tenets have been applied, and you have neither asked the user where the
  material should live nor, with no user to ask, moved it to the handoff and
  said so
- Emphatic capitals or scare quotes teaching a concept — `TOP-LEVEL`, `"one
  asset's entries"` — a comment that is teaching a concept is a doc
- A named identifier, file, or test **you have not confirmed exists**
- A section banner repeating the name of the thing beneath it
- Commented-out code kept "for reference"
- A comment that names what a variable or block **should be called** — rename it
- A `TODO` with no stated gap, or a TODO in a form the repo does not use
- Copied code with no source link
- An apology or a hedge: "hacky but", "not sure why this works" — if you do not
  know why it works, that is a thing to find out, not to record
- The phrase "for context" or "background:" — that is documentation announcing
  itself

## Before you finish

- [ ] `reviewing-comments.md` was read this session before any review or audit
- [ ] Every comment above a declaration is one or two lines, or states a table,
      a state machine, or independent preconditions one rule per line
- [ ] Every comment describes the code as it is now; none narrates a previous
      attempt, a past bug, or the edit you just made
- [ ] Any regression you fixed is pinned by a test, named after the invariant
- [ ] Every comment survives the cover test — hide it, and the code is genuinely poorer
- [ ] Every comment passes the subject test — it is about the mechanism in the
      lines beneath it (usually why they differ from their neighbours), not the
      feature they implement
- [ ] Inline comments inside bodies are one line, or two when they state a
      constraint or invariant; any comment longer than the code it annotates
      was re-checked against the subject test
- [ ] No comment above a log, metric, error, or assert repeats what the message
      already says, or argues that the line should exist
- [ ] Every element added to a list of peers matches its siblings' comment
      density and placement; no comment fails the day-one test
- [ ] Existing test-file comments were left alone except where an edit of yours
      made a fact false or the user asked for a test-comment review; sweeps
      skipped test files and said so
- [ ] Reasoning that shaped the change went to the PR description or the final
      message to the user, not the file
- [ ] After the pass, the comment-to-code ratio of each file's changed region
      was counted; at half or more, the user was asked whether the material
      belongs in a document, or, with no way to ask, it went to the handoff and
      the final message says so
- [ ] No comment stands in for a rename or a split that would make it unnecessary
- [ ] Copied code links its source; every `TODO` states the gap and matches the
      repo's convention
- [ ] Every comment flagged in review was rewritten or deleted, never kept as-is
- [ ] Every identifier, path, and test name a comment mentions has been confirmed
      to exist
- [ ] No session-scoped identifiers: finding numbers, iteration labels,
      wave/batch/task IDs, project phase names, agent run labels
- [ ] No count of things that live elsewhere (tests, callers, fields, cases,
      steps); every number left is a constraint this code enforces, ideally
      as a named constant
- [ ] Any tracker ID matches a convention already in the repo, or was approved
- [ ] Comments near every line you changed were re-read and are still accurate,
      including any that described **one** of something your change made two
- [ ] Context you removed landed somewhere durable: a test, the commit message,
      the review thread, or the tracker
