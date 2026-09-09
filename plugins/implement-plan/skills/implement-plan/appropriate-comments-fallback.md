# Appropriate Comments — using the skill, or running the pass on the spot

The comment pass runs over the merged diff after the last fix round and before
the decisions log. Its subject is every comment the run added or changed.
Executors write comments under pressure and with the whole session in their
head, so the diff arrives with the predictable failures: comments that narrate
what was tried, restate the line below, cite a finding number or a slice name,
or run to a paragraph above a one-line call. The pass removes those before the
user reads the diff.

## Prefer the installed skill

Check the skill list your harness gives you. If `appropriate-comments-code` is
installed (it ships in the plugin of the same name; install lines are in
`companion-skills.md`), **run it as written** on the merged diff, in its
"reviewing a diff" mode: it reads its own companion file, labels every added or
changed comment, and rewrites or deletes each one it flags. Do not paraphrase
it from memory. When it is not installed, run the pass below.

Either way, the scope is the merged change only: `git diff
<starting-commit>..HEAD`. Comments outside that diff are not opened up. A
comment sweep of the surrounding code is its own change and is never part of
this run.

## The rule

**A comment earns its place by carrying information the code does not, about
the code as it is now, in as few lines as that takes.** Three ways to fail it,
equally fatal: restating the line below, narrating how the code got here, and
explaining at length something true and useful — that is documentation, and
documentation does not live above a function.

## The pass

For every comment the diff adds or changes, in order of length, longest first:

1. **Classify** it with one label, or pass it:
   - `restates` — cover the comment with your hand and read the code; if
     nothing was lost, it restates. Above a log, metric, error, or assert,
     cover it and read the *message*: if the message already says it, it
     restates.
   - `narrates` — past tense or process: "used to", "previously", "we tried",
     "no longer", "per review", "as discussed", "flagged by", "from the audit".
   - `documents` — more than two lines above a declaration, or more than one
     line above a statement inside a body, with no constraint, invariant, or
     contract in it (a rule is a caller obligation or a guarantee; rationale,
     precedent, a comparison with no neighbour in the file, and the body restated
     are not rules, while a sibling difference in the two-line form below is, and a prose comment is never a "list of rules"); or on the wrong subject — about the feature, route,
     policy, or business meaning while the code is a call, wrapper, branch, or
     registration; or the only commented member of a list whose siblings are
     bare.
   - `session-scoped` — a finding number (`F7`, "finding 3"), an iteration
     label ("pass 2", "round 3"), a wave, batch, slice, or task ID, a plan step
     number, a project phase name ("in this stage", "until phase 2"), an agent
     or run label. These meant something to this run and nothing after it.
   - `counts` — a tally of things that live elsewhere and can be added to:
     "the 7 tests", "all 13 integration tests", "the three callers", "both
     fields". Name the set instead — a file, a build tag, a pattern, an
     invariant — so the comment grows with it. A number stays only when it is
     a constraint this code enforces, and then it is a named constant the
     comment explains.
   - `unverified` — names an identifier, path, test, or number you have not
     confirmed exists. Grep for it.
   - A doc comment on an item the language's doc generator publishes (Rust
     `///`, a docstring, Javadoc, a Go exported identifier) is `documents`
     only for prose past its summary: keep the two-line summary and the
     convention sections (Errors, Panics, Args, Returns) that state
     contracts. A doc marker on a private item is a plain comment under the
     limit.
   - `names-the-body` — names a field the body reads or a helper the body
     calls. Each name is a rename away from wrong; say it in words or drop it.
     The lock a caller must hold, the neighbour a comment differs from, and
     things in other files stay.
   - `stale` — no longer matches the code beside it, including a comment that
     describes *one* of something the run made two.
2. **Rewrite or delete — never keep as-is, never merely shorten.** Rewrite when
   there is one mechanical fact about *these lines* the reader cannot get from
   the code — most often why the line differs from its neighbours, and then in
   two lines: that the difference is deliberate, the one mechanical difference,
   and what breaks if it is normalized. Delete when there is not. A trimmed
   comment on the wrong subject is still on the wrong subject. Never drop a
   rule while compressing: compress the prose around a constraint, never the
   constraint; rules that share a principle compress into the principle,
   stated once. A prose comment still over four lines after this is not kept
   under an exemption claim: leave two lines in the code, move the rest to
   the decisions log, and put it under *Pending for you* in the recap with a
   candidate home.
3. **Relocate, do not discard.** Accurate documentation that came out of a
   comment goes where documentation lives — the package doc, the README, the
   API reference, when that document is already in the diff — or into the
   decisions log and the recap. Deliberation, alternatives, and the argument
   for a line's existence go to the recap. Say where each piece went.
4. **Verify what the survivors name.** Every identifier, path, and test a kept
   comment mentions exists on disk. A comment naming a renamed method is worse
   than silence.

**Test files are left alone.** A test's history is its subject: the incident,
the odd fixture value, the redelivery note. Do not rewrite or delete existing
comments in test files (test suffix or prefix, spec files, anything under a
tests, testdata, or fixtures directory). Comments the run *added* to test
files are still checked for `session-scoped` and `restates`; length and
history are allowed there. Say in the recap that test comments were skipped.

## The ratio check, after the pass

Per file in the diff, ignoring blank lines, test files, and functional
directives (`//go:build`, pragmas, `//nolint`), count the comment lines
against the code lines in the region the run added or changed. Skip files
with fewer than five counted lines. When comment lines are **half the code
lines or more**, the region is a document with code in it, and a shorter
comment is not the fix. The standalone skill stops and asks the user where the
material should live. **Under this skill that is not a gate:** the run cannot
stop here, so default to what the standalone skill does when it cannot ask —
move the material to the decisions log with one- or two-line pointers left in
the code, name the candidate home (package doc, README section, ADR, API
reference), and put the question under *Pending for you* in the recap with the
ratio and a summary of what the comments said.

## What the pass never does

- Touches a non-comment line. Verify mechanically before finishing: the diff
  of the pass changes comment lines only, and no functional directive moved.
  A comment that is really a rename request or a split request (`// n is the
  retry count`, `// convert to cents`) is handed to the simplification pass in
  `code-simplification-fallback.md`, not fixed here.
- Introduces a tracker ID (JIRA, Linear, GitHub) into a repo whose comments do
  not already use them; matches the convention when they do.
- Records why a comment was kept. That belongs in the recap, not in the file.
- Sweeps beyond the merged diff.

## Reporting

In the recap's *What was done*, one line: how many comments were rewritten,
how many deleted, that test-file comments were left alone, and where relocated
material went. Each ratio-check file goes under *Pending for you* with the
recommended home.
