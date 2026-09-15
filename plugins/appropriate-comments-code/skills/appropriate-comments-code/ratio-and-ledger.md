# The ratio check and the long-comment ledger

Read this file on first use of the skill in a session, and again before
finishing any change: the ratio is counted and the ledger is written at the
end of every pass. `SKILL.md` carries the thresholds and the required fields;
this file is the procedure.

## The ratio check: half comments means it is a document

This check runs **after** the tenets, never instead of them. First write the
change the way the skill says: cover test, subject test, two lines above a
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
prefer a reference page, and the question costs one message. The exemption
lifts the two-line limit and nothing else: a table never waives the ratio
question.

When auditing a whole package rather than a change, count over the whole
file; `reviewing-comments.md` says how the sweep reports it.

## The long-comment ledger

Before finishing, list every comment of three or more lines in the region you
added or changed. List **whole comments**, as `SKILL.md` defines them: the
contiguous run of comment lines. Touching one line of a run makes all of it
yours, so a paragraph you appended to a twelve-line block puts a fifteen-line
comment in the ledger, judged like the lines you wrote. The ledger goes in
your final message and nowhere else: never into a PR description, a commit
message, or a file in the repo. A comment pass is not a reason to touch a
PR description. One line per comment:

```text
net/retry.go:12    14 lines  list   rows 5  glossed 5  body-match 5/5  → deleted; one constraint kept as 2 lines
store/claims.go:8   6 lines  state machine  rows 3  glossed 0  body-match 0/3  → kept; rows carried by the claims table CHECK constraint
api/token.go:30     3 lines  prose  constraint: yes                    → kept
sync/push.go:41     9 lines  prose                                     → user asked; candidate home: package doc
export/view.go:9   10 lines  prose  editor-addressed                   → enforced by TestBuildCustomerView (assertion added; setup and call already there); 1 line kept; review step sent to CONTRIBUTING
```

The fields: location, line count, shape (prose, list, table, state machine,
doc sections), and for a list or table the row count, the rows failing the
row test, and the body-match count; then the verdict: kept, rewritten to N
lines, deleted, sent to the user with a candidate home, or, for an
editor-addressed comment, "enforced by" with the test or check that now
fails and the one line left. An "enforced by" verdict names the existing
test the assertion went into, or says why no existing test on that function
performed the steps, with the step count.

A list entry is complete only with both counts: a row test without a
body-match is half a test, and a table whose entry lacks either count is
prose, measured by the four-line question. When nothing in the change is
over two lines, the ledger is the one line "no comment over two lines in the
change".

**The verdict is an action, not a recommendation.** A ledger line that says
"deleted" describes the file as you leave it. Writing the verdict and then
leaving the lines in place because the task said "add a note", "just
append", or "extend the comment" is the same failure as never running the
tests. The task's wording sets what you add; the skill sets what the comment
you touched may keep, and no task wording narrows that. If the verdict is
"send to the user", the four-line rule applies as written: one or two lines
stay in the code, the rest goes to the handoff with the question, and the
block does not stay in the file while you wait. If the verdict is "enforced
by", the assertion is in the test file before you finish, not in a
follow-up note.

**The pass never waits on a decision about the code's future.** A comment
whose fate depends on something pending, a product call next week, a review
that has not happened, a policy under debate, leaves the file now: the
verdict is carried out and the open question goes to the handoff. "If they
decide the other way these get deleted, not shortened, so I will wait" has
the same outcome either way, the lines leave, and waiting only ships them.
