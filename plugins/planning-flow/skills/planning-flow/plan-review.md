# Plan Review — the zero-context reviewer, the cold implementer, the adversarial review, spikes

Four procedures. The first two always run, together. The third is offered.
The fourth runs when the user accepts it.

## 1. The zero-context reviewer (always, one subagent)

One reviewer, on the most capable tier your harness offers (see
`model-routing.md`), dispatched after the first draft. It receives **exactly
three things** and nothing else:

1. The user's ask, verbatim, marked as the ask.
2. The plan file.
3. Access to the codebase (the repository path).

It does not receive the conversation, your exploration notes, or any
reassurance. The reviewer is useful because it has not heard your reasoning
and cannot inherit your excuses.

**Prompt shape (fill the brackets, keep the rest):**

> You are reviewing a plan document against the request it is meant to
> satisfy. You have the request, the plan, and read access to the repository
> at `<path>`. You have no other context, and that is deliberate.
>
> The request, verbatim:
> > <ask>
>
> The plan is at `<plan path>`. Read it in full.
>
> Assume the plan fails the request and prove it. Look for: parts of the
> request the plan does not address; premises the plan asserts about the code
> that are not true (check the code); cases the plan does not handle (empty,
> first run, migration of existing data, failure of an external system,
> concurrent use); decisions the plan makes that the requester would want to
> make themselves; anything the plan would need to know that nobody wrote
> down; and anything in the plan that is not needed for the request.
>
> Return two lists. **Findings:** each with what is wrong, why it matters,
> the evidence (a file and line, or the sentence of the request or plan), and
> whether fixing it changes what a user or operator would experience.
> **Questions for the requester:** each one a decision only they can make,
> with the options and the consequence of each. Do not ask anything the
> repository answers; answer it yourself and cite where. Return empty lists
> if the plan holds; do not invent problems.

Merge its findings into the plan through the authority table in `SKILL.md`
and its questions into the question list, then filter that list as `SKILL.md`
step 5 describes.

## 2. The cold implementer check (always, one subagent)

The reviewer finds what the plan gets wrong. This check finds what the plan
leaves out: every fact an implementer would have to go and find because the
*Technical context* pointed at it instead of stating it.

Dispatch one subagent **on a different model family from the one that wrote
the plan** when the harness offers one, a Codex agent for example, because
a different model does not share the author's assumptions about what is
obvious. Otherwise use the cheaper tier. It receives the ask and the plan's
*Technical context* and *Tickets* sections, and the repository path, with
the instruction to answer in two passes.

**Prompt shape (fill the brackets, keep the rest):**

> You are a fresh implementer with no prior context. Below is a coding task
> and the technical context and tickets of a plan written for it. The
> repository is at `<path>`. Do not edit anything.
>
> Pass 1, from the text below only, before opening any file: (a) Restate
> the challenge in three sentences. (b) Grade from 1 to 5 whether this text
> is enough to start implementing without exploring the repository, and
> list every concrete thing you would still have to go and find: exact
> strings, formats, paths, conventions, commands, how tests run, where each
> edit goes.
>
> Pass 2, now open the repository: list what the text got wrong, with the
> file and line. Then write the bullets that the technical context should
> have contained so an implementer never has to explore.
>
> The task, verbatim: <ask>
>
> Technical context: <section>
>
> Tickets: <section>

Fold the result in. Sort the pass-1 list into two kinds. A **build-changing
gap** is a fact that decides what gets built: an exact string, a format, a
rule, a severity, a path, a convention, a command, a place where an edit
goes. Each one becomes a stated fact in *Technical context*, with the exact
value. An **edit-time read** is the surrounding text of a file the
implementer will open anyway to make the edit: the current wording around
an insertion point, the formatting of a config file, the version of an
action in a workflow. Those are not gaps; a plan that pasted them would be
a copy of the repository. Every pass-2 correction is a fix. Every item that
only the user can answer goes to the question list. Then run the check
again. **It passes when the pass-1 list holds no build-changing gap.** A
grade is not a pass; a list with only edit-time reads on it is.

## 3. The adversarial review of the plan (offered, sized)

An adversarial review assumes the change is broken and tries to prove it from
several independent angles, by reviewers who share none of the author's
context, with a separate reviewer that discards false findings. The review
skill expects a code change. A plan works as one: it is a new file in which
every line is an added line.

**The review measures the plan against the user's ask, not against the
plan.** A code review receives the plan as its standard (its "brief"). A plan
review receives the **user's ask**, verbatim, plus any constraints and
non-goals they stated. If you hand the review the plan as its own standard,
it checks the plan against itself and finds nothing. Tell the review the subject is a plan
document, that the "was this design right" and "does it match the ask"
angles carry the weight, and that it may skip charters that cannot apply to
prose as long as it says which.

### Sizing

Add up the line estimates of every ticket (the midpoint of each size band)
and map the total onto the same bands. The sensitive areas are: the database
schema, sign-in and permissions, work that runs at the same time, and
outside services. The plan is **quick-sized only when all three hold**: one
subsystem, no sensitive area touched, and a total at or under M (1500
lines). **Any one** of the following makes it full-sized: a second
subsystem, a sensitive area, or a total in L or above.

| The plan | Review |
|---|---|
| One subsystem **and** no sensitive area **and** total at or under M | **Quick** |
| A second subsystem, **or** a sensitive area, **or** a total of L or larger | **Full** |

One line over the limit makes the plan full-sized. Offer the sized review in
plain text and let the user decline. If they ask for the other size, run that.

### Which to run

| Installed | Run |
|---|---|
| `adversarial-review-quick` (quick) or `adversarial-review` (full) | The skill, **as written**, its verifier and fix validator included. Hand it the plan file as the diff and the ask as the brief. |
| Only the quick skill, full chosen | Run the quick skill, say the full one is not installed, name the angles left uncovered. Give install lines only if asked (`companion-skills.md`). |
| Neither | The on-the-spot panel below. |

The quick skill may ask which dropped angles to add; answer from the sizing
above rather than re-asking the user.

### On-the-spot panel (no review skill installed)

Dispatch **five reviewers in one message**, each a fresh subagent on the
cheaper tier, each receiving only: its charter, the ask (marked as the
brief), the plan file, the repository path, the scope rule, and the output
format.

**Scope rule (verbatim in every prompt):**

> The brief is the request this plan must satisfy. Something the brief lists
> as a non-goal is not a finding. The brief bounds scope; it never
> establishes correctness: if the plan does exactly what the request asks and
> the result would still be wrong, report it and set `design_is_wrong: true`.
> Assume the plan is broken and prove it; return `[]` if you cannot.

**Output format (verbatim):** a JSON array of `{title, reviewer, location
"section or path:line", severity "high|medium|low", what_is_wrong,
what_could_go_wrong, evidence, suggested_change, changes_user_visible_behavior,
design_is_wrong}`.

**Charters:**

1. **Ask Conformance Auditor** — "Enumerate every requirement in the brief
   before reading the plan, then check each one: addressed, missing,
   different, or added unasked. Find where anything the brief asked for and
   the plan dropped would end up."
2. **Premise Auditor** — "Assume the plan is the mistake. It does exactly
   what the brief asks; show the concrete case where it still goes wrong: a
   state with nowhere to live, the empty or first-run case, existing data
   that does not fit, a false assumption about the world, a cost nobody
   priced." Every finding is `design_is_wrong: true`, and every finding is a
   concrete failing case, not taste.
3. **Unstated-Assumption Hunter** — "List what must be true for this plan to
   work that nobody wrote down: ordering, uniqueness, encoding, size,
   permissions, the presence of a file or a service, the behavior of a
   dependency. Check each one against the repository and break it."
4. **Data and Contract Guardian** — "Find where data ends up wrong or lost
   under this plan: partial writes, overwrites, lossy conversions, migrations
   that cannot roll back, a stored format or an interface others depend on
   that silently changes."
5. **Feasibility and Scope Prosecutor** — "Find every claim the plan makes
   about the code that the code contradicts, every ticket whose acceptance
   criteria cannot be observed, every dependency between tickets the plan
   does not state, and every piece of work in the plan the brief did not ask
   for."

Then dispatch **one verifier** (fresh, cheaper tier) with every finding, the
brief, the plan, and the repository path: it returns *confirmed / not
confirmed* with a one-line reason, and must point at the exact sentence or
line for a "confirmed". Only confirmed findings proceed.

### After the review

Every confirmed finding goes through the authority table in `SKILL.md`:

- Fix leaves user- and operator-visible behavior unchanged → rewrite the
  plan, log the decision with the reason and any drawback.
- Fix changes what someone would experience, or `design_is_wrong` → a
  question for the user in the next batch, with the reviewer's suggested
  change as the recommendation.

Nothing about the review is written into the plan except the resulting
decisions. Nothing about the review is reported in chat except, if asked,
that it ran and whether the plan held.

## 4. Spikes

A spike is a ticket whose title starts with `Spike:` and whose acceptance
criteria are questions. Two kinds:

- **Cheap** — a subagent can close it in a minute or two: does this endpoint
  accept this call, does this library expose this function, does this path
  exist, what does this table look like, does this command run. Offer these
  when presenting the plan, in one plain-text list, and run the ones the user
  accepts as parallel subagents on the cheaper tier, each with one question
  and the instruction to report what it measured, not what it believes.
- **Real** — needs an experiment, a prototype, or time the user must budget.
  These stay as tickets.

**A spike must measure, not reason.** Its report says what was run and what
it printed. A spike that could not measure says so, and the ticket stays.

**Folding in a resolved spike.** Delete the spike ticket. Add a decisions
entry that states the answer and how it was measured. Rewrite every ticket the
answer affects. The plan then reads as if you always knew the fact. The
reader has no earlier version to compare it against.
