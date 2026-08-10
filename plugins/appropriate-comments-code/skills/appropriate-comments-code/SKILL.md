---
name: appropriate-comments-code
description: Use when writing, editing, or reviewing code in any language, and especially before adding or changing a comment or docstring — when tempted to narrate in a comment what was tried first, why an approach was replaced, or what a bug, regression, or review turned up; to restate what the next line already says; or to cite a ticket, finding number, iteration label, wave or task ID, or any other session-scoped identifier.
---

# Appropriate Comments in Code

## The Rule

**Every comment carries information the code does not, and describes the current
state only. No iteration labels, finding numbers, wave or task IDs, or "how we
got here" narrative.**

A comment that restates the line under it fails the rule just as surely as one
that narrates the last three attempts.

## Overview

A comment describes **the code as it is now**, for a reader who has none of your
context: a developer months from now who was not in this session, did not read
the pull request, does not know what you tried first, and cannot ask you.

Everything in this skill follows from that one reader. If a sentence only makes
sense to someone who watched the code being written, it does not belong in the
code.

This skill is language-agnostic. Apply it with whatever comment syntax and
documentation convention the project already uses.

## When to Use

- Writing any new function, type, module, or test
- Editing code that already has comments above or inside it
- Fixing a bug and feeling the urge to explain the fix in place
- Applying review feedback, whether from a human or from an automated reviewer
- Writing doc comments / docstrings for a public API
- Reviewing someone else's diff that adds comments

**When NOT to use:** the user explicitly asked for annotated, tutorial, or
teaching code, where narrating every line *is* the deliverable. Say that you are
setting the skill aside and why.

## The Three Tenets

### 1. Describe the current state, not the path that got you there

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
// Fetch streams the response body instead of buffering it: payloads are
// unbounded and a buffered read can exceed the container memory limit.
// The caller owns the returned reader and must Close it.
func (c *Client) Fetch(ctx context.Context, url string) (io.ReadCloser, error) {
```

The good version still carries the *why* — but as a standing constraint that is
true right now, not as a story about a previous edit.

**A regression is documented by a test, not by a comment.** A comment saying
"don't remove this check, it caused a double-charge" is an honour-system
guardrail: it does not fail when someone removes the check. A test does.

```
Bug fixed → write the test that fails without the fix.
            Name the test after the invariant, not the incident:
            TestRefundIsNotAppliedTwice, not TestBugFix1234.
Then write the comment only if the code still needs one after the test exists.
```

### 2. A comment must carry information the code does not

A comment that restates the line under it costs the reader time and gives them
nothing. Worse, it is one more thing to keep in sync.

```python
# Bad
# Opens the DB connection
connection.open()

# Bad
# Loop over the users
for user in users:

# Good — a fact the code cannot express
# Postgres closes idle connections after 5 minutes; open() lazily
# reconnects, so callers must not cache the underlying socket.
connection.open()
```

**The cover test:** cover the comment with your hand and read the code. If you
lost nothing, delete the comment.

Comments that earn their place say things the code cannot:

| Comment carries | Example |
|---|---|
| A constraint from outside the code | Rate limit, spec clause, protocol requirement, hardware quirk |
| An invariant or precondition | "Callers must hold `mu`." / "`items` is sorted by `id`; binary search depends on it." |
| Units, ranges, encoding, ownership | "Timeout in milliseconds." / "Caller owns and must free the buffer." |
| Why a non-obvious approach is required | "Sequential on purpose: the API rejects concurrent writes to one account." |
| A workaround for an external defect | The upstream issue link, plus what to check to know it can be removed |
| What a caller needs without reading the body | Public API doc comments: behavior, errors, side effects |

For a workaround, the durable form points at something that outlives the
session and states its own exit condition:

```js
// Safari <= 17 fires `resize` before the viewport metrics settle, so read
// them on the next frame. See https://bugs.webkit.org/show_bug.cgi?id=254340
// — drop this once the minimum supported Safari is 18.
requestAnimationFrame(measure);
```

### 3. Never commit an identifier that outlives nothing

Identifiers minted during a working session are meaningless to every reader
except the person who was driving that session, and meaningless to *them* within
a day. The context that gave the ID meaning is gone; the ID stays in the file
forever. None of these belong in a comment:

- **Finding numbers** — `F7`, `R2`, "finding 3", "issue 12 from the audit"
- **Iteration labels** — "pass 2", "round 3", "v2 of this approach", "attempt 2"
- **Wave, batch, or task IDs** — "wave 4", "batch B", "task 17", a plan step number
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

**Tracker IDs are a project convention, not a default.** Before writing a JIRA,
Linear, GitHub, or Notion ID into a comment, check whether the project already
does it — `git grep` for the ticket prefix in existing comments. If the
convention is already there, match it. If it is not, ask the user before
introducing one; do not add it on your own judgment.

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
| A standing constraint the code must respect | A comment — this is the case comments are for |

## Comments are part of the code you edit

When you change a line, you own every comment that describes it. A comment that
was accurate before your edit and is wrong after it is worse than no comment: it
actively misleads, and readers trust it. Before finishing an edit, re-read the
comments above, inside, and immediately after the lines you touched, and update
or delete each one that no longer matches.

## Rationalizations

| Rationalization | Reality |
|---|---|
| "The history explains why I changed it" | The reader sees today's code, not your diff. State the constraint in the present tense, or put the story in the commit message. |
| "A comment warns the next person not to undo the fix" | It warns nobody — nothing checks it. Write the test; it fails when someone undoes the fix. |
| "The finding ID keeps it traceable" | Traceable to a session that no longer exists, by a reader who never saw it. Even the same agent has lost that context by the next run. |
| "Being detailed is better than being vague" | Detail about ephemeral process is noise. Detail about present constraints is signal. |
| "The comment documents what the function does" | If it restates the name and the body, it documents nothing. Document what the caller cannot see: errors, side effects, preconditions. |
| "It's obvious, but a comment makes it clearer" | If it is obvious from the code, the comment adds a maintenance obligation for zero information. |
| "I'll note the ticket number just in case" | Only if the project already does it. Otherwise ask first — an unexplained ID is a dead end for whoever hits it. |
| "I'll leave the old approach in a comment in case we need it" | That is what version control is for. Commented-out code and eulogies for deleted code both get deleted. |
| "The comment is slightly stale but still mostly right" | Mostly-right comments are how people get misled with confidence. Fix it or remove it. |

## Red flags in your own draft

Any of these in a comment you are about to write means stop and rewrite:

- Past-tense narration: "used to", "previously", "we tried", "was changed to", "no longer", "originally", "instead of the old"
- Process references: "per review", "as discussed", "from the audit", "flagged by"
- An index into something the reader does not have: "finding 3", "item 3", "wave 4", "task 17", "pass 2", "attempt 2", a bare letter-number ID like `F7` or `R2`
- Restatement: the comment is a prose translation of the identifier on the next line
- Commented-out code kept "for reference"
- An apology or a hedge: "hacky but", "not sure why this works"— if you do not know why it works, that is a thing to find out, not to record
- A ticket or tool ID that appears nowhere else in the repository

## Before you finish

- [ ] Every comment describes the code as it is now, in the present tense
- [ ] No comment narrates a previous attempt, a past bug, or the edit you just made
- [ ] Any regression you fixed is pinned by a test, named after the invariant
- [ ] Every comment survives the cover test — hide it, and the code is genuinely poorer
- [ ] No session-scoped identifiers: finding numbers, iteration labels, wave/batch/task IDs, agent run labels, checklist positions
- [ ] Any tracker ID matches a convention that already exists in the repo, or was approved by the user
- [ ] Comments near every line you changed were re-read and are still accurate
- [ ] Context you removed from comments landed somewhere durable: a test, the commit message, the review thread, or the tracker
