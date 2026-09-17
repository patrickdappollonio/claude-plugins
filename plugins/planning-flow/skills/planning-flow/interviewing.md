# Interviewing — resolving every uncertainty the user holds

The interview is where a plan stops being a guess. It makes sure nobody assumes a decision in silence. You visit every branch of the design. You find every fact. The user makes every decision.

## The design tree

Every plan is a tree of decisions. The root is the ask. Each decision branches into the decisions that only make sense once it is settled: "store the switch in the database" branches into "which table" and "what default", and "what default" branches into "what happens to suppliers added later". An interview that asks "what default?" before "database or config file?" makes the user answer a question that may not exist. Build the tree before asking anything.

Build it from three sources, merged:

1. The questions you noted while exploring and drafting.
2. The questions the zero-context reviewer returned.
3. The gaps you find by walking your own plan: every place a ticket says "probably", "for now", "assume", or picks one of several options without saying why is a decision nobody made.

## Facts are yours, decisions are the user's

A question goes to the user only when it is a decision. A fact — what the code does, what a table holds, whether an endpoint accepts a call, what a library exposes, what a document says — is your job to find. Before a question reaches the user:

1. **Is it already decided?** Read the decisions section. If an earlier answer settles it, or lets you infer it with confidence, decide it in the user's direction and log it as following from their answer. Asking twice is a failure.
2. **Can the codebase or an experiment answer it?** Then it is a fact. Dispatch a subagent or a cheap spike. Do not stop the interview while the lookup runs. Only the questions that depend on its answer wait. Ask the others now.
3. **Is it technical under the authority table?** Decide it, log it with the alternative, reason, and drawback.

What survives all three is a decision only the user can make. **If nothing survives, there is no interview.** Say so in one line and move on. Never pad.

## The frontier, one question at a time

The **frontier** is every unanswered decision whose prerequisites are settled: the questions you can ask *now* without guessing at answers you have not heard. A question whose answer depends on another question still open waits until that one is answered.

Work like this:

- Write **every** open question into the plan's *Open questions* section, in the shape `question-format.md` defines, frontier first, ordered so the decisions that unblock the most downstream decisions come first; a blocked question sits below the one it waits on and says so in its first sentence. The file always holds the whole list.
- Ask **one question per chat message**: the first frontier question, word for word as it stands in the file, under the position line. Never two, never the whole list, never through the harness's question tool — its fields have no room for the flow. When `visual-plan` is serving the file, the user may instead answer the question's fence there.
- Wait for the answer. Fold it into the plan as a decision (the user's), rewrite the sections it touches, delete the question, renumber the rest.
- Each answer settles a decision and makes the questions that depended on it askable. Recompute the frontier and ask the next one in the next message. There is no cap on how many rounds this takes.
- Stop when the frontier is empty: every branch visited, nothing left silently assumed.

## The shape of one question

Every question has the one shape in `question-format.md` — read that file before writing the first one. In short: a numbered heading one level below the section that holds it (`### Question <N> of <M> — <the claim>`), then four mandatory bold labels in this order, then *Your call* (a bold line, or a `question` fence when `visual-plan` is serving the file) — **The situation.** (what exists and what is unsettled, in plain words: not "how should we handle `dropoff_enabled`?" but "the drop-off check is not run for three suppliers, and the plan does not say whether it should be"), **The flow.** (three to five numbered steps, one or two when that is the whole story, more only when absolutely needed, walking the consumer of the code to the consequence they would notice, or `N/A` only when nobody would notice), **The fix.** (your recommendation, checked to work before you ask — **except for delivery shape**, which carries none, below), **Cost.** (what the fix costs, or `None`), and **Your call:** (the question in a few words, with the alternatives when there are any). Prose at most 200 words, 15 more for each flow step past the fifth.

A question whose flow has no consequence at its end is really a fact you should look up, or a question you have not finished thinking about. Rewrite it or answer it yourself.

## Delivery shape: the one question with no recommendation

When the work is bigger than one small ticket, the frontier always holds: *one pull request for all of it, or several?* State each trade in one neutral line — one PR is a single review and a single merge; several are smaller reviews and more coordination between them — and stop. Give no recommendation, no default, no "most teams". Big tickets and big PRs are legitimate; the user decides how they want to review their own work. In the template, **The fix.** holds the two trades and no pick. If they choose several, ask next how they want them cut (by ticket, by subsystem, by dependency order), with a recommendation this time, because the cut is a technical question once the shape is chosen.

## Fog: what you cannot yet phrase

Some unknowns are too dim to ask about: you can tell a decision is coming but cannot state the question sharply because it hangs on an answer still open. The test is whether you can **state the question precisely now**, not whether you can answer it.

- Stated precisely → a question on the tree (blocked or frontier), a spike, or a ticket.
- Not yet → one line under *Not yet specified* in the plan's *Open questions* section: the area, and what it waits on. Turn the line into a question, a spike, or a ticket once the earlier answers arrive, and delete the line.

Do not pre-slice fog into questions. One patch may become three questions or none once the answers ahead of it arrive.

## Out of scope is a decision too

When the interview rules something out — the user says "not this time", or a reviewer finding is judged beyond the ask — it goes under *Out of scope* in the plan with one line of why. Out-of-scope items never come back into this plan; they return only as a new ask. Recording them keeps the adversarial review from flagging their absence and keeps the user from wondering whether they were forgotten.

## Manual work only the user can do

Some prerequisites are manual work only the user can do: sign up for a service, grant access, provide a credential, move data so its shape can be seen. These are not questions and not spikes. List them in the closing under the decisions the user should know about, as a checklist with what each one unblocks, and keep the dependent tickets in the plan with the prerequisite named in *Depends on*.

## Every stop carries its one question, in full

A question is a stop: the run waits for the user. The user may not be at the keyboard, and under a goal loop (see below) the harness may re-prompt you several times before they return. Whatever message is last on their screen is the one they answer from. So every stop carries the **one** question it asks in full — heading, situation, flow, fix, cost, your call, exactly as the file has it — plus any command they must run or file they must send, written out in full, plus the count of other questions still open and the path (and URL, when served) of the file that holds them. Never "the question from two messages ago", "as asked above", or "the two commands in my earlier message". Repeating text you wrote before is the intended cost; the reader has the last message and nothing else. What a stop never carries is a second question: the rest wait in the file for their turn.

Open each stop with one line of position: `Step <n> of 13; <k> questions open; <what happens once they are answered>`. Steps are the numbered steps in `SKILL.md`; `k` counts every open question in the file. A user who comes back at a random moment reads that line and knows whether the plan is close.

### Under a goal loop

You are in a goal loop when the user said they set one, or the conversation holds a harness message beginning `A session-scoped Stop hook is now active with condition:` (Claude Code), a system prompt with an `<objective>` block that says `Continue working toward the active thread goal` (Codex), or a message beginning `Stop hook feedback:` or `Goal check-in:`. Assume the loop is on until the harness reports the goal cleared or paused. Neither harness tells you which stop will be the one the user reads, so every stop is written as if it is the last: the position line and the one question in full, never a shortened version.

Between stops, keep chat to one line: the position and the next action. Paragraphs written mid-run under a loop are never seen.

When the harness re-prompts and nothing has changed — the same questions are still open — send the **same message again, word for word**, with one line above it saying the goal check asked you to continue and the questions are unchanged. A run of shrinking "still waiting on your answers" replies buries the one message that held the questions. If the goal condition cannot be met without the user's answers, say so in that line and name the way out: `/goal clear` on Claude Code, or a reply that answers. On Codex, mark the goal `blocked` through `update_goal` at the third identical repeat, with the questions as the reason. Claude Code force-ends the turn after nine rejected stops; nine identical full messages is noisy, nine different one-liners is the failure this section prevents.

## Never answer your own question

A question put to the user is answered by the user. Do not fill in a likely answer and proceed, do not treat silence as consent, do not pick the recommendation because the user is away. If a round is unanswered, the question stays open in the plan and the closing says so. The one exception is a question the decisions section already answers: that was never a question.

## Red flags — the interview is failing

- A question the user answered earlier, asked again in different words
- A question whose answer a subagent could read off the code
- A question whose flow ends without a consequence
- A question missing a label, a number, or a numbered flow; a flow marked `N/A` when someone would notice the outcome
- Two questions in one chat message, or a question sent through the harness question tool
- A recommendation attached to the one-PR-or-several question
- A ticket that says "assume", "probably", or "for now" after the frontier is empty
- A question "answered" by the agent so it could keep going
- A stop that points at an earlier message instead of carrying its question in full
- A reply to a goal re-prompt that is shorter than the stop before it
