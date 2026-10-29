---
name: planning-flow-quick
description: >-
  Use when the user wants a quick plan for a small coding change — "quick plan", "plan this small fix", "/planning-flow-quick <ask>" — such as a renamed title, a corrected message, a one-function bug fix, or a small option, where the change still needs to follow the repository's patterns and name the tests it extends, but a full codebase map, parallel exploration, several reviews, and an interview tree would cost more than the work. Writes one short plan file with one ticket, settles unknowns with checks on the spot, asks only what the code cannot answer, and warns when the change has grown past what a quick plan handles, recommending the full `planning-flow` skill when it is installed.
---

# Planning Flow — Quick

## Overview

Turn a small request into **one short plan**: the change, where it goes, the pattern it copies, the tests it extends, and the decisions behind it. It is the lighter version of the `planning-flow` skill: it skips the full codebase map, the parallel exploration, the separate reviewers, the second opinion, and the delivery-shape question. It keeps the parts that stop a small change from going wrong: following the repository's patterns, extending the right tests, settling unknowns before they are built on, and leaving the user's decisions to the user.

A quick plan that stops being quick is the failure this skill watches for. The *Too big for a quick plan* section below names the signs, and each one gets a warning when it shows.

**These rules bind everything below:**

1. **The plan never describes its own earlier versions.** Every revision rewrites the file in place, so it reads as if written fresh today. The decisions section is the only memory: a choice, its alternative, and its reason. No "revisited", no "Edit:", no "after the check", no struck text.
2. **The reader has not seen the code.** A function, file, or variable name is a label for a thing you explain in plain words, never the explanation (`communication.md`).
3. **Technical direction is yours, logged; functional and operational direction is the user's, asked.** The test: if a reasonable user could say "I didn't want that", the decision is theirs. Output, wording, defaults, ordering, error behavior, what is stored and where, and how the thing is deployed or configured are the user's. A decision the user already made in chat is never asked again: log it with their words.
4. **Facts are yours to find; decisions are the user's to make.** Ask only what the codebase cannot answer, in the one shape in `question-format.md`, one question per chat message. Never answer a question you put to the user. A change may have no questions; do not invent them.
5. **The new code looks like the code around it.** The plan names the pattern the change follows and the closest existing example, and every acceptance criterion names the test it extends. A small change that ignores the repository's conventions is not small; someone pays for it in review.
6. **An unknown a check can settle is settled now, or you ask to settle it now.** If an answer would change the plan, run the check at once or ask permission at once (`verification.md`). Never write that something "could be tested" and move on. A quick plan that turns out impossible at implementation time saves nothing.
7. **The plan is a document, and it plans the simplest thing that works.** The deliverable is markdown. Probes are encouraged while planning and deleted before the plan is shown. Reuse what the codebase, the standard library, the platform, or an installed dependency has before planning new code. Never cut validation at a trust boundary, data-loss handling, security, or accessibility.
8. **Nothing an agent writes counts things that live elsewhere.** No "the 24 handlers", no "all seven tests": list them or state the rule that finds them. A number stays only when it is the fact: a limit the code enforces, a version, a size band.
9. **Every subagent is one-shot; more work is a new subagent.** Each subagent gets one self-contained prompt, returns its result, and ends. It never waits for a reply, for the user, or for your next instruction, and you never resume, message, or continue it (`SendMessage` in Claude Code, or the equivalent). A follow-up goes to a **new** subagent with everything it needs, the earlier result included. An idle subagent loses its prompt cache within minutes, so the next message re-reads its whole history at full price.
10. **Long commands keep a heartbeat no more than three minutes apart.** A command that may run past three minutes (a test suite, a build) starts in the background with output and exit code going to a log, `( <command>; echo "EXIT=$?" ) > <log> 2>&1 &`, and is checked with a foreground loop capped at three minutes, `for i in $(seq 18); do grep -q '^EXIT=' <log> && break; sleep 10; done; tail -n 3 <log>`, repeated until the log shows `EXIT=`. Never a bare `sleep`, never a monitor with no cap, never ending the run while the command is still going. Past about 40 minutes of expected wait, one cold restart is cheaper than the checks. Every prompt template in this skill ends with a line that says so. Waiting for a subagent's report is not a command: the harness tells you when it returns, so never loop, sleep, or poll for one.

## Read the Companion Files First

`SKILL.md` carries the rules and a summary of each step; the files beside it carry the full procedures:

- `area-map.md` — how to learn the patterns and tests around the change without mapping the whole repository: reusing a `planning-flow` codebase map, the two scoped explorers and their prompts, and where to stop reading
- `plan-template.md` — the short plan's skeleton, the one-ticket format, the decisions format, the lowest-rung ladder, and the timeless-prose rule
- `question-format.md` — the one shape every question takes, how to check its facts and its fix before asking, and one question per message
- `verification.md` — the three lanes for checks (run, run with a note, ask first), the permission request, probes, and spikes
- `plan-check.md` — the one check subagent that reads the plan cold and then against the code, and the fast review of the plan when the user picks it
- `communication.md` — writing for a reader who has not seen the code

**The first time you use this skill in a session, read every file in that list before doing anything else** — before exploring, before drafting, before answering a question about the ask. The summaries here remind a reader who has seen the full text; they are not a substitute. Re-read the named file at the step that names it. If a file is missing, say so and work from the summary.

Every other skill is optional. This skill works alone. When a companion skill is installed (`planning-flow`, `visual-plan`, `adversarial-review-fast`, `implement-plan`, `effective-communicator`), use it where a step names it. When it is not, keep going with what is here, and **never suggest installing anything** unless the user asks.

## When to Use

- The user asks for a quick plan, or invokes `/planning-flow-quick`, or asks for a plan for a change that fits one ticket: a renamed title, a corrected message, a small bug fix, a small new option, a test gap.

**When NOT to use:** the user asked for a full plan, or the ask already shows a sign from *Too big for a quick plan* — say so in one line and recommend `planning-flow` if installed (below). A plan already exists and the user wants it built: that is implementation. The user asked a question, not for a plan: answer it.

## Too big for a quick plan

Lines of code are **not** a sign. An agent writes five hundred lines it understands quickly; what makes a change slow and risky is how often the work must stop to decide or find out something. Check these signs after exploration (step 2), after every answer, and after the plan check (step 5):

**Any one of these is a sign:**

- **More than one ticket.** The work splits into parts that could ship or be reviewed apart, or into steps where one must land before another.
- **A second subsystem.** The change reaches a part of the codebase with its own owners, its own tests, or its own patterns beyond the one it started in.
- **A sensitive area.** The database schema or a migration, a stored file format, sign-in or permissions, work that runs at the same time as other work, a public API or another contract that other systems use, or a call to an outside service.
- **No pattern to follow.** The codebase has no example of this kind of thing, so the plan must invent a shape: a new kind of module, a new layer, a new way to configure or test something.
- **Many unknowns.** More than two unknowns that each need a check to settle, or one check whose answer would change the approach, not only a detail.
- **Many decisions.** More than three questions only the user can answer, or one answer that opens new questions of its own.
- **The plan does not converge.** The second plan check still finds a gap that would change what gets built.

**Not a sign on its own:** the line count, the number of files that change in the same way, or a new dependency. A small, well-known dependency (an ID generator, a small parsing library) is a question for the user (`plan-template.md`, *The ladder*), and it counts toward the decisions; a framework or a replacement for something the project already uses is a second subsystem.

**When a sign shows, warn at once, in one plain line naming the sign** ("This change touches the database schema, which is more than a quick plan handles well."), and then:

- **`planning-flow` installed** (it is in your harness's skill list): this is a stop. Save the plan file as it stands, recommend switching, say the file carries over, and wait for the answer; work done past this point would be redone by the full flow. On the user's yes, load the `planning-flow` skill and tell it the path of the quick plan file; it picks up from there and runs every step the quick flow did not. On a no, keep going and log the user's choice as a decision. A later **new** sign gets its own warning and its own recommendation.
- **`planning-flow` not installed:** this is never a stop. Warn in the next message you send anyway and keep going. Never suggest installing it, and never wait for it. Repeat the one-line warning each time a **new** sign shows, and list every sign that showed under *Gotchas and caveats* in the plan and in the closing, so the user knows where the quick plan is thinnest.

A warning never becomes a numbered question: switching is not a trade-off in the plan, it is a choice of tool. The recommendation to switch is one plain line and a yes-or-no.

## Where the Plan Lives

One markdown file, the single source of truth. The first line of the file is `<!-- planning-flow-quick -->`, so `planning-flow` and `implement-plan` can tell a quick plan from a full one.

- **The session started in plan mode:** the harness plan file is the plan. Write nothing else.
- **Inside a git repository:** `.plans/<task-name>.md` under the repo root. If `.plans/` holds files that are not plans, use `.planning-flow/`. Keep the folder out of the diff by appending its name to the file `git rev-parse --git-path info/exclude` prints (create it if missing; skip if the line is there). Never touch `.gitignore`.
- **Not a git repository:** the scratchpad or temp directory your harness gives you; tell the user the path.

Name the file after the task in short kebab-case: "fix the title on the settings page" becomes `fix-settings-page-title.md`. Start fresh for every new ask.

## The Process

Do every step in order. Between steps, keep chat to one-line status notes. Every stop that asks the user something opens with `Step <n> of 7; <k> questions open` and carries its one question in full, never a pointer to an earlier message. Under a goal loop (the user said so, or the conversation holds `A session-scoped Stop hook is now active`, `Stop hook feedback:`, `Goal check-in:`, or a Codex `<objective>` block), every stop is the last message the user reads; a re-prompt with nothing changed gets the same message again, word for word.

### 1. Capture the ask

Write the plan's *The ask* section: the task in one sentence (what is to be fixed, built, or changed, and for whom), then each message of the user's that states the task, a constraint, or a non-goal, quoted verbatim. Never the request for a plan ("plan this", the command that loaded the skill). If you cannot tell what "this" points at, ask in one plain line before exploring.

### 2. Learn the area around the change

Read `area-map.md`. Look for a codebase map from `planning-flow` (`codebase-map.md` in `.plans/` or `.planning-flow/`). When one exists, use its sections for the area the change touches, and confirm every fact you copy against the current code; never build or refresh the map yourself. When none exists, do not map the repository. **When the area is small** — the files the change touches, their neighbors, their tests, and the instructions files come to about ten files you can read in a few calls — read them yourself and answer the two questions below; two subagents cost more than the reading. **Otherwise** dispatch **two scoped explorers** on the cheaper tier, in one message.

- **Patterns.** Where the change goes, the closest existing example of each thing it creates or modifies, the conventions in that area (naming, error handling, how strings and messages are written, how it is wired in), and the repository's own rules from its instructions files.
- **Tests.** How tests run (exact commands), which existing tests exercise each surface the change touches, what each does (setup, action, assertion), and where a new case would go.

Each explorer reads the files the change touches, their neighbors in the same directory or module, their tests, and the repository's instructions files, and stops there unless a fact sends it further. Each returns facts with `path:line` evidence. You read the evidence, not the conclusions. Then check the signs in *Too big for a quick plan*.

### 3. Draft the plan

Read `plan-template.md`. Write the short skeleton: the ask, summary, technical context, one ticket, decisions, gotchas and caveats, open questions. *Technical context* holds the values the implementer needs (exact strings, the pattern with its example, the tests to extend, the commands), never a pointer to where they live. Every acceptance criterion ends with `— extends <test file> <TestName>`, or `— new test: <reason>` only when no existing test on that surface performs 60% or more of the new test's setup and action steps. Log each decision as you make it.

**Then hold every edit against the rules.** *Technical context* lists the repository's rules and the conventions that bind each file the ticket touches. Check every edit in the ticket's *What* against that list, one by one. An edit that would break a rule is rewritten to follow it. An edit that touches a line already breaking a rule (a hard-coded string where the rules say strings live in one place) follows the rule in its new form, or the plan says why it cannot.

Every unknown goes through rule 6 as you write it: read `verification.md`, then run the check or put a permission request on the question list. When a check settles something, the plan states the result and the decisions section says how it was measured. A spike ticket exists only when the user defers or declines a check, or this session cannot run it.

Then walk the plan once with the ladder in `plan-template.md`: for each part, would the goal still be met without it? If yes, cut it; if no, put it on the lowest rung that holds. Log every cut.

### 4. Ask what only the user can answer

Read `question-format.md`. Remove from the question list anything the user's own messages already answer (decide it their way and log it), anything the code or a check can answer (it is a fact; find it), and anything technical (decide it and log it). If nothing remains, say so in one line and go on.

Write every remaining question into the plan's *Open questions* section in the one shape: `### Question <N> of <M> — <the claim>`, **The situation.**, **The flow.** (numbered steps to the consequence someone would notice), **The fix.**, **Cost.**, *Your call*, prose at most 200 words. Check each question's facts and fix before asking. Ask **in chat, one per message**, word for word from the file, never through the harness's question tool, and never two at once. Open your reply to each answer by saying back, in one plain sentence, what it means for the plan, then your take when it was not your recommendation; say it before any command, file read, or edit, and say what a check is about before you run it, because harnesses fold tool calls into one line and a turn that opens with tools looks like silence. A concern is checked first, as far as `verification.md` allows without a yes; when it holds, it keeps the question open with a short *Your call* aimed at solving it. Raise it once; after that the user's word stands. No labels such as "My take:". Then fold the answer in as a decision (theirs), rewrite the sections it touches, delete the question, and check the signs again before asking the next one. Only a direct accept, reject, or different direction closes a question.

### 5. Check the plan with one fresh subagent

Read `plan-check.md`. **No check runs while a pending check could change the ticket**: wait for it, or for the user's answer to its permission request. Then dispatch **one** fresh subagent, on a different model family from yours when the harness offers one and on the most capable tier otherwise, with only: *The ask* section, the plan file, the repository path, and the decisions you made on the user's behalf (each with its alternative, and no argument for it), told to ignore the plan folder. It reads the plan cold first (could it start building from the text alone, and what would it still have to go and find?), then opens the repository and tries to prove the plan wrong: false claims about the code, missing cases, a pattern the plan does not follow, a test it should extend, and any decision you logged that changes what a user would notice.

Fold the result in. A fix that keeps the plan doing what the ask wants is yours: rewrite it in and log it. A finding that changes what a user or consumer would notice goes on the question list (step 4). A gap that would change what gets built is filled with the exact value. When a gap was filled or a fact corrected, run the check **once more** with a new subagent given the rewritten plan. If that second check still finds a gap that would change what gets built, the plan does not converge: that is a sign (*Too big for a quick plan*).

### 6. Present the plan

Choose the viewer: the `visual-plan` skill when installed (tell it the audience is technical, so its write-for-a-non-developer rule and its warnings about code names in prose do not apply), the harness's plan mode otherwise, or the path and the closing in chat. The file stays the source of truth.

In the same message, list any check the user deferred and ask whether to run it now. Offer **one** plan review in one plain line: **fast or none**, with your recommendation (none, unless a decision you made on the user's behalf changes behavior they might not expect). Run it only on a yes, as `plan-check.md` describes: the installed `adversarial-review-fast` skill, or the one-reviewer version when it is not installed. Fold its findings in as step 5 does. No second review.

### 7. Close

When nothing is open, send the closing. Asking for approval is not a question: no numbered heading, no situation, no *Your call*.

## Closing

Exactly this shape, short:

- **Where the plan is** — the path (and the URL when served).
- **What it does** — two or three plain sentences: the problem, and the change that fixes it.
- **Does it cover the ask** — one line, measured against *The ask*.
- **Gotchas and caveats** — the ones that survived, each a line, including every sign from *Too big for a quick plan* that showed.
- **Decisions you should know about** — the ones you made on the user's behalf that they might want to reverse, each in one line, and every manual step only they can do, written out in full.

Never: how many revisions there were, what the check said, what changed since the draft.

Then ask, in plain text in the same message, whether to start implementing: one line. The change is one ticket, so it can be made directly in this session; name `implement-plan` as the other option when it is installed. Under that line, give a one-line `/goal` with the plan's real path:

```text
/goal Implement .plans/<file>.md; done when the ticket's acceptance criteria pass.
```

Add `with implement-plan` after the path only when it is installed. The goal names the file and the finish line and nothing more: never the ticket's content, test names, a commit count, or a pull request.

## Rationalizations — Observed, and Wrong

| Excuse | Reality |
|---|---|
| "It's a one-line change, I don't need to look at patterns" | A one-line change in the wrong style, or with no test, is a review comment and a second round. The scoped explorers cost two cheap subagents. |
| "The skill says explorers, so I'll send them for a five-file area" | A small area is read directly; explorers are for an area too big to read in a few calls. |
| "No map exists, so I'll map the repository first" | That is `planning-flow`'s step 0. Read the area the change touches, its neighbors, its tests, and the repository's rules; stop there. |
| "The map exists, so I'll trust it" | Use it as a starting point. Every fact copied into the plan is confirmed against the current code. |
| "The change is small, so the unknown can wait for implementation" | Implementation finds out after the plan was built on the guess. Run the check, or ask to, now. |
| "It's 400 lines, so it's too big for a quick plan" | Lines are not a sign. Stops are: tickets, subsystems, sensitive areas, unknowns, decisions, a missing pattern. |
| "It needs a new dependency, so it's a big change" | A small, well-known dependency is one question for the user. A framework, or a replacement for one the project uses, is a second subsystem. |
| "A sign showed, but switching feels like overkill" | Warn anyway, in one line. The user decides; you never decide silently. |
| "I'll keep drafting while the user decides whether to switch" | With `planning-flow` installed, the switch is a stop: the full flow would redo the work. |
| "I'll poll until the explorers report" | A subagent's report arrives by notification. The capped wait loop is for slow commands only. |
| "`planning-flow` isn't installed, so I'll suggest installing it" | Never. Warn, keep going, and list the signs under caveats. |
| "The user said no to switching, so I'll stop warning" | Their no covers the signs that had shown. A new sign gets its own one-line warning. |
| "The check is cheap, I'll message the same subagent with the fixes" | A re-check is a new subagent with the rewritten plan. The old one has read the old text and its cache has expired. |
| "Three questions in one message is faster" | One per message. The file holds them all; the chat asks one, waits, asks the next. |
| "The user is away, so I'll take my recommendation" | A question put to the user is answered by the user. |
| "A fast review is cheap, I'll run it without asking" | Offer fast or none in one line; run it only on a yes. |
| "I remember this skill, no need to open the companion files" | The summaries are reminders. Read the files. |

## Red Flags — Stop and Re-read the Step

- A plan with no named pattern or closest example for the code it changes, or an acceptance criterion with no test clause
- A full repository map built or refreshed by this skill, or explorers reading past the area of the change with no fact that sent them there
- A ticket edit that writes or keeps something the repository's rules forbid, such as a user-facing string typed inline where the rules keep strings in one place
- *Technical context* that says "see the map" or "follow the existing pattern" without stating the pattern and its example
- A sentence saying something "could be tested" or "is worth checking", with no result and no permission request
- A network call, browser action, shared-service call, install, or read outside the working directory made without a yes
- A sign from *Too big for a quick plan* that showed with no warning, a warning that suggested installing `planning-flow`, or a flow that stopped to wait for an install
- A warning turned into a numbered question
- A line count used as a sign
- More than one ticket in a plan that is still being called quick, with no warning given
- Two questions in one chat message, a question through the harness question tool, or a question the agent answered itself
- A reply to an answer that opens with a command or a file read, or records the answer with no sentence saying back what it means
- A question the user's earlier words already answer
- A subagent resumed, messaged, or continued after it returned; a prompt template without the one-shot line and the heartbeat
- A plan review run without the user choosing it, or a second one
- A heading or sentence that describes an earlier draft ("revised", "updated", "after the check")
- A file other than the plan left behind: a probe, a mockup, a scaffold
- A plan file whose first line is not `<!-- planning-flow-quick -->`
- Reaching the closing without having read the companion files this session

## Checklist

Create a todo per item.

- [ ] Read every companion file (first use in this session)
- [ ] *The ask* holds the task in one sentence and the user's words, verbatim; the request for a plan is nowhere in it
- [ ] Area learned: an existing codebase map used and its facts confirmed against the code, a small area read directly, or the two scoped explorers run in one message; pattern, closest example, and covering tests found for every surface the change touches
- [ ] Signs from *Too big for a quick plan* checked after exploration, after every answer, and after the plan check; each new sign warned about in one line, with `planning-flow` recommended only when installed
- [ ] Draft written to the short skeleton, first line `<!-- planning-flow-quick -->`; every acceptance criterion names the test it extends or says why it needs a new one
- [ ] Every unknown that would change the plan checked when found, or asked for in the `verification.md` shape; nothing left behind but the plan
- [ ] Ladder walked once over the draft; every cut logged
- [ ] Questions filtered, written in the `question-format.md` shape, and asked one per message until none is open
- [ ] One fresh plan check run with the ask, the plan, and the repository; findings folded in; at most one re-check, by a new subagent
- [ ] Every subagent one-shot, every prompt ending with the single-task and heartbeat line
- [ ] Plan presented; deferred checks offered; fast-or-none review offered in one line and run only on a yes
- [ ] Closing sent in the five-bullet shape, ending with one plain line asking whether to implement and a one-line `/goal`
