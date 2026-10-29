# Plan Check — one fresh subagent reads the plan cold, then against the code

The full `planning-flow` skill runs a zero-context reviewer, a cold implementer, and a second opinion on the agent's own decisions, each a separate subagent. A quick plan is one ticket, so one subagent does all three jobs in two passes. It still matters: it is what catches "the plan changes the title here, but the same title also appears in two other places".

## When it runs

After the draft is written and every question asked so far is answered, and never while a pending check could change the ticket: wait for the check, or for the user's answer to its permission request, unless the user deferred it.

## Who runs it

One fresh subagent, with no conversation history and no list of what you already checked. Run it on a **different model family from yours** when the harness offers one (a Codex agent from Claude, `claude -p` from Codex), because a different model does not share your idea of what is obvious. Otherwise run it on the **most capable tier** the harness offers: the plan is short, so a capable reader costs little, and judgment is the whole job.

It receives exactly: the plan's *The ask* section as written, the path of the plan file, the repository path, and the list of decisions you made on the user's behalf (each with what was chosen and the alternative), with no argument for any of them. It is told to ignore the plan folder, which may hold a codebase map it should not trust.

## The prompt (fill the brackets, keep the rest)

> You are checking a short plan for a small coding change. You have the request, the plan, and read access to the repository at `<path>`. You have no other context, and that is deliberate. Ignore the `<plan folder>` folder except for the plan file itself. Do not edit anything.
>
> The request (the task, then the requester's own words):
> > <ask>
>
> The plan is at `<plan path>`.
>
> Pass 1, from the plan only, before opening any other file: (a) Restate the change in two sentences. (b) List every concrete thing you would still have to go and find before you could build it: exact strings, paths, the pattern to follow, commands, which existing test each acceptance criterion extends, where each edit goes.
>
> Pass 2, now open the repository. Assume the plan fails the request and prove it:
> 1. Every claim the plan makes about the code that is not true, with the file and line.
> 2. Every place the same thing appears that the plan does not cover (the same string, value, or behavior elsewhere).
> 3. Where the plan does not follow the pattern the surrounding code uses, and the example it should follow.
> 4. Every acceptance criterion whose named test does not exercise that surface, or that adds a new test where an existing one already performs most of its setup and actions.
> 5. Cases the plan does not handle: empty input, first run, existing data, an error from something it calls.
> 6. Anything the plan builds that the codebase, the standard library, or an installed dependency already provides.
> 7. Signs the change is bigger than one small ticket: it needs more than one ticket, reaches a second part of the codebase, touches a database schema, a stored format, sign-in or permissions, work that runs at the same time, a public API, or an outside service, or has no existing example to follow.
> 8. For each of these decisions made on the requester's behalf, whether it fits the request and whether it changes anything a user or another system would notice: <decisions, each with the alternative>.
>
> Return: the pass-1 list; then the pass-2 findings, each with what is wrong, the evidence (file and line, or the plan's sentence), and whether fixing it changes what a user or another system would notice. Return empty lists if the plan holds; do not invent problems.
>
> This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has.

## Folding it in

Sort the pass-1 list. A **build-changing gap** is a fact that decides what gets built: an exact string, a path, a pattern, a command, a place where an edit goes, a test to extend. Fill each with the exact value in *Technical context*. The surrounding text of a file the implementer opens anyway to make the edit is not a gap.

For each pass-2 finding:

- A correction, or a fix that keeps the plan doing what the ask wants (making the asked-for behavior actually happen counts): rewrite the plan and log it as your decision with the reason.
- A fix that changes what a user or another system would notice beyond the ask, or a decision of yours the check shows changes such behavior: it goes on the question list, in the `question-format.md` shape, with the suggested fix as the recommendation.
- A sign from item 7: warn as *Too big for a quick plan* in `SKILL.md` says.

Never write "the check found" anywhere in the plan.

When a gap was filled or a fact corrected, run the check **once more** with a **new** subagent given the rewritten plan, never the first one resumed: it has read the old text, so it is no longer cold, and its cache has expired. If the second check still lists a build-changing gap, that is the *The plan does not converge* sign. No third check: warn, fill what you can, and list what remains under *Gotchas and caveats*.

## The fast plan review (only when the user picks it)

At presentation, offer one review of the finished plan in one plain line: **fast or none**, with your recommendation. Run it only on a yes, and only once.

- **`adversarial-review-fast` installed:** run it as written, with the plan file as the change under review and the plan's *The ask* section as the brief (the standard the plan must meet). A plan is sized by the code its ticket would touch, not by its own lines. Its last step, putting every finding to the user, does not run here: take its findings and fold them in as above.
- **Not installed:** dispatch one fresh subagent on the cheaper tier with the ask (marked as the brief), the plan file, the repository path, the scope rule and output format below, and two charters: *Ask conformance* ("List every requirement in the brief before reading the plan, then check each: addressed, missing, different, or added unasked — including a plan that carries a decision past the subject it was about.") and *Premise* ("Assume the plan does exactly what the brief asks; show the concrete case where it still goes wrong: the empty or first-run case, existing data that does not fit, a false assumption about the code.").

**Scope rule (verbatim):**

> The brief is the request this plan must satisfy. Something the brief lists as a non-goal is not a finding. A decision in the brief covers the subject it was made about: a plan that carries it to another subsystem or another kind of item is work nobody agreed to — report it. The brief bounds scope; it never establishes correctness: if the plan does exactly what the request asks and the result would still be wrong, report it and set `design_is_wrong: true`. Assume the plan is broken and prove it; return `[]` if you cannot.

**Output format (verbatim):** a JSON array of `{title, location "section or path:line", severity "high|medium|low", what_is_wrong, what_could_go_wrong, evidence, suggested_change, changes_user_visible_behavior, design_is_wrong}`, where `evidence` is the exact sentence quoted from the plan, the code it was checked against, and the numbered steps to the failure.

The prompt ends: "Before a finding goes in, fill its evidence; a finding you cannot fill, you drop. This is a single task. Return your result when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has."

Check only that each quoted sentence is in the plan, then fold the findings in as above. No second review.
