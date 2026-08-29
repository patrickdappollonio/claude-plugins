---
name: appropriate-comments-code
description: Use when writing, editing, or reviewing code in any language, and especially before adding or changing a comment or docstring — when tempted to narrate in a comment what was tried first, why an approach was replaced, or what a bug, regression, or review turned up; to restate what the next line already says; to write more than a couple of lines above a declaration; or to cite a ticket, finding number, iteration label, wave or task ID, or any other session-scoped identifier; or when a comment describes what a feature or endpoint *is* rather than why the line beneath it is built the way it is.
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

## Overview

A comment describes the code as it is now, for a reader who has none of your
context: someone months from now who was not in this session, did not read the
pull request, does not know what you tried first, and cannot ask you.

That reader is also **skimming**. They are looking for one function, and every
line above it is a toll they pay to reach it. A comment's cost is not just being
wrong later — it is the attention it takes now. Twenty accurate lines above a
function is a worse comment than two, because nobody reads twenty.

This skill is language-agnostic. Apply it with whatever comment syntax and
documentation convention the project already uses.

## When to Use

- Writing any new function, type, module, or test
- Editing code that already has comments above or inside it
- Fixing a bug and feeling the urge to explain the fix in place
- Applying review feedback, whether from a human or from an automated reviewer
- Writing doc comments / docstrings for a public API
- Reviewing someone else's diff that adds comments
- **Auditing existing comments** in bulk — see *Doing this at scale*

**When NOT to use:** the user explicitly asked for annotated, tutorial, or
teaching code, where narrating every line *is* the deliverable. Say that you are
setting the skill aside and why.

## The Five Tenets

### 1. Two lines is the working limit

Above a declaration — a function, type, variable, constant, or field — aim for
**one or two lines**. Not as a hard cap, as a forcing function: if you need more,
you are usually writing documentation, and it belongs somewhere a reader can find
it on purpose.

```go
// Bad — accurate, present-tense, breaks no other rule, and nobody reads it
// Retry uses exponential backoff starting at 100ms and doubling each attempt up
// to a ceiling of 30 seconds. The ceiling exists because the upstream service's
// own timeout is 30 seconds, so waiting longer than that between attempts means
// the request would have been abandoned by the caller before we retried anyway.
// Jitter is applied as a random factor between 0.5 and 1.5 of the computed
// delay, which prevents the thundering-herd problem when many workers fail at
// the same moment — for example when the upstream restarts and every in-flight
// request fails simultaneously. We chose full jitter over equal jitter after
// measuring both under load.
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
it. If you claim this exemption, the comment should be mostly table, not mostly
prose about the table.

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

For a workaround, the durable form points at something that outlives the
session and states its own exit condition:

```js
// Safari <= 17 fires `resize` before the viewport metrics settle, so read
// them on the next frame. See https://bugs.webkit.org/show_bug.cgi?id=254340
// — drop this once the minimum supported Safari is 18.
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
order, and nothing else:

1. **That the difference is deliberate** — one word or phrase: "Deliberately",
   "On purpose", "Unlike the routes above".
2. **The one mechanical difference** — what this line does that the neighbours
   do not, named in the code's own terms (the wrapper, the label, the skipped step).
3. **What breaks if it is normalized** — the observable consequence of "fixing"
   it to match.

```go
// Bad — five lines about what the feature is and who may call it. The one
// fact that matters — this route is deliberately wired unlike the others —
// is buried in the last clause, and a skimmer never reaches it.
// The cross-asset search is TOP-LEVEL: it is not "one asset's entries" but
// "where does this wallet (or customer, or asset) appear". It shares the
// surface's dual-credential auth — a key caller is scope-filtered, a token
// sees every customer — and carries its own handler label for the same
// reason every other route here does.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)

// Good — says the line is intentionally different, and what would break
// Deliberately its own With chain: this route reports under the onboarding
// handler label, not the shared label the rest of this router uses. Folding
// it into the group would lump its metrics in with the asset endpoints.
r.With(metrics.WithHandler(metrics.HandlerOnboardingSearch)).
	Get("/onboardings", h.SearchOnboardings)
```

Everything the bad version says may be true and worth writing down. It is
product documentation: it belongs in the API doc, the package comment, or the
PR — where a reader looking for "what is cross-asset search" will look. Nobody
looking for that reads a router file, and nobody reading a router file is
asking it.

A reliable tell is **ratio**: a five-line comment on a two-line registration, a
paragraph above a one-line call. When the comment is bigger than the code, it is
almost always about something other than the code.

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

The rewrite keeps every fact a future reader can use and drops the two things
only the original session understood: which review found it, and which test was
flipped.

Project phase names deserve their own mention because they look permanent and are
not. "Always X in this stage" becomes a **lie** the moment the next stage ships,
and it is a lie a reader will believe.

**Tracker IDs are a project convention, not a default.** Before writing a JIRA,
Linear, GitHub, or Notion ID into a comment, check whether the project already
does it — grep for the ticket prefix in existing comments. If the convention is
there, match it. If not, ask before introducing one.

## Verify what the comment claims

A comment can be confidently, fluently wrong. Before you write or keep one that
names something, confirm the something exists:

- **An identifier** — a function, method, type, constant, table, index, env var.
  Grep for it. A comment naming a method that was renamed, or never existed, is
  worse than silence: the reader trusts it and goes looking.
- **A file or document path** — does it still resolve?
- **A test** — a comment saying "pinned by TestFoo" is an assertion about the
  suite. If `TestFoo` is gone, the comment now promises a guarantee nobody has.
- **A numeric claim** — "the ceiling is four attempts" is checkable. Check it.

This is not paranoia; it is the failure mode long comments have. Nobody reads
twenty lines closely enough to notice that one names a function that does not
exist. Length and inaccuracy are the same problem wearing two hats.

## Fix the code before you comment it

A comment is the second-best tool for making code clear. Reach for the first
one — a name, a smaller function, a constant — before writing prose.

- **A comment does not excuse unclear code.** `// n is the retry count` above
  `n := 3` is a request to rename `n` to `retryCount`. `// convert to cents`
  above `x * 100` is a request for a `toCents` helper or a named constant. If
  the comment names what the code should have been called, rename instead.
- **If you cannot write a clear comment, the code is the problem.** When you
  cannot say in two lines why a block exists or what it guarantees, that is not
  a reason to write ten lines — it is a sign the block needs splitting, renaming,
  or rethinking. Fix that, then see whether a comment is still needed.
- **A cryptic comment is worse than none.** "Magic, do not touch", "you are not
  expected to understand this", a bare `// XXX` — these announce confusion
  without dispelling it. Either state the actual invariant or delete the note.

Two comment kinds the article-style advice gets right and this skill endorses,
with the conventions that keep them from rotting:

- **Copied code links its source.** Code lifted from a Stack Overflow answer, a
  blog post, or another repository carries a one-line comment with the URL.
  Readers can reach the original context, licence, and later corrections; you
  cannot reproduce those in prose.
- **Incomplete work is marked, not implied.** A known gap gets a `TODO` in the
  form the project already uses (grep for `TODO` / `FIXME` first — some repos
  require a tracker link, some an owner). State *what* is missing in the
  present tense: `// TODO: handle 429 by honouring Retry-After`, never
  `// TODO: fix later` or `// TODO from review`.

**Bug fixes and tenet 2, reconciled.** Conventional advice says "add a comment
when you fix a bug". This skill says the same thing narrowly: comment the
*workaround* — the external defect, its link, and its exit condition — because
that is a standing constraint. Do not comment the *incident*: what broke, who
found it, what you tried. The regression itself is pinned by a test.

## When you edit code, you own its comments

When you change a line, you own every comment describing it. A comment that was
accurate before your edit and wrong after it is worse than no comment: it
actively misleads, and readers trust it. Before finishing, re-read the comments
above, inside, and immediately after the lines you touched, and update or delete
each one that no longer matches.

Watch especially for a comment that describes **one** of something when your
change made it **two** — one direction, one caller, one status, one supported
mode. Those read as still-true and are not.

## Reviewing comments: flag, rewrite, or delete

When reviewing a diff — yours or another agent's — treat every added or changed
comment as a finding until it passes. For each one:

1. **Classify** it with one label: `restates` (fails the cover test), `narrates`
   (past tense, journey, process), `documents` (true, but too long or about the
   feature rather than the line), `unverified` (names something you have not
   confirmed), `stale` (no longer matches the code beside it).
2. **Rewrite or delete — never keep as-is.** A flagged comment has exactly two
   exits. Rewrite when there is one mechanical fact about *these lines* the
   reader cannot get from the code — most often, why the line differs from its
   neighbours. Delete when there is not. "Shorten it a bit" is not an option: a
   trimmed comment on the wrong subject is still on the wrong subject.
3. **Relocate, don't discard.** If the deleted text was accurate documentation,
   say where it goes (package doc, API doc, PR description) in the review, and
   put it there if that is in scope.
4. **Report it as a defect**, in the same list as the code findings, with the
   label and the replacement text. A comment on the wrong subject is not a nit.

## Doing this at scale

Auditing comments across a codebase, or across a large change, has failure modes
of its own.

**Cut in order of length.** A ten-line block is worth more attention than a
three-line one; trimming three lines to two is churn that risks a fact for almost
no gain. Sort the work by size and start at the top.

**A shorter comment that lost a rule is a regression, not progress.** The
dangerous edit is not the one that keeps too much — it is the one that reads
beautifully and quietly drops "callers must hold the lock". When compressing:
- Compress the prose *around* a rule; never the rule.
- If a block states two independent facts, two lines is often the honest floor.
  Do not merge two rules into one sentence that states one.
- After the pass, re-read the diff asking only: *what did the old text assert
  that the new text does not, and does anything depend on it?*

**Do not record why you kept something.** A note explaining that a comment was
left long, or which fact forced it, is a comment about the comment. It belongs in
the review conversation, not in the file — and not in a `KEPT.md` either.

**Do not touch comments outside the change you are making.** The rule against
improving adjacent code applies to comments. A cleanup that rewrites a hundred
comments nobody asked about buries the change reviewers came to read. If the
codebase needs a sweep, make it its own change and say so.

**Verify mechanically, not by reading the report.** If you delegate this work,
check the result: that no functional directive was removed (`//nolint`,
`//go:build`, `//go:generate`, pragma comments — these are *code*), that no
non-comment line changed, and that generated files were regenerated rather than
hand-edited.

## Where the context actually belongs

Nothing in this skill says to throw context away. It says to put it where it
stays true and where the right reader will find it.

| Context | Its home |
|---|---|
| A bug that must never come back | A test named after the invariant it protects |
| Why this approach over the one it replaced | The commit message / PR description |
| A finding from a review pass | The review thread on the change |
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
| "It's all true and all relevant" | True and relevant is the bar for documentation. The bar for a comment is *and it fits in two lines*. |
| "Being detailed is better than being vague" | Detail about ephemeral process is noise. Detail about present constraints is signal. And twenty lines of signal still goes unread. |
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

## Red flags in your own draft

Any of these means stop and rewrite:

- **It is more than two or three lines** and none of them states a constraint,
  invariant, or contract
- Past-tense narration: "used to", "previously", "we tried", "was changed to",
  "no longer", "originally", "instead of the old"
- Process references: "per review", "as discussed", "from the audit", "flagged by"
- Project phases: "in this stage", "until stage 3", "for now, phase 1"
- An index into something the reader does not have: "finding 3", "item 3",
  "wave 4", "task 17", "pass 2", a bare ID like `F7` or `R2`
- Restatement: the comment is a prose translation of the identifier below it
- **Wrong subject:** the comment is about the feature, route, policy, or business
  meaning while the code is a call, wrapper, branch, or registration
- **The comment is longer than the code it sits on**
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

- [ ] Every comment above a declaration is one or two lines, or states a table
      or state machine that genuinely cannot compress
- [ ] Every comment describes the code as it is now, in the present tense
- [ ] No comment narrates a previous attempt, a past bug, or the edit you just made
- [ ] Any regression you fixed is pinned by a test, named after the invariant
- [ ] Every comment survives the cover test — hide it, and the code is genuinely poorer
- [ ] Every comment passes the subject test — it is about the mechanism in the
      lines beneath it (usually why they differ from their neighbours), not the
      feature they implement
- [ ] No comment is longer than the code it annotates
- [ ] No comment stands in for a rename or a split that would make it unnecessary
- [ ] Copied code links its source; every `TODO` states the gap and matches the
      repo's convention
- [ ] Every comment flagged in review was rewritten or deleted, never kept as-is
- [ ] Every identifier, path, and test name a comment mentions has been confirmed
      to exist
- [ ] No session-scoped identifiers: finding numbers, iteration labels,
      wave/batch/task IDs, project phase names, agent run labels
- [ ] Any tracker ID matches a convention already in the repo, or was approved
- [ ] Comments near every line you changed were re-read and are still accurate
- [ ] Nothing that describes **one** of something is now stale because your change
      made it two
- [ ] Context you removed landed somewhere durable: a test, the commit message,
      the review thread, or the tracker
