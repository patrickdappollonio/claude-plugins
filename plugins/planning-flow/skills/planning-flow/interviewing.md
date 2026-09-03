# Interviewing — resolving every uncertainty the user holds

The interview is where a plan stops being a guess. It makes sure nobody
assumes a decision in silence. You visit every branch of the design. You
find every fact. The user makes every decision.

## The design tree

Every plan is a tree of decisions. The root is the ask. Each decision
branches into the decisions that only make sense once it is settled: "store
the switch in the database" branches into "which table" and "what default",
and "what default" branches into "what happens to suppliers added later".
An interview that asks "what default?" before "database or config file?"
makes the user answer a question that may not exist. Build the tree before
asking anything.

Build it from three sources, merged:

1. The questions you noted while exploring and drafting.
2. The questions the zero-context reviewer returned.
3. The gaps you find by walking your own plan: every place a ticket says
   "probably", "for now", "assume", or picks one of several options without
   saying why is a decision nobody made.

## Facts are yours, decisions are the user's

A question goes to the user only when it is a decision. A fact — what the
code does, what a table holds, whether an endpoint accepts a call, what a
library exposes, what a document says — is your job to find. Before a
question reaches the user:

1. **Is it already decided?** Read the decisions section. If an earlier
   answer settles it, or lets you infer it with confidence, decide it in the
   user's direction and log it as following from their answer. Asking twice
   is a failure.
2. **Can the codebase or an experiment answer it?** Then it is a fact.
   Dispatch a subagent or a cheap spike. Do not stop the interview while
   the lookup runs. Only the questions that depend on its answer wait. Ask
   the others now.
3. **Is it technical under the authority table?** Decide it, log it with the
   alternative, reason, and drawback.

What survives all three is a decision only the user can make. **If nothing
survives, there is no interview.** Say so in one line and move on. Never pad.

## The frontier, in rounds

The **frontier** is every unanswered decision whose prerequisites are
settled: the questions you can ask *now* without guessing at answers you have
not heard. A question whose answer depends on another question still open
belongs to a later round, not this one.

Work in rounds:

- Take the frontier. Order it so the decisions that unblock the most
  downstream decisions come first.
- Ask **at most four per round**, grouped by theme, through the harness's
  question tool when it has one (a multiple-choice prompt), or as numbered
  plain-text questions otherwise. When the frontier holds more than four,
  the rest wait for the next round; they are still frontier, not blocked.
- Wait for the answers. Fold each one into the plan as a decision (the
  user's), rewrite the sections it touches, delete the question.
- Each answer settles a decision and makes the questions that depended on
  it askable. Recompute the frontier and ask the next round.
- Stop when the frontier is empty: every branch visited, nothing left
  silently assumed.

## The shape of one question

Each question carries, in this order:

1. **The decision**, in one sentence, in plain words. Not "how should we
   handle `dropoff_enabled`?" but "Should the drop-off check be switched on
   for the three suppliers that are not checked today?"
2. **Why it is theirs**: the consequence a user or operator would notice,
   in one line. The user can answer away from their machine because the
   consequence is stated.
3. **The options**, each with its consequence in a clause. Two to four
   options. Include "something else" only when the space is genuinely open.
4. **Your recommendation**, marked as such, with the reason in a clause —
   **except for delivery shape**, which carries no recommendation (below).

A question with no stated consequence is really a fact you should look up,
or a question you have not finished thinking about. Rewrite it or answer it
yourself.

## Delivery shape: the one question with no recommendation

When the work is bigger than one small ticket, the frontier always holds:
*one pull request for all of it, or several?* State each trade in one
neutral line — one PR is a single review and a single merge; several are
smaller reviews and more coordination between them — and stop. Give no
recommendation, no default, no "most teams". Big tickets and big PRs are
legitimate; the user decides how they want to review their own work. If they
choose several, ask in the same round or the next how they want them cut
(by ticket, by subsystem, by dependency order), with a recommendation this
time, because the cut is a technical question once the shape is chosen.

## Fog: what you cannot yet phrase

Some unknowns are too dim to ask about: you can tell a decision is coming
but cannot state the question sharply because it hangs on an answer still
open. The test is whether you can **state the question precisely now**, not
whether you can answer it.

- Stated precisely → a question on the tree (blocked or frontier), a spike,
  or a ticket.
- Not yet → one line under *Not yet specified* in the plan's *Open
  questions* section: the area, and what it waits on. Turn the line into a
  question, a spike, or a ticket once the earlier answers arrive, and delete
  the line.

Do not pre-slice fog into questions. One patch may become three questions or
none once the answers ahead of it arrive.

## Out of scope is a decision too

When the interview rules something out — the user says "not this time", or a
reviewer finding is judged beyond the ask — it goes under *Out of scope* in
the plan with one line of why. Out-of-scope items never come back into this
plan; they return only as a new ask. Recording them keeps the adversarial
review from flagging their absence and keeps the user from wondering whether
they were forgotten.

## Manual work only the user can do

Some prerequisites are manual work only the user can do: sign up for a
service, grant access, provide a credential, move data so its shape can be
seen. These are not questions and not spikes. List them in the closing under
the decisions the user should know about, as a checklist with what each one
unblocks, and keep the dependent tickets in the plan with the prerequisite
named in *Depends on*.

## Never answer your own question

A question put to the user is answered by the user. Do not fill in a likely
answer and proceed, do not treat silence as consent, do not pick the
recommendation because the user is away. If a round is unanswered, the question
stays open in the plan and the closing says so. The one exception is a
question the decisions section already answers: that was never a question.

## Red flags — the interview is failing

- A question the user answered earlier, asked again in different words
- A question whose answer a subagent could read off the code
- A question with no consequence attached
- Two questions in one round where the second depends on the first
- A recommendation attached to the one-PR-or-several question
- A ticket that says "assume", "probably", or "for now" after the frontier
  is empty
- A round "answered" by the agent so it could keep going
- Six questions in one prompt because "they are all related"
