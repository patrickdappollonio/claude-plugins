# Plan Review — the zero-context reviewer, the cold implementer, the adversarial review

Four procedures. The first two always run, together. The third is offered. The fourth runs when the user accepts it.

## 1. The zero-context reviewer (always, one subagent)

One reviewer, on the most capable tier your harness offers (see `model-routing.md`), dispatched after the first draft. It receives **exactly these things** and nothing else:

1. The plan's *The ask* section, as written: the task sentence and the user's quoted words, marked as the ask. Never the message that asked for a plan; if that is all the section holds, fix the section first (`SKILL.md` step 1).
2. The plan file.
3. Access to the codebase (the repository path).

It does not receive the conversation, your exploration notes, or any reassurance. The reviewer is useful because it has not heard your reasoning and cannot inherit your excuses.

**Prompt shape (fill the brackets, keep the rest):**

> You are reviewing a plan document against the request it is meant to satisfy. You have the request, the plan, and read access to the repository at `<path>`. You have no other context, and that is deliberate.
>
> The request (the task, then the requester's own words):
> > <ask>
>
> The plan is at `<plan path>`. Read it in full.
>
> Assume the plan fails the request and prove it. Look for: parts of the request the plan does not address; premises the plan asserts about the code that are not true (check the code); cases the plan does not handle (empty, first run, migration of existing data, failure of an external system, concurrent use); decisions the plan makes that the requester would want to make themselves; anything the plan would need to know that nobody wrote down; anything in the plan that is not needed for the request; and anything the plan builds that the codebase, the standard library, the platform, or a dependency already installed provides — name the existing thing.
>
> Return two lists. **Findings:** each with what is wrong, why it matters, the evidence (a file and line, or the sentence of the request or plan), and whether fixing it changes what a user or operator would experience. **Questions for the requester:** each one a decision only they can make, with the options and the consequence of each. Do not ask anything the repository answers; answer it yourself and cite where. Return empty lists if the plan holds; do not invent problems.
>
> This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.

Merge its findings into the plan through the authority table in `SKILL.md` and its questions into the question list, then filter that list as `SKILL.md` step 6 describes.

## 2. The cold implementer check (always, one subagent)

The reviewer finds what the plan gets wrong. This check finds what the plan leaves out: every fact an implementer would have to go and find because the *Technical context* pointed at it instead of stating it.

Dispatch one subagent **on a different model family from the one that wrote the plan** when the harness offers one, a Codex agent for example, because a different model does not share the author's assumptions about what is obvious. Otherwise use the cheaper tier. It receives the ask and the plan's *Technical context* and *Tickets* sections, and the repository path, with the instruction to answer in two passes.

**Prompt shape (fill the brackets, keep the rest):**

> You are a fresh implementer with no prior context. Below is a coding task and the technical context and tickets of a plan written for it. The repository is at `<path>`. Do not edit anything.
>
> Pass 1, from the text below only, before opening any file: (a) Restate the challenge in three sentences. (b) Grade from 1 to 5 whether this text is enough to start implementing without exploring the repository, and list every concrete thing you would still have to go and find: exact strings, formats, paths, conventions, commands, how tests run, which existing test each acceptance criterion extends, where each edit goes.
>
> Pass 2, now open the repository: list what the text got wrong, with the file and line. Then write the bullets that the technical context should have contained so an implementer never has to explore.
>
> The task, then the requester's own words: <ask>
>
> Technical context: <section>
>
> Tickets: <section>
>
> This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.

Fold the result in. Sort the pass-1 list into these kinds. A **build-changing gap** is a fact that decides what gets built: an exact string, a format, a rule, a severity, a path, a convention, a command, a place where an edit goes. Each one becomes a stated fact in *Technical context*, with the exact value. An **edit-time read** is the surrounding text of a file the implementer will open anyway to make the edit: the current wording around an insertion point, the formatting of a config file, the version of an action in a workflow. Those are not gaps; a plan that pasted them would be a copy of the repository. Every pass-2 correction is a fix. Every item that only the user can answer goes to the question list. Then run the check again, with a **new** subagent given the rewritten sections — never the earlier one resumed: it has read the old text, so it is no longer cold, and its prompt cache has expired while it sat idle, so a message to it re-reads its whole history at full price. **It passes when the pass-1 list holds no build-changing gap.** A grade is not a pass; a list with only edit-time reads on it is.

## 3. The adversarial review of the plan (once, at the end, the user's choice)

An adversarial review assumes the change is broken and tries to prove it from several independent angles, by reviewers who share none of the author's context, with a separate reviewer that discards false findings. It is the most expensive step in this skill. It runs **once**, on the finished plan — no open question, no pending spike, no cold implementer gap — and only after the user picks fast, quick, or full; none is an answer. After the fixes, a second run needs a fresh yes. The review skill expects a code change. A plan works as one: it is a new file in which every line is an added line.

**The review measures the plan against the user's ask, not against the plan.** A code review receives the plan as its standard (its "brief"). A plan review receives the **user's ask** — the plan's *The ask* section as written, which holds the task in one sentence and the user's own words for it, their constraints and non-goals included. If you hand the review the plan as its own standard, it checks the plan against itself and finds nothing. Tell the review the subject is a plan document, that the "was this design right" and "does it match the ask" angles carry the weight, and that it may skip charters that cannot apply to prose as long as it says which.

### Sizing

**Size the plan by what it would change once built, never by the plan file.** Diagrams, examples, API cards, question fences, and the decisions log make a plan long without making the change large, and a short plan can describe a large change. Estimate the finished diff from the tickets, and state the estimate in one line when you offer the review:

- **Lines:** the code the tickets would touch, tests and docs included. Add up each ticket's size band at its midpoint. When the total lands near a limit below, the bands are too coarse to decide it: estimate those tickets from what they change in each file they name.
- **Subsystems**, and whether any ticket touches a **sensitive area**: the database schema, sign-in and permissions, work that runs at the same time, and outside services.

Then use the same lines as a code review, so a plan gets the review its finished code would get:

| The finished change | Review |
|---|---|
| About 500 lines or fewer **and** one subsystem **and** no sensitive area | **Fast** |
| 2000 lines or fewer **and** one subsystem **and** no sensitive area | **Quick** |
| Over 2000 lines, **or** a second subsystem, **or** a sensitive area | **Full** |

One line over a limit moves the plan up a row. The size is the recommendation. Offer fast, quick, full, or none in plain text, with what each costs, and run exactly what the user chose, once. If they ask for the other size, run that.

### Which to run

| Installed | Run |
|---|---|
| `adversarial-review-fast` (fast), `adversarial-review-quick` (quick), or `adversarial-review` (full) | The skill, **as written**, its checks included — the verifier and fix validator, or fast's self-check. Hand it the plan file as the diff and the ask as the brief. |
| Fast chosen, its skill not installed | The one-reviewer version below. |
| Only the quick skill, full chosen | Run the quick skill, say the full one is not installed, name the angles left uncovered. Give install lines only if asked (`companion-skills.md`). |
| Quick or full chosen, neither of those installed | The on-the-spot panel below. |

The quick skill proposes the fewest reviewers that fit the plan and asks which to run; answer from the sizing above rather than re-asking the user: confirm its proposal, and add the angles the sizing flagged.

### On-the-spot panel (no review skill installed)

Dispatch **one reviewer per charter below, all in one message**, each a fresh subagent on the cheaper tier, each receiving only: its charter, the ask (marked as the brief), the plan file, the repository path, the scope rule, the output format, and the line "This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has." Every panel agent, the verifier included, is one-shot: a second look at anything is a new agent, never one resumed or messaged.

**Scope rule (verbatim in every prompt):**

> The brief is the request this plan must satisfy. Something the brief lists as a non-goal is not a finding. The brief bounds scope; it never establishes correctness: if the plan does exactly what the request asks and the result would still be wrong, report it and set `design_is_wrong: true`. Assume the plan is broken and prove it; return `[]` if you cannot.

**Output format (verbatim):** a JSON array of `{title, reviewer, location "section or path:line", severity "high|medium|low", what_is_wrong, what_could_go_wrong, evidence, suggested_change, changes_user_visible_behavior, design_is_wrong}`.

**Charters:**

1. **Ask Conformance Auditor** — "Enumerate every requirement in the brief before reading the plan, then check each one: addressed, missing, different, or added unasked. Find where anything the brief asked for and the plan dropped would end up."
2. **Premise Auditor** — "Assume the plan is the mistake. It does exactly what the brief asks; show the concrete case where it still goes wrong: a state with nowhere to live, the empty or first-run case, existing data that does not fit, a false assumption about the world, a cost nobody priced." Every finding is `design_is_wrong: true`, and every finding is a concrete failing case, not taste.
3. **Unstated-Assumption Hunter** — "List what must be true for this plan to work that nobody wrote down: ordering, uniqueness, encoding, size, permissions, the presence of a file or a service, the behavior of a dependency. Check each one against the repository and break it."
4. **Data and Contract Guardian** — "Find where data ends up wrong or lost under this plan: partial writes, overwrites, lossy conversions, migrations that cannot roll back, a stored format or an interface others depend on that silently changes."
5. **Feasibility and Scope Prosecutor** — "Find every claim the plan makes about the code that the code contradicts, every ticket whose acceptance criteria cannot be observed, every dependency between tickets the plan does not state, every piece of work in the plan the brief did not ask for, and every component, helper, or dependency the plan adds where the codebase, the standard library, the platform, or an installed dependency already provides it — name the existing thing — and every ticket that hand-writes part of a published format, protocol, or standard where a maintained library exists — name the library."

Then dispatch **one verifier** (fresh, cheaper tier) with every finding, the brief, the plan, and the repository path: it returns *confirmed / not confirmed* with a one-line reason, and must point at the exact sentence or line for a "confirmed". Only confirmed findings proceed.

### One-reviewer version (fast chosen, skill not installed)

Dispatch **one** fresh subagent on the cheaper tier with: two or three of the charters above, picked by what the plan touches — always the *Ask Conformance Auditor* and the *Premise Auditor*, plus one more when its subject is in the plan — the ask (marked as the brief), the plan file, the repository path, the scope rule, and the output format above with one more field, `evidence`: the exact sentence it quotes from the plan, the code or file it checked that sentence against, and the numbered steps to the failure. Its prompt ends: "Before a finding goes in, fill its evidence; a finding you cannot fill, you drop. This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has." No verifier runs; check only that each quoted sentence is in the plan, and treat what survives as confirmed.

### After the review

A finding inside the ask is fixed, not asked:

- Fix is technical or corrects a mistake, and the plan still does what the ask wants afterwards → rewrite the plan, log the decision with the reason and any drawback. Making the asked-for behavior actually happen counts: it is not a change in behavior.
- Fix changes how the product behaves beyond the ask or a decision the user made (the business process, what users see or get, an operational policy such as a threshold), is large (a new dependency, a schema, a public API), or reaches outside the ask → a question for the user, with the reviewer's suggested change as the recommendation.

A `design_is_wrong` finding takes the same test. When an installed review skill runs, its own question step does not: its findings come back here.

Nothing about the review is written into the plan except the resulting decisions. Nothing about the review is reported in chat except, if asked, that it ran and whether the plan held.

## 4. Before any review: pending checks

No reviewer in this file sees a draft whose shape still hangs on a pending check, meaning a result that could add, remove, or resize a ticket. Run the check, or get the user's answer to its permission request, first; the exception is a check the user deferred. Checks, spikes, and their permission requests are defined in `verification.md`.
