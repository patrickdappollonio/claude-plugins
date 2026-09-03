---
name: planning-flow
description: Use when the user asks for a plan for a coding change — "plan this", "how would we build", "write me a plan for", "/planning-flow <ask>" — before any code is written, especially when the change needs research across a codebase, has open questions only the user can answer, or will be handed to an implementation step afterwards. Also use when a user complains that a previous plan read like a change-log of its own revisions.
---

# Planning Flow

## Overview

Turn a request into **one plan**: the current, complete answer to the user's
ask, with the decisions that shaped it and the caveats that remain. The
process behind it — parallel exploration, a zero-context review, rounds of
questions, spikes, an adversarial review — exists to make the plan right. None
of it belongs in the plan or in the message that delivers it.

**Four rules bind everything below:**

1. **The plan never describes its own earlier versions.** Every revision
   rewrites the file in place so it reads as if written fresh today. The only
   record of the past is the decisions section, where you record a choice
   with its alternative and its reason. No "revisited", no "Edit:", no "after
   the review", no struck text, no revision headings, and no reviewer tally
   in chat.
2. **The reader has not seen the code.** You read hundreds of lines; the user
   read none. A function, file, or variable name is a label for a thing you
   must explain in plain words, never the explanation. Full rules in
   `communication.md`.
3. **Technical direction is yours, logged; functional and operational
   direction is the user's, asked.** The authority table below decides which
   is which, and a decision the user already made is never asked again.
4. **Facts are yours to find; decisions are the user's to make.** Find the
   facts yourself. Ask the user only what the codebase cannot answer. Ask in
   rounds: each round holds only the questions whose earlier questions are
   already answered. Never answer a question you put to the user. A change
   can be so simple that there are no questions; do not invent them.

## Read the Companion Files First

This skill ships in two layers. `SKILL.md` carries the rules and a summary of
each step; six files beside it carry the full procedures:

- `plan-template.md` — the plan file skeleton, the ticket format, the decisions entry format, the size bands, and the timeless-prose rule with examples
- `communication.md` — how to write for a reader who has not seen the code: the identifier rule, Simplified Technical English (ASD-STE100), outcome-first messages
- `interviewing.md` — the design tree, the frontier, rounds, the shape of a question, fog, out of scope, and the rule never to answer your own question
- `plan-review.md` — the zero-context reviewer, the adversarial review of a plan (installed skills or an on-the-spot panel), the sizing rule, and how to run a spike
- `model-routing.md` — which tier explores, which tier reviews, the model names, and what to do when the harness cannot choose
- `companion-skills.md` — what `visual-plan`, `adversarial-review`, `adversarial-review-quick`, and `implement-plan` add when installed, and the install lines to give only when asked

**The first time you use this skill in a session, read all six before doing
anything else** — before exploring, before drafting, before answering a
question about the ask. The summaries here remind a reader who has already
seen the full text; they are not a substitute for it. Re-read the named file
at the step that names it. If a file is missing, say so and work from the
summary — do not pretend the summary was the whole skill.

Every companion skill is optional. This skill works alone. When one is
installed, use it; when it is not, use the distilled version here and never
suggest installing anything unless the user asks.

## When to Use

- The user asks for a plan, a design, an approach, or "how would we do X"
  for a coding change, and no plan exists yet.
- The user invokes `/planning-flow` with their ask and context.

**When NOT to use:**

- A plan already exists and the user wants it built. That is implementation;
  point at the `implement-plan` skill if installed, or the harness's own
  execution, and stop.
- The user asked a question, not for a plan. Answer it.

## Two Authorities

| Yours (technical) — decide, then log it | The user's (functional / operational) — ask, never assume |
|---|---|
| Data structure, algorithm, file layout, naming, error type | What the user sees: output format, wording, new flags or syntax, defaults |
| Which existing pattern to follow; how to isolate a test | Whether a behavior the ask left open should exist at all |
| How to close a gap the review found, when the fix is invisible to users | Anything that changes an API, a schema, a stored format, a cost, a deployment |
| Order of tickets, what is a spike | One pull request or several (see *Delivery shape*) |
| Keeping a detail the user specified when it seems awkward | Deviating from what the user asked for — even to "improve" it |

**The test:** if a reasonable user could say "I didn't want that", the
decision is theirs. Trace the consequence of every technical choice before
you make it. The choice belongs to the user if it changes output, ordering,
timing, defaults, error behavior, or what is stored and where. It also
belongs to the user if it changes how the thing is deployed, configured,
monitored, or paid for. This holds even when the choice looks like an
implementation detail. Log your decisions in the plan's decisions section
with the alternative, the reason, and any drawback. Park theirs as questions.

**Never ask a question the user has already answered.** Before asking anything, read the decisions
section. If an earlier answer settles the question, or lets you infer the
answer with confidence, decide it yourself in the direction the user already
chose, and log it as a decision that follows from theirs. Asking twice is the
failure this rule prevents.

## Where the Plan Lives

The plan is one markdown file, and the file is the single source of truth.
Viewers (plan mode, a visual plan) show the file's content; they never hold
content the file lacks.

- **The session started in plan mode** (the harness told you writes are limited
  to its own plan file): the harness plan file *is* the plan. Write nothing
  else. Everything below still applies to its content.
- **Otherwise, inside a git repository:** write to `.plans/<task-name>.md`
  under the repo root. If `.plans/` already exists and holds files that are
  not plans from this skill, use `.planning-flow/` instead. Keep the folder
  out of the diff by appending its name to the repository's local exclude
  file, which is never committed and never touches the user's `.gitignore`:
  ```
  git rev-parse --git-path info/exclude
  ```
  prints the file to append to (create it if missing; skip the line if it is
  already there). If the user says they want the plan committed, remove the
  line and tell them.
- **Not a git repository:** write to the scratchpad or temp directory your
  harness gives you, and tell the user the path.

Name the file after the task in kebab-case, short and without filler words:
"add rate limiting to the public API" becomes `add-api-rate-limiting.md`.
Start fresh for every new ask;
only revise an existing file when the user points you at it and it describes
this change.

## The Process

Do every step in order. Read the named file at its step. Between steps, keep
chat to one-line status notes; the plan is where the tokens go.

### 1. Acknowledge, then capture the ask

Reply with one short sentence that acknowledges the request and says you are
exploring. Then copy the user's ask **verbatim** into the plan file's *The
ask* section — the words they typed, not your paraphrase. The reviewer in
step 4 and the final self-check both measure against these words.

### 2. Explore in parallel

Read `model-routing.md`, the file that says which model tier runs each
role. Dispatch exploration subagents on the cheaper tier,
in one message, each with one bounded question: where does the affected
behavior live, what tests cover it, what documents describe it, what does the
data look like, what do the existing patterns look like, what external
dependencies are involved. Each subagent returns facts with file paths as
evidence. You keep the synthesis. Do not explore serially, and do not do the
bulk reading yourself when a subagent can.

### 3. Draft the plan

Read `plan-template.md`, the file that defines the plan's shape. Write the
full skeleton, in the template's order: the ask, summary, the problem, the
solution, technical context, tickets, decisions, gotchas and caveats, out of
scope, open questions with its "not yet specified" list. Write tickets in
the format below. Write every decision you made
while drafting into the decisions section as you make it. List what you do
not know as either an open question (the user must answer) or a spike ticket
(the codebase or an experiment can answer).

### 4. Zero-context review and cold implementer check

Read `plan-review.md`, the file that defines every review this skill runs.
Dispatch two fresh subagents in one message, neither with conversation
history, reassurance, or a list of what you already checked.

- **The zero-context reviewer**, on the most capable tier your harness
  offers, with exactly three things: the user's ask verbatim, the plan file,
  and access to the codebase. Its charter: assume the plan fails the ask and
  prove it — gaps, wrong premises, missing cases, questions the user must
  answer, things the plan asserts about the code that are not true. It
  returns findings and candidate questions.
- **The cold implementer**, on a different model family from yours when the
  harness offers one (a Codex agent, for example) and on the cheaper tier
  otherwise, with the ask and the plan's *Technical context* and *Tickets*
  sections only, and no repository access at first. Its charter: restate the
  challenge, grade whether it could start implementing from this text alone,
  and list every exact string, format, path, convention, command, and
  location it would still have to go and find. Then it opens the repository
  and reports what the text got wrong. Every item on its list that would
  change what gets built is a gap in *Technical context*; fill each one with
  the exact value, and run the check again until the list holds nothing of
  that kind. An implementer still opens the file it edits; the surrounding
  text of an insertion point is not a gap.

The reviewer finds what the plan gets wrong. The implementer finds what the
plan leaves out. A plan that passes only the first is correct and
unimplementable.

### 5. Build the design tree, then filter it

Read `interviewing.md`, the file that defines how questions are found,
filtered, and asked. There is **one** question list for the whole flow,
whatever the source: your own notes, the zero-context reviewer, the
adversarial review, spike results, a walk through your own plan for every
"assume", "probably", and "for now". Arrange it as a design tree: each
decision under the decision it depends on. Then remove from it, in order:

1. Anything the decisions section already answers or implies (rule 3) —
   decide it in the user's direction and log it as following from theirs.
2. Anything the codebase or an experiment can answer — it is a fact, not a
   decision; dispatch a subagent or a spike and let only the questions
   downstream of it wait.
3. Anything technical under the authority table — decide it, log it.

What remains is what only the user can answer. **If nothing remains, say so
in one line and skip step 6.** Never pad the list.

### 6. Ask the frontier, in rounds

The frontier is every unanswered decision whose prerequisites are settled.
Ask it in rounds of at most **four**, grouped by theme, the decisions that
unblock the most others first, through the harness's question tool (a
multiple-choice prompt where available; numbered plain text otherwise). Each
question has four parts. The decision, in plain words. Why it is the user's:
the consequence they would notice. Two to four options, each with its
consequence. Your recommendation. A question that depends on one still
open waits for a later round. After each round, fold the answers in (step
7), recompute the frontier, and ask again; stop when it is empty. **Never
answer your own question**: no likely answer filled in, no silence taken as
consent.

**Delivery shape is always on the frontier when the work is bigger than one
small ticket:** one pull request for everything, or several. State the trade
in one neutral line each — one PR is a single review and a single merge;
several are smaller reviews and more coordination — and **give no
recommendation**. Large tickets and large PRs are legitimate; writing code is
cheap now and the user decides how they want to review it. Never nudge
toward splitting.

### 7. Rewrite the plan in place

After every round of answers, review findings, or spike results: rewrite the
affected sections so the file reads as one plan written today. Record each
user answer as a decision (theirs), each technical choice you made as a
decision (yours, with drawback), and delete the answered question. A resolved
spike disappears as a ticket: its answer goes into the decisions section and
into the tickets it affected. A ticket a review removed disappears; the
reason it went lives in the decisions section. Re-read the changed sections
against the timeless-prose rule in `plan-template.md` before moving on.

### 8. Present the plan

Read `companion-skills.md`, the file that says what each optional skill
adds. Choose the viewer:

- **`visual-plan` skill installed:** use it to render and serve the file.
  Tell it, and yourself, that **the audience for this document is technical**:
  its rule to write for a non-developer does not apply, and its linter's
  warnings about code symbols in prose are expected and may stay. Every other
  part of it applies, including its own no-change-log rule.
- **No `visual-plan`, harness has a plan mode:** present through it with the
  file's content, unchanged. Enter plan mode only for the presentation.
- **Neither:** give the path and a summary in chat, in the shape under
  *Closing*.

The file stays the source of truth; when a viewer collects comments or
answers, fold them into the file.

### 9. Offer the review and the cheap spikes

In the same message that presents the plan, offer two things in plain text.
The user may decline either.

- **An adversarial review of the plan.** Size it with the table in
  `plan-review.md`. A change inside one subsystem gets the quick review, as
  long as it does not touch the database schema, sign-in and permissions,
  work that runs at the same time, or an outside service. Anything else gets
  the full one. Run the installed `adversarial-review-quick` or
  `adversarial-review` skill when present. Give it the plan file as the
  change under review; a new plan file is all added lines, which is what the
  skill expects. Give it **the user's ask, word for word, as the standard the
  plan must meet**. Neither installed: run the on-the-spot panel from
  `plan-review.md`.
- **The cheap spikes.** List every spike ticket a subagent could close
  quickly — a sanity check on an endpoint, whether a library supports a
  call, whether a path exists — and ask whether to run them now.

### 10. Fold in what came back

Review findings and spike results go through the authority table. A finding
whose fix leaves behavior unchanged: apply it and log it as your decision
with the reason and any drawback. A finding that changes what the user or an
operator would experience, and any `design_is_wrong` finding: add it to the
one question list with the reviewer's suggestion as the recommendation, and
run it through the same filter and frontier as every other question (steps 5
and 6). A spike answer: fold it in as step 7 describes. Rewrite in place.
Never write "the review found" anywhere in the plan.

### 11. Ask the leftovers, then close

Recompute the frontier after step 10 and run step 6 until it is empty. When
nothing is open and the user says the plan is approved, close as below.

## Closing

The closing message is the plan, not its history. Exactly this shape, short:

- **Where the plan is** — the path (and the URL when served).
- **What it does** — two or three plain sentences: the problem, and how the
  plan solves it.
- **Does it cover the ask** — one line, measured against the verbatim ask.
- **Gotchas and caveats** — the ones that survived, each a line.
- **Decisions you should know about** — the ones you made on the user's
  behalf that they might want to reverse, each with a line of reason.

Never: how many revisions there were, what reviewers said, what changed since
the draft.

Then ask, **in plain text in the same message, never through a question
tool**: whether they want to start implementing. When the `implement-plan`
skill is installed, say it will pick this file up and name it as the
recommended next step. When it is not, say the plan file is ready for
whichever implementation step they prefer. Plain text lets them answer with
any skill or command they have.

## Tickets

Every unit of work is a ticket in **exactly** this format (full detail and an
example in `plan-template.md`):

```markdown
## <Title>

**What.** …

**Why.** …

### Acceptance Criteria
* …

**Depends on.** <other ticket titles, or "nothing">

**Size.** <XS | S | M | L | XL | XXL>
```

- **Title** — a plain imperative phrase. Spikes start with `Spike:`. **No
  ticket numbers, codes, or identifiers** — tickets are referenced by title.
  A quantity that is part of the work ("batches of 500") is fine; "#4",
  "PF-12", or "Ticket 3" is not.
  A numbered ticket ends up in the code as a `// see ticket 4` or
  `// PF-12: …` comment, which explains a past decision instead of the line
  under it. A title never ends up in a code comment.
- **What** — may be technical, and may span paragraphs. Every file, function,
  or symbol it names is explained in the same sentence in plain words; a
  reader who has never opened the repository must follow it. Prefer "the
  code that decides whether a supplier is switched on" to a bare name.
- **Why** — Simplified Technical English (ASD-STE100): short active-voice
  sentences, one idea each, common words, no unexplained jargon. What is
  wrong today, what is true when this ticket is done, and who benefits.
- **Acceptance criteria** — observable checks a reviewer can run. For a spike,
  the criteria are the questions it must answer.
- **Depends on** — titles only.
- **Size** — a guess at lines of code touched, never time. Bands, in lines:
  XS under 200, S 200 to 750, M 750 to 1500, L 1500 to 4500, XL 4500 to
  6000, XXL over 6000. Every band is legitimate; a large ticket is not a
  defect and is not split unless the user asks.

## Rationalizations — Observed, and Wrong

| Excuse | Reality |
|---|---|
| "I'll add an *Update* section so the user can see what changed" | The user asked for the plan, not its diff. Rewrite the section. The decisions log is the only memory. |
| "Keeping the old paragraph with a note is faster" | Faster to write, unreadable to read. In place, always. |
| "The reviewer found seven issues; the user should know" | They should know the plan is sound. Fold in the fixes, log the decisions, present the plan. |
| "The reader is technical, so function names are fine" | Technical is not the same as having read the code. Name it and explain it in the same sentence. |
| "I'll number the tickets so dependencies are easier to write" | Titles do the same job and never end up in a code comment. |
| "Three questions in one prompt is faster than six rounds" | Three related questions in one round is the design. Six unrelated ones is a wall. Group by theme, four at most. |
| "I'll ask the default and the table in the same round to save a trip" | The default depends on the table. A question whose prerequisite is open belongs to the next round. |
| "The user is away, so I'll take my recommendation as their answer" | A question put to the user is answered by the user. The question stays open in the plan until they answer it. |
| "I can't phrase it sharply yet, so I'll skip it" | Write the unclear area under *Not yet specified*. Turn it into a real question once the questions ahead of it are answered. |
| "The user answered something close to this earlier" | Close enough is decided. Decide it in their direction and log it as following from their answer. |
| "This decision is technical, so it's mine" | Only while its effect stays invisible. Trace the consequence first. |
| "Several PRs is best practice, I'll recommend it" | Delivery shape is the user's, with no recommendation. State both trades neutrally. |
| "This ticket is 5,000 lines, I should split it" | XXL is a band, not an error. Split only when the user asks. |
| "I'll leave the resolved spike ticket so the work is visible" | The answer is the work. It lives in decisions and in the tickets it changed. |
| "The change is small, so I'll skip the zero-context reviewer" | Small changes get the same one reviewer; it is one subagent. Nothing gets no review. |
| "The technical context names the files; the implementer can read them" | Then the implementer explores, and the plan did not do its job. Every exact string, format, and location goes in the plan. The cold implementer check is how you know. |
| "The implementer graded it 3 out of 5, that's a pass" | A pass is a list with nothing on it that would change what gets built. Fill those gaps and run it again. |
| "The implementer wants every file's surrounding text pasted in" | That is what the implementer reads at edit time. A gap is a fact that changes the build: a string, a format, a rule, a location. Verbatim file contents are not. |
| "I'll suggest they install the visual plan, it's better" | Never suggest installing a companion skill. Use what is installed; give install lines only when asked. |
| "I'll use the question tool for the implement offer" | The offer is plain text so the user can answer with any skill they have. |
| "I remember this skill, no need to open the companion files" | The summaries are reminders. Read the files. |

## Red Flags — Stop and Re-read the Step

- Any heading or sentence in the plan containing a word from the delete
  table in `plan-template.md`: "revisited", "updated", "revised",
  "corrected", "previously", "as clarified", "as discussed", "after the
  review", "the reviewer noted", "Edit:", "Update:"
- A struck-through line, a "for context" section, or a superseded paragraph
  kept beside its replacement
- A ticket with a number, code, or identifier in its title
- A sentence in *What* or *Why* that dies when its identifier is deleted
- A question on the list that the decisions section already answers
- A question on the list that a subagent could answer from the codebase
- Two questions in one round where the second depends on the first
- A question the agent answered itself to keep going
- A recommendation attached to the one-pull-request-or-several question
- A ticket split because it "felt too big" with no user request
- A *Technical context* section that names a file without saying what is in it, or a format without its exact strings
- A cold implementer check that was run once and its list not folded in
- A closing message that counts revisions or quotes reviewers
- The implementation offer made through a question tool
- Reaching the closing without having read the companion files this session

## Checklist

Create a todo per item.

- [ ] Read all six companion files (first use in this session)
- [ ] Plan location chosen; ask copied verbatim into the file
- [ ] Exploration subagents dispatched in parallel on the cheaper tier
- [ ] Draft written to the full skeleton; decisions logged as made
- [ ] Zero-context reviewer run on the most capable tier with only the ask, the plan, and the codebase
- [ ] Cold implementer check run on a different model family where possible; every gap that would change what gets built filled with the exact value; re-run until none of that kind remain
- [ ] One question list from every source, arranged as a design tree, then filtered: decided, answerable by code, technical
- [ ] Frontier asked in rounds of at most four until empty; delivery shape included without a recommendation; no question answered by the agent
- [ ] Plan rewritten in place after every round; spikes and dropped tickets folded into decisions
- [ ] Presented through `visual-plan` (technical audience stated), plan mode, or chat
- [ ] Adversarial review offered and sized; cheap spikes offered
- [ ] Results folded in by the authority table; nothing narrated
- [ ] Leftover questions asked; approval received
- [ ] Closing in the five-bullet shape; implementation offered in plain text, `implement-plan` named when installed
