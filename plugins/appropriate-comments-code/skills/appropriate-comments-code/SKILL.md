---
name: appropriate-comments-code
description: Use when writing, editing, or reviewing code in any language and about to add, change, or review a comment, docstring, doc comment, or TODO — especially one that narrates history or a past attempt, restates the line below, explains a feature rather than the code, tells a future editor what to do or not do, cites a ticket, finding, task, or wave ID, counts tests, callers, or fields, or sits in a test file.
---

# Appropriate Comments in Code

## The Rule

**A comment earns its place by carrying information the code does not, about the code as it is now, in as few lines as that takes.**

Four ways to fail it, and they are equally fatal:

1. **Restating** the line below it.
2. **Narrating** how the code got here.
3. **Explaining at length** something true and useful — that is documentation, and documentation does not live above a function.
4. **Instructing a future editor** — "never", "always", "keep in step" — with nothing that fails when they ignore it. That is a promise, and a promise is enforced by a test, not by a comment.

The third and fourth are the ones people miss. A comment can be entirely accurate, entirely present-tense, free of every ticket number and iteration label, and still be wrong for the spot it occupies.

## Read the companion files first

On first use in a session, before any other step, read every companion file in this skill's directory. The summaries in this file are reminders of text you have already read, never a substitute.

- `length-and-doc-comments.md` — the full text of tenets 1, 2, 3, 4 and 6 and the sibling rule, with the worked examples: an eight-line "list of rules" and its two-line rewrite; a bulleted "decision table" that fails the row test and the body-match test next to one that passes; an editor-addressed "never do X" block turned into an assertion in the existing test plus one line; a comment that names its own body; the per-language table of what a long comment looks like in that language's own code; the doc-comment syntaxes and section conventions. Re-read it before keeping any comment over two lines, writing a doc comment on a public item, or writing the test behind an editor-addressed comment.
- `ratio-and-ledger.md` — the counting procedure for the ratio check and the format and fields of the long-comment ledger. Re-read it before finishing any change.
- `reviewing-comments.md` — the procedures for verifying what a comment claims, fixing code before commenting it, reviewing comments in a diff, and auditing in bulk. Re-read it before any review or sweep.

## Overview

A comment describes the code as it is now, for a reader who has none of your context: someone months from now who was not in this session, did not read the pull request, and cannot ask you. That reader is **skimming** for one function, and every line above it is a toll. Twenty accurate lines above a function is a worse comment than two, because nobody reads twenty.

**The length of a comment tracks the reader's need, never your deliberation.** The line you argued about for an hour, the field you just added, the log call a reviewer questioned — each feels like it deserves a paragraph because *you* thought hard about it. That is not a property of the line.

**Decide the destination before you write.** Anything past two lines has three homes, and you choose one on purpose:

1. **The file**: the one or two lines a reader of *this line* needs, or the decision table, state machine, or one-rule-per-line list tenet 1 exempts.
2. **A document**: package doc, README, ADR, or API doc, if editing it is in scope. Never CLAUDE.md or AGENTS.md: those instruct agents, and no reader of the code looks there.
3. **The handoff**: your final message to the user. If you are writing a PR description as part of the same task, it can go there too; never edit an existing PR description for a comment pass.

The standing constraint stays in the file. The deliberation that led to it, the alternatives, and the argument for the change go to the handoff by default. Tell the user; do not leave it in the file for them to find.

**A comment is the whole contiguous run of comment lines**, from the first comment line to the line before the next non-comment line, blank comment lines included. A paragraph you add to a block is not a second comment: the block is one comment, its line count is the run's, and it is judged as one. Every comment of three or more lines in your change ends up in the ledger with a verdict, and the verdict is carried out in the file before you finish.

**The language sets the norm, and the norm is short.** Apply the skill with the comment syntax the project uses, and calibrate against what that language's own reference code looks like. Every mainstream language has exactly one long-form shape, and it is the documentation shape: Go's package doc and the doc comment on an exported identifier; Rust's `//!` module docs and `///` with sections; Python's docstring; JSDoc on an export; the header comment in C. Outside that shape, Go and Rust code from the standard library or any widely read project runs to one or two lines per comment, and three is rare. A non-doc comment over three lines in Go or Rust is foreign to the language before any tenet is applied, so in those languages the four-line question is asked at three, and the burden is on the keep.

## When to Use

- Writing any new function, type, or module
- Editing code that already has comments above or inside it
- Fixing a bug and feeling the urge to explain the fix in place
- Applying review feedback, whether from a human or from an automated reviewer
- Writing doc comments / docstrings for a public API
- Reviewing someone else's diff that adds comments
- **Auditing existing comments** in bulk — read `reviewing-comments.md` first

**When NOT to use:** the user explicitly asked for annotated, tutorial, or teaching code, where narrating every line *is* the deliverable. Say that you are setting the skill aside and why.

## Test files are exempt

**By default, existing comments in test files are not rewritten or deleted under this skill, and bulk audits skip test files entirely.** A test file is whatever the project treats as one: a test suffix or prefix in the filename, a spec file, or anything under a tests, testdata, or fixtures directory.

The reason is that the core tenet inverts in a test. A regression test exists *because* of an incident, so the incident is its subject: the date, what broke, what was tried, the runbook link, the odd fixture value. That is specification and history, and a reader uses it to learn what the test protects. "First delivery" / "same event, redelivered" above two identical-looking calls is the map that makes the test readable. Deleting any of it is a loss nothing fails on. It is also why the reasoning behind an editor-addressed rule goes above the assertion that enforces it: the test file is where it is allowed.

That is the default, and it covers sweeps and incidental edits. Two cases step outside it:

- **You changed a line in a test.** You still own the comments describing that line: a fact your edit made false gets corrected, and the history around it stays. Other comments in the file are not opened up by your edit.
- **The user explicitly asked for test comments to be reviewed.** Then review them under the relaxed rules below, existing and new alike.

**The relaxed rules for test files.** Two tenets still hold: no session-scoped identifiers (tenet 5), and the cover test (tenet 3), so no restating the call or assertion below it. Everything else is off, including every length and count rule elsewhere in this skill: length and history are allowed when they explain the test's sequence, fixture, or reason to exist. Apply them to every comment you write in a test file; to existing comments only when the user asked for the review, and then to all of them in scope.

If you were asked to sweep a package and it contains test files, say that you left their comments alone and why; do not silently include them.

## The Seven Tenets

Full text of each in `length-and-doc-comments.md`. The rules that hold without it:

### 1. Two lines is the working limit, anywhere

Above a declaration, one or two lines. Above a statement inside a body, one line, or two when it states a constraint or invariant; measure against the statement, not its line count. More than that is documentation and belongs where a reader finds it on purpose.

**The one exemption** is a decision table, a state machine, or a one-rule-per-line list, and bullets do not grant it. It is earned by two tests run on every row before it is claimed, with both counts in the ledger: the **row test** (a row is a condition and its outcome, then it ends; a dash, a "because", a second sentence after the outcome is a gloss, and one glossed row makes the block prose) and the **body-match test** (a row whose condition and outcome both sit in the body below is the body restated; a table whose every row matches is deleted whatever its shape, and each unmatched row is named with the schema, config, or function that carries it).

**A rule is a caller obligation or a guarantee**: a lock to take, an ordering to keep, what a return means on error. Rationale, precedent, a comparison with no neighbour in the file, the body restated, the signature restated, and adjectives are not rules; cut them first, and cutting them drops nothing. Rules that share a principle compress into the principle, stated once. Never drop a rule to hit the limit.

**A prose comment still over four lines is a question, not a keep** (three in Go and Rust): show the user the comment and a candidate home, leave one or two lines in the code, or move it to the handoff when nobody can be asked.

**Doc comments on public items are documentation**: a one- or two-line summary, then the sections the language convention defines (Errors, Panics, Args, Returns, Deprecated), each stating a contract. Prose past the summary is still prose under the four-line question, and every other tenet applies inside. **The marker is not the exemption; the audience is**: `///` on a private function, a docstring on a private helper, a Go comment above an unexported identifier is a plain comment under the two-line limit. The test is whether the project's documentation generator publishes the item.

### 2. Describe the current state, not the path that got you there

The code has one state: the one on disk. A comment that narrates the journey describes something the reader cannot see and cannot act on, and rots the instant anyone touches the code again.

```go
// Bad — narrates the journey
// We used to buffer the whole response here but that blew up memory on
// large payloads, so now we stream it.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {

// Good — the present, and the constraint that shaped it
// Fetch streams the response body: payloads are unbounded and a buffered read
// can exceed the container memory limit. The caller must Close the reader.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {
```

**A regression is documented by a test, not by a comment.** "Don't remove this check, it caused a double-charge" is an honour-system guardrail. Write the test that fails without the fix, named after the invariant, not the incident: `TestRefundIsNotAppliedTwice`, not `TestBugFix1234`.

**A comment enforces nothing: the editor test.** Ask who the comment is addressed to. A **caller** obligation ("callers must hold mu", a unit, who owns the buffer) stays. An instruction to a **future editor** ("never send X", "always go through Y", "do not lower this to Debug", "keep both", "keep in step with Z", "needs review before changing") is a promise nothing checks, at ten lines or at two, present-tense or not, incident or none, and rewording it as a fact changes the sentence, not who can break the rule. The verdict is written in this pass, never noted as a follow-up:

1. **A check that fails**: a test assertion, a type, a validation, a lint.
2. **In the test that already runs the code.** List the setup and action steps the assertion needs (assertions are not steps, and a different argument to the same call is the same step). If an existing test on the same function performs 60% or more of them, the assertion goes there, whatever its name and however different its "subject" feels. A new test function only when no existing test performs the steps, named after the invariant, with the count in the ledger.
3. **The why above the assertion** in the test file, or in the package doc or ADR. Never in the code.
4. **One line of fact in the code**: "the portal never receives the SSN", not "never add the SSN to CustomerView".

A **process** ("needs privacy sign-off") cannot be tested and goes to CONTRIBUTING, CODEOWNERS, or a PR template; the comment drops it. A **value kept in step** with something else is enforced by sharing the value or by a test that reads both; only when neither is possible does one line name the other place, and the ledger says the coupling is unenforced.

### 3. A comment must carry information the code does not

**The cover test:** cover the comment with your hand and read the code. If you lost nothing, delete the comment.

```python
# Bad
# Opens the DB connection
connection.open()

# Good — a fact the code cannot express
# Postgres closes idle connections after 5 minutes; open() lazily
# reconnects, so callers must not cache the underlying socket.
connection.open()
```

| Comment carries | Example |
|---|---|
| A constraint from outside the code, stated as a fact in one line | Rate limit, spec clause, protocol requirement, hardware quirk. If an editor could break it and nothing would fail, tenet 2's editor test applies first |
| An invariant or precondition | "Callers must hold `mu`." / "`items` is sorted by `id`; binary search depends on it." |
| Units, ranges, encoding, ownership | "Timeout in milliseconds." / "Caller owns and must free the buffer." |
| Why a non-obvious approach is required | "Sequential on purpose: the API rejects concurrent writes to one account." |
| Why wrong-looking code is correct | "`min` not `max`: we want the oldest start, so the age is the worst case." |
| A workaround for an external defect | The upstream issue link, plus what to check to know it can be removed |
| A value that must be kept in step with something else | Only after sharing the value or testing both was ruled out; the comment is the fallback, not the enforcement |
| What a caller needs without reading the body | Public API doc comments: behavior, errors, side effects |

**Self-describing statements.** A log call, metric, error message, assertion message, or panic already carries its prose. Cover the comment and read the *message*: if the message says it, the comment restates. First confirm the line should exist (a forgotten debug print is deleted, not explained); then the only comment it can earn is one line about a non-obvious choice in its **shape** (a level that looks wrong, a field omitted, a sampling rate) or one line naming the external requirement that mandates it. A comment *arguing* that the line should exist goes to the handoff. "Do not lower this to Debug" is an editor instruction: the level is asserted in the test that runs the line, and "Info, not Debug: empty ticks are the only record the scheduler was alive" is what stays.

**A workaround** points at something that outlives the session and states its own exit condition: the upstream link and "drop once Safari 18 is the minimum".

### 4. A comment is about its lines, not about the feature they belong to

**The subject test:** name the thing the comment is about. If it is a route, a feature, a customer, a policy, or a decision, and the code below is a call, a wrapper, a branch, or a registration, the comment is on the wrong subject. Ask instead: *what is non-obvious about how this line is built?* Comment that, or nothing.

The most valuable answer is usually **why this line differs from its neighbours**, because the next reader will "fix" the difference back into line. That comment has three parts, in **two lines total**: that the difference is deliberate; the one mechanical difference, in the code's own terms; what breaks if it is normalized. Point at the actual neighbour in the file before writing it; a counterfactual ("unlike a naive version") is defending existence, not shape, and does not earn this form.

```go
// Deliberately its own With chain: this route reports under its own handler
// label, not the router's shared one, or its metrics merge with the asset endpoints.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)
```

When a comment is bigger than the code, it is almost always about something other than the code.

### 5. Never commit an identifier that outlives nothing

Identifiers minted during a working session are meaningless to every reader except the person who was driving that session, and meaningless to *them* within a day. None of these belong in a comment: finding numbers (`F7`, "finding 3"), iteration labels ("pass 2", "v2 of this approach"), wave, batch, or task IDs, plan step numbers, project phase names ("in this stage", "until stage 3"), agent or run labels, checklist positions ("item 3").

```go
// Bad — "Review F7" existed for one session and explains nothing
// A failed POST leaves the syncer and force timer armed so the next poll
// retries immediately. Review F7 found this issue after flipping the
// previous test to false.

// Good — the same mechanism, stated as how the code behaves now
// A failed POST leaves the syncer and the force timer armed, so the next
// poll retries immediately rather than waiting for the backoff window.
```

Project phase names look permanent and are not: "always X in this stage" becomes a lie the moment the next stage ships. **Tracker IDs are a project convention, not a default**: grep for the ticket prefix in existing comments; match the convention if it is there, ask before introducing one if not.

### 6. Name the set, not its size

A count in a comment is a tally of something that lives elsewhere: "the 7 tests", "the 13 other integration tests", "the three callers", "both fields". True the day it is written and silently falsified by the next addition, because nothing recomputes it. **The count test:** could someone add one more of the thing, in another file, without touching this comment? Then the number goes, replaced by what it stood in for — a name, a location, a pattern, an invariant — which grows with the set: "the tests in this file", "the `integration`-tagged tests", "every credential field".

**Where a number belongs:** when it is a constraint this code enforces or depends on ("batch size must stay under 50; the API rejects larger"), and then as a named constant the comment explains, not a literal in prose beside a literal in code. A load-bearing count ("exactly two, the protocol sends a pair") is an invariant, enforced by an assertion or a test, then commented.

### 7. Name nothing the body already uses

Every identifier in a comment is a coupling nothing checks: rename the field or helper and the comment stays, confidently wrong. **The visibility test:** for each identifier the comment names other than its own subject, does the body below use it? If it does, that part is the body restated. Say it in words ("the recheck budget", not `s.recheckBudget`) or drop it. Name only what the reader cannot see below: the lock a caller must hold, the neighbour a tenet 4 comment differs from, a constraint in another file, an external system.

## The ratio check, in brief

Full procedure in `ratio-and-ledger.md`. After the tenets, count per file, in the region you added or changed, comment lines against code lines, ignoring blanks, test files, and directives; skip when fewer than five lines remain. At **half or more**, the region is a document with code in it, and a shorter comment is not the fix: **stop and ask** the user where the material goes (package doc, README, ADR, API reference, PR description), leaving one- or two-line pointers. Only when nobody can be asked, default to the handoff and say so. A table lifts the two-line limit and never the ratio question.

## The long-comment ledger, in brief

Format and fields in `ratio-and-ledger.md`. Before finishing, list every comment of three or more lines in the changed region, as whole contiguous runs including the ones you only appended to, one line each: location, line count, shape, both counts for any list or table, and the verdict (kept, rewritten to N lines, deleted, sent to the user with a candidate home, or "enforced by" naming the test the assertion went into). It goes in the final message only, never in a PR description or commit message; when nothing is over two lines, it is the one line "no comment over two lines in the change".

**The verdict is an action.** "Deleted" with the lines still in place, "enforced by" with the assertion left as a follow-up, or "send to the user" with the block still in the file is a failed pass, whatever the task's wording asked you to add. **The pass never waits on a pending decision**: a comment whose fate hangs on a product call or a review that has not happened leaves the file now, and the question goes to the handoff.

## A new member matches its siblings

When you add one element to a list of peers (a field, an enum variant, a config key, a route, a switch case), it adopts the comment density and placement its siblings already have. Bare siblings, bare member; trailing one-liners, one trailing line if it passes the cover test; one description above the type, the new meaning goes there. Readers infer emphasis from asymmetry: the one commented field among twelve reads as the dangerous one. **The day-one test:** would this comment exist if the element had been here since the file was created? A real constraint on the new member goes into the name first (`TimeoutMillis`), then where it is enforced. Example in `length-and-doc-comments.md`.

## Verify, and fix the code first

Full text in `reviewing-comments.md`. The rules that hold without it:

- **Confirm anything a comment names exists**: an identifier (grep it), a path, a test, a numeric claim. A comment naming a renamed method is worse than silence, because the reader trusts it.
- **A comment is the second-best tool.** `// n is the retry count` is a rename request; `// convert to cents` is a helper request. If you cannot say in two lines why a block exists, split or rename it rather than writing ten.
- **Copied code links its source; a `TODO` states the gap** in the present tense and in the form the repo already uses.
- **Comment the workaround, never the incident**: the external defect, its link, its exit condition. The regression itself is pinned by a test.

## When you edit code, you own its comments

When you change a line, you own every comment describing it. Before finishing, re-read the comments above, inside, and immediately after the lines you touched, and update or delete each one that no longer matches. Watch especially for a comment that describes **one** of something when your change made it **two**. Adding to a comment is editing it: the whole run is yours, it goes in the ledger as one entry, and it is measured as a whole.

## Reviewing comments, in brief

Read `reviewing-comments.md` before reviewing a diff or auditing in bulk. The rules that hold without it:

- **Every added or changed comment is a finding until it passes.** Label it `restates`, `narrates`, `documents`, `enforces`, `unverified`, `counts`, or `stale`.
- **A flagged comment is rewritten or deleted, never kept as-is** and never merely shortened. An `enforces` finding is closed by the assertion, not by a shorter promise. Relocate accurate documentation and say where it went.
- **Report it as a defect** in the same list as code findings.
- **In bulk: cut in order of length, skip test files, never drop a rule while compressing, and do not touch comments outside the change.** Verify mechanically that no directive and no non-comment line outside a test file changed.

## Where the context actually belongs

| Context | Its home |
|---|---|
| A bug that must never come back | A test named after the invariant it protects |
| What the code must never do, send, log, or expose | An assertion in the test that already runs the code; one line of fact in the code |
| Why that rule exists | A comment above the assertion in the test, or the ADR or package doc |
| A step an editor must take before changing something (a review, a sign-off) | CONTRIBUTING, CODEOWNERS, a PR template; never a comment |
| Why this approach over the one it replaced | The commit message / PR description |
| A finding from a review pass | The review thread on the change |
| Why a line should exist at all, argued against an imagined objection | The PR description, or your final message to the user |
| The history behind a regression test | The test file itself: this is where history is allowed |
| Planned follow-up work | The issue tracker |
| Alternatives considered and rejected | A design doc or ADR |
| How a subsystem fits together | A doc, a package-level comment, or a README |
| A standing constraint this code must respect | A comment — this is the case comments are for |

"This subsystem batches writes because the API is rate-limited" is orientation and goes in a package doc, once. "Batch size must stay under 50; the API rejects larger" is a constraint on *this* code and goes above the constant. CLAUDE.md and AGENTS.md are never the home: they instruct agents, and no reader of the code opens them.

## Rationalizations

| Rationalization | Reality |
|---|---|
| "The history explains why I changed it" | The reader sees today's code, not your diff. State the constraint in the present tense, or put the story in the commit message. |
| "A comment warns the next person not to undo the fix" | It warns nobody — nothing checks it. Write the test; it fails when someone undoes the fix. |
| "It explains what we withhold and why, and that is a real constraint" | It explains it to whoever reads it and stops nobody. The constraint is an assertion in the existing test; the why goes above that assertion; the code keeps one line of fact. |
| "No bug was fixed here, so the test rule does not trigger" | The trigger is the audience, not an incident. A comment addressed to a future editor is unenforced today; the assertion is written now. |
| "Writing a test is scope creep; the task was the comment pass" / "I'll flag the test as a follow-up" | The assertion is the verdict on that comment, the way "deleted" is a verdict. A comment pass that leaves the promise in place and a note in the report has not run. |
| "It asserts a different invariant, so it reads better as its own test function" | Same setup, same call, one more assertion. Count the steps: at 60% shared it goes into the existing test, whatever its name. Two tests that build the same fixture and call the same function are one test written twice. |
| "The existing test builds a different fixture, so the setup is different" | A different value is not a different step. Build the scheduler, call Tick: those are the steps, and they are shared whether the job list is empty, three, or one that errors. Add the case to the existing test. |
| "It's a distinct unit with no existing test to extend" | Then say so in the ledger with the count, and name the new test after the invariant. Check the function the assertion needs, not the feature: the builder the handler calls usually has a test already. |
| "It's a forward-looking gate, not history, so tenet 2 does not apply" | A gate nothing closes is a comment. A process step goes to CONTRIBUTING or a PR template; a code rule goes to a test. |
| "I reworded it as a fact, so it is no longer addressed to an editor" | Rewording changes the audience of the sentence, not who can break the rule. If an editor could change the level, the field, or the value and nothing fails, the assertion is still owed. |
| "Two lines is short enough for a 'never do X'" | Length was never the problem with a promise. The line that stays is a fact about the code, and the test is what says never. |
| "If they decide the other way these need deleting, not shortening, so I'll wait" | Either outcome removes the lines. Carry out the verdict now and put the open question in the handoff; waiting ships the comment. |
| "The finding ID keeps it traceable" | Traceable to a session that no longer exists, by a reader who never saw it. |
| "It's all true and relevant; detail beats vagueness" | True and relevant is the bar for documentation. The bar for a comment is *and it fits in two lines*, barring tenet 1's exemptions. Twenty lines of signal still goes unread. |
| "The comment documents what the function does" | If it restates the name and the body, it documents nothing. Document what the caller cannot see: errors, side effects, preconditions. |
| "This code is subtle enough to deserve the space" | Subtle code deserves a *precise* comment, which is usually shorter. If it truly needs paragraphs, it needs a doc — and possibly simpler code. |
| "I'll note the ticket number just in case" | Only if the project already does it. Otherwise ask first. |
| "I'll leave the old approach in a comment in case we need it" | That is what version control is for. Commented-out code and eulogies for deleted code both get deleted. |
| "The comment is slightly stale but still mostly right" | Mostly-right comments are how people get misled with confidence. Fix it or remove it. |
| "I shortened it, so it's better" / "I'll just tighten it" | Only if every rule survived, and only if the subject was right. A tidy comment missing a precondition is a downgrade; a shorter comment on the wrong subject is still on the wrong subject. |
| "It explains what this endpoint / feature is" / "it's context the reader needs" | Documentation for the feature, filed above a line that is not the feature. Comment the mechanism in the line; put the feature description in the package doc, once. |
| "A comment will explain what `n` means" / "it's too complicated to explain briefly" | Rename `n`. Split or rename until two lines suffice; a long comment is a symptom, not a treatment. |
| "The count is accurate" / "it's a small number, it won't change" | Accurate today; nothing re-checks it when the eighth test lands. Small sets are the ones that grow: "both" becomes three more often than 40 becomes 41. Name the set. |
| "The reviewer asked me to make the intent unmistakable" | Unmistakable is two precise lines plus a test, not a paragraph. Put the argument in the PR description. |
| "The log line looks like leftover debugging without an explanation" | First decide whether it is: leftover debugging gets deleted. If it stays, explain the one choice in its shape, in one line. |
| "This field is new, so it needs explaining" / "I thought hard about this line" | New to you. The reader sees a field among fields. Match the siblings; put a real constraint where it is enforced. How long you deliberated is not a property of the line. |
| "It's a test comment, and it narrates history" / "the sweep covers tests too" | Tests are where history lives. Leave existing test comments alone; sweeps skip test files and say so. |
| "Every one of these reasons has to sit next to its check" / "I'll shorten each so the ratio drops" | Write it the skill's way first. If the change is still half comments, it is a document; ask where the reasons go. Trimming to pass the count hides the signal. |
| "It has bullets, so it is a decision table" / "the rows are clean now" | Bullets are markup. Run the row test and the body-match test and put both counts in the ledger; clean rows that the body carries one by one are the body restated, and the table goes. |
| "One row is only partially in the body, so the table earns the exemption" | Partially is matched. Name the schema, config, or other function that carries the row instead; if there is none, the count is full. |
| "The table was already there; I only added the paragraph" / "the user asked me to add a note, not rewrite" | You touched the comment, so all of it is yours and all of it is in the ledger. The ask sets what you add; the skill sets what the comment you touched may keep. |
| "I ran the tests and reported the verdict; the rewrite is the user's call" | The verdict describes the file you leave behind. Delete, or move the material to the handoff with the question; either way the lines go. |
| "Each sentence is a separate rule the caller depends on" / "never drop a rule, so it stays this long" | Most are reasons, precedents, or the body restated. Underline the caller obligations; what is left is the comment. The rule against dropping protects obligations, not prose. |
| "It can go in CLAUDE.md" | CLAUDE.md instructs agents; a reader of the code never looks there. Package doc, API doc, README, or ADR. |
| "It's a doc comment, so the length rules don't apply" | Only on an item the doc generator publishes, and only as a summary plus sections. Three slashes on a private function is a comment. |

## Red flags in your own draft

Any of these means stop and rewrite:

- Reviewing, sweeping, keeping a comment over two lines, writing a public doc comment, or writing the test behind an editor-addressed comment without having read the matching companion file this session
- **An imperative addressed to a future editor** — "never", "always", "do not", "must not", "keep both", "keep in step", "needs sign-off before" — with no test, type, validation, or lint that fails when it is ignored
- **A ledger verdict of "rewritten to 2 lines" on a comment that still tells an editor what to do** — the audience did not change, so nothing did
- **A new test function that builds the same fixture and calls the same function as an existing test** — the assertion belonged in that test
- **A test noted as a follow-up**, or a verdict held until a pending decision
- **More than two lines, or longer than the code it sits on**, and none of them states a constraint, invariant, or contract; **over three lines in Go or Rust** outside a doc comment
- **Prose over four lines that you are calling "rules"**; a bulleted or tabular comment kept without its row, glossed, and body-match counts; a row with a dash or a "because" after its outcome; every row matched by an `if` and a return below; an "unmatched" row with no schema, config, or function named for it
- **"Kept unchanged" or "existing" about a comment you appended to**, or your note in the ledger on its own with the block above it missing
- **A ledger verdict the file does not show**, however the task was worded
- **A ratio at half or more** excused because the comment is a table, or neither asked about nor moved to the handoff
- **It names a field the body reads or a helper the body calls**
- **A doc-comment marker on a private item is your reason for the length**; a public doc comment carrying prose paragraphs instead of sections
- Past tense or process: "used to", "previously", "we tried", "no longer", "originally", "per review", "as discussed", "from the audit", "flagged by"
- Phases and indexes: "in this stage", "until stage 3", "finding 3", "item 3", "wave 4", "task 17", "pass 2", a bare ID like `F7`
- **A tally of things that live elsewhere:** "the 7 tests", "13 other", "three callers", "both", "all four"
- Restatement: a prose translation of the identifier below it
- **Wrong subject:** about the feature, route, policy, or business meaning while the code is a call, wrapper, branch, or registration; the "neighbour" it differs from is a counterfactual, not a line in the file
- **A comment above a log, metric, error, or assert** that repeats the message or argues that the line should exist
- **The element you added is the only commented one among its siblings**; the comment would not exist if the line had been here from day one
- **About to edit or delete a comment in a test file** when neither your edit made it false nor the user asked for a test-comment review
- Emphatic capitals or scare quotes teaching a concept; "for context" or "background:"; a section banner repeating the name beneath it
- A named identifier, file, or test **you have not confirmed exists**
- Commented-out code kept "for reference"; a comment naming what a variable or block **should be called**; a `TODO` with no stated gap or in a form the repo does not use; copied code with no source link
- An apology or a hedge: "hacky but", "not sure why this works"

## Before you finish

- [ ] Every companion file was read this session before its step: `reviewing-comments.md` before any review or audit, `length-and-doc-comments.md` before keeping a comment over two lines, writing a public doc comment, or writing an enforcing test, `ratio-and-ledger.md` before finishing
- [ ] Every comment above a declaration is one or two lines, or is a table, state machine, or one-rule-per-line list that passed the row test and the body-match test with both counts in the ledger; a public doc comment is a two-line summary plus convention sections; a doc marker on a private item earned nothing
- [ ] No prose comment over four lines (three in Go or Rust) was kept under an exemption claim; each was shown to the user with a candidate home, or moved to the handoff and said so
- [ ] Every comment addressed to a future editor is now an assertion in the test that already runs the code (a new test only when no existing test performs the steps, with the count), or a type, validation, or lint; the why sits above the assertion; one line of fact stays in the code; the ledger says "enforced by" and names it; a process step went to CONTRIBUTING or a PR template
- [ ] No new test function was written where an existing test on the same function already performed 60% or more of its setup and action steps
- [ ] The long-comment ledger is in the final message, listing whole contiguous runs including the ones you only appended to, or the one line "no comment over two lines in the change"; every verdict matches the file; nothing was deferred to a pending decision or left as a follow-up
- [ ] Every comment survives the cover test and the subject test, describes the code as it is now, names no field or helper from its own body, and cites nothing session-scoped
- [ ] No comment above a log, metric, error, or assert repeats the message or argues that the line should exist; any regression you fixed is pinned by a test named after the invariant
- [ ] No count of things that live elsewhere; every number left is a constraint this code enforces, ideally as a named constant
- [ ] Every element added to a list of peers matches its siblings' comment density and placement
- [ ] Existing test-file comments were left alone except where an edit of yours made a fact false or the user asked; sweeps skipped test files and said so
- [ ] The comment-to-code ratio of each changed region was counted after the pass; at half or more the user was asked, or the handoff carries it
- [ ] No comment stands in for a rename or a split; copied code links its source; every `TODO` states the gap in the repo's form; any tracker ID matches a convention already in the repo
- [ ] Every identifier, path, and test a comment mentions was confirmed to exist; comments near every line you changed were re-read, including any that described **one** of something your change made two
- [ ] Every comment flagged in review was rewritten or deleted, never kept as-is; reasoning that shaped the change went to the final message; context you removed landed somewhere durable
- [ ] The ledger is in the final message only; no PR description was edited for the comment pass
