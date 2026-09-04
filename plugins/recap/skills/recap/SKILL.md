---
name: recap
description: Use when a person asks for a recap, summary, TLDR, wrap-up, status, or "what did we do" at the end of a session or a stretch of agentic work, or when handing a session's result to someone who was not watching it. Also use when the last message of a long session is about to be a long report of everything that happened.
---

# Recap

## Core principle

**The reader wants the result, not the journey.** They asked for something at
the start of the session. The recap tells them four things. Did they get it?
What does it look like from their side? What changed that they did not ask
for? What can only they decide? Everything else is the agent's story: every
detour, every test edited and reverted, every unrelated fix that made the
tests pass again, every idea considered and dropped, every statement made
and later corrected. The reader did not live it and does not need it.

**The reader is a person, not a context window.** Every sentence in a recap
is something they must hold in their head. A sentence that changes nothing
they know, decide, or watch for is a cost with no return. That is why the
recap carries only the final state and never the corrections that led to
it. If the session said something, found it was wrong, and fixed it, the
recap contains the fixed version and nothing about the fixing.

**Except the choices that stayed.** Whenever the session decided something
the reader might have decided differently, and that choice is now part of
the result, the recap names it. A silent decision is how the next step of
the work gets built on a choice the reader never agreed to. A choice that
left nothing in the result, an approach the session considered and rejected
on its own, is not a decision. It is the path, and the path is cut.

**Report exceptions, not confirmations.** Everything that came back fine gets
one line, together, or no line at all. A check that passed, a reviewer that
found nothing, a path that was traced and holds up, a worry that proved
unfounded: none of these earns its own sentence. Only what is not fine, what
was chosen, and what the reader must act on gets a sentence of its own. A
recap that walks through each thing that is fine is long even when every
word is plain.

**The reader can ask.** A recap is the door, not the room. Leave the detail
out. If the reader wants to know how a conclusion was reached or what else
was checked, they ask, and you answer that one question. A short recap that
prompts two questions beats a long one that answers ten nobody had.

**The reader never saw the code.** Start from that assumption every time. They
did not open a file, run a tool, or read a diff. They ran an agent against a
codebase, one they may know well or may never have seen. A function name, a
type name, a variable, an internal file path, or a test name is not
information to them. It is a label for a thing the recap must say in words.

## Barriers on the reader's side

Communication research names the ways a message fails to land. Most of it
is about listening and body language and does not apply to a written
message. What does apply:

- **Information overload is the first barrier.** A reader given more than
  they can hold stops taking anything in. The fix is not shorter sentences;
  it is fewer points. Every point you cut is a point that lands.
- **Do not assume the reader interprets a word the way you do.** A name you
  spent the session with means nothing to them. A term the codebase uses
  may mean something else in their head. Say the plain thing.
- **Essential information goes in the opening lines.** The first sentences
  are the headline: what, why, how, done or not. A reader who stops after
  them must still have the answer.
- **Match the reader's knowledge, not yours.** Write for what they knew
  before the session started, which is nothing about what you did in it.
- **Make one point, support it, then stop.** A response that wanders across
  many points loses the reader. Each item in the recap is one point and, if
  needed, one supporting fact. End when the points end; do not fill the
  space after them.
- **Be direct about needs and limits.** A decision the reader must make is
  stated as a request, plainly, not softened into a hint. Work that was
  not done is stated as not done, with the reason, not apologized for.
- **The channel allows questions.** A recap is not the last word. The
  reader can ask, and a question is cheaper for them than reading the
  answer to one they did not have.

## Register

- **Simple, not necessarily short.** The goal is a message that cannot be
  misunderstood. Cutting points makes a recap short; explaining each kept
  point until it is unmistakable makes it simple. Take the words a point
  needs; never take a point away to save words.
- **Facts stay exact.** Every number, setting name, command, URL, version,
  and decision appears exactly as it is. Simplify the sentence around the
  fact, never the fact. "The limit is 10 requests per second" stays 10, not
  "about ten".
- **Flat structure, no ceremony.** No headings unless a part holds two or
  more items. No tables; a table becomes sentences. No preamble, no sign-off,
  no restating what the reader just read. Write as you would to a capable
  colleague who was not in the room: direct, plain, unhurried.
- **Same language as the reader.** If the session ran in Spanish or
  Portuguese, the recap is in Spanish or Portuguese. Setting names and
  commands stay as they are in any language.

## Communication rules — load them on first use

This skill ships one companion file beside it. On the first recap in a
session, before writing anything, decide which of these two applies:

- **The `effective-communicator` skill is installed.** It appears in your
  list of available skills, on its own or under a plugin prefix. Invoke it
  and follow it. Do not read the companion file; the installed skill is the
  fuller version of the same rules.
- **It is not installed.** Read `communication.md` in full, now. It is the
  distilled version of that skill, and every sentence of the recap must obey
  it.

There is no third option. Writing the recap from memory of what "plain
language" means, without one of those two loaded, is the first red flag below.

Never tell the reader to install the companion skill. Use it when it is there,
use the file when it is not, and say nothing about which one you used.

## What a recap is

A recap covers these six parts, in this order. The parts are a checklist for
you, not headings for the reader. Parts 2, 4, 5 and 6 are absent when empty,
with one line only where the absence matters (no checks run). Part 3 always
appears: when there are no decisions, it is the clause "no choices were made
that you would want to reverse", and it can share the result sentence. When
every part has at most one item, the recap is a few short sentences with no
headings at all. Headings appear only when a part holds two or more items;
a part with one item sits as a plain paragraph between them, in its place
in the order. One heading in an otherwise flat message is fine.

The quoted examples below all come from one imaginary session about rate
limiting. They show the shape and the register, never words to reuse.

### 1. Result: what, why, how

Two or three sentences, and never more: **what** was built, **why** the
reader asked for it, **how** it works in one plain clause, and whether it is
**done**, **partly done** (with what is missing), or **not done** (with why).
This window opens the message. Nothing comes before it, and a reader who
stops after it must still have the answer. The "how" is the approach, not
the code: "each key gets its own allowance", not the name of the data
structure that holds it. When the ask was a question ("does this hold up?"),
this window answers it, and that is the one place "it holds up" belongs.
When there is an open item, the window points at it in one clause ("with
one gap to close before you build it") and the full item lives in part 5.
Never state an item in full twice.

> The public API now limits each API key to its own number of requests per
> second, so one client cannot slow everyone else down. It works by giving
> every key an allowance that refills over time and refusing requests once
> it is spent, with the limits set from the environment. That is done and
> all checks pass.

### 2. What you have now

What now works or exists, described from the reader's side: what the system
does that it did not do before, what they can configure, what a caller sees.
Three to six bullets. Each bullet names a behavior, not a file.

Names the reader will **type or set** belong here: environment variables,
command-line flags, commands, endpoints, config keys. Names only the code
sees do not: functions, types, variables, struct fields, internal paths, test
names.

> - Every API key now gets its own allowance of requests per second, with a
>   short burst above it. A caller that exceeds it gets a "too many requests"
>   response with a retry hint.
> - Three settings control it: `API_RATELIMIT_ENABLED`, `API_RATELIMIT_RPS`
>   and `API_RATELIMIT_BURST`. The defaults are on, 10 per second, burst of
>   20.
> - Health and readiness checks are never limited.

### 3. Decisions made for you

Every choice the session made that the reader might have made differently
and that is now part of the result. Examples: a default value, an exemption,
a behavior picked where the ask was silent, a scope narrowed or widened, an
approach chosen between two valid ones. In a review or planning session, a
judgment call the reader could overrule counts too: "this ordering is fine
as written", "this value stays fixed in code". For each: what was decided,
the alternative, and the reason, in one or two sentences, so the reader can
reverse it in one reply. Nothing here is a story. It is a list of choices
that are now part of the result.

Not a decision: an approach the session tried or weighed and then dropped,
or a statement it made and then corrected. If nothing of it remains in the
result, nothing of it goes in the recap.

Never skip this part and never merge it into another. A decision the reader
does not know was made is the one that breaks the next step of the work,
because they plan on top of it without knowing it is there.

An item appears once. If a choice you made also needs the reader to act
(it will break something, or you left it for them on purpose), it goes in
part 5, not here.

> - Health and readiness checks are exempt from limiting. The alternative
>   was to limit them like any other route; exempting them keeps monitoring
>   working when a key is being limited.
> - The system drops the allowance of a key that has been idle for fifteen
>   minutes, so memory does not grow without bound. Nothing you configure
>   depends on this.

### 4. Changes you did not ask for

Anything the session changed outside the original ask: an unrelated bug fixed
so tests would pass, a file touched for a side reason, a behavior added
because a linter or a tool demanded it. State each as what is different now
and why the reader should care. One or two sentences each. Do not tell how it
was found.

> - A database migration merged last week had a typo that made it fail
>   silently. It is fixed. Any environment that ran that migration before
>   today may be missing the table it was supposed to create; check before
>   the next deploy.

### 5. Decisions for you and things to watch

Anything only the reader can settle, and anything that could surprise them
later. For each: the situation in plain words, the consequence, the options
if there are any, and what the session did in the meantime. Never trim this
part. These all belong here: a breaking change, a chosen default that
affects existing users, work left undone on purpose, and a risk the agent
noticed but did not act on. Say how serious each one is in a word or two
("harmless", "will break X").

> - **The default limit will break the nightly billing job.** An internal
>   service calls this API with one shared key at about four times the new
>   default, and it does not retry when refused. The first nightly run after
>   deploy will fail partway. Options: raise the default, exempt or raise the
>   limit for service keys, set the limit higher in that environment, or
>   teach the job to retry. The default is left at 10 until you choose.

### 6. Verified, and not

What was actually checked, in plain words: tests run and their result, lint
clean, a manual check performed. Then what was not checked, and the commit
state if the reader will care (nothing committed, committed to a branch,
pushed). Report only what happened. A check whose result you saw is
verified; say so plainly. A check that never ran, or whose result you never
saw, is unverified; say that. A count (of tests, of files) belongs only when
it changes what the reader does next; "all tests pass" is usually enough.

> All tests pass, including the check for timing bugs between parallel
> requests, and the linter is clean. Nothing is committed.

**Length.** As short as the content allows. A session with one open item
recaps in three or four sentences. A session with several decisions and a
side effect fills part of a screen. Nothing fills a screen. The recap grows
only when parts 3 to 5 have more items, never because part 2 or part 6 got
more detailed.

The short form, for the same imaginary session after the reader answered the
billing question and the work shipped:

> The per-key rate limiting is in, so one client can no longer slow everyone
> else down; each key gets an allowance that refills over time. Every check
> passes, and no choices were made that you would want to reverse. One thing
> to watch: the retry hint sent to
> limited callers is always "one second" rather than the real wait; harmless,
> but imprecise. Nothing is committed. Say the word and I will commit it.

That is a complete recap. It leaves out every check that came back fine and
every step taken to get there; the reader asks if they want them.

## The two filters

Run every sentence through both before it stays in.

**The journey filter.** Ask: is this a result, or is this how I got to a
result? A result stays. The path is cut. "Health checks are exempt from
limiting" is a result. "I first raised the burst in the health test, then
decided that was wrong, reverted it, and exempted the endpoints instead" is
the path. "I considered limiting by IP address instead and rejected it" is
also the path: nothing of it remains. "I said earlier that the job retries
on failure; it does not, and the plan now accounts for that" is also the
path: the reader needs only the plan as it is now. The reader learns nothing
from the path that the result does not tell them.

Signs a sentence is the path: it contains "first", "then", "turned out",
"realized", "went back", "reverted", "initially", "after that", "tried",
"considered", "earlier I", "I had said", "corrected", "noticed while", "it
traced", "it confirmed", "it found that", or names a tool run that is not
the final verification.

**The delete filter.** Ask: if I delete this sentence, does the reader lose
something they must know, decide, or watch for? If not, delete it. Cut any
detail that only proves the agent was busy. The reader trusts the result line
and the verification line; they do not need the work shown.

Sentences that fail this filter almost every time:

- A confirmation. "The history record is durable." "No existing test expects
  the old behavior." "The reviewer found nothing wrong with X." If it is
  fine, it is covered by the result line.
- A per-check or per-reviewer walk-through. Several reviewers or several
  checks collapse into one line: "no reviewer found a problem", "all checks
  pass".
- Provenance. "I verified this one myself", "the audit found this, not me",
  "which was the part I was least sure of". The reader wants the fact, not
  who established it or how you felt about it.
- A self-correction. "The review disagreed with my earlier idea", "my first
  approach would have broken X, so I changed it", "I was wrong about Y; it
  actually does Z". The session fixed it; the reader gets the fixed result.
  At most, one clause: "the plan took two passes".
- A restated plan. If the next step is "build it", say that in one line. Do
  not list the pieces again.

A caveat the reader must act on survives this filter even when it is small.

## Grounding

A recap reports facts. Before writing:

- **Re-read the original ask** from the start of the session. Part 1 is judged
  against those words, not against what the session drifted into.
- **Check the actual state**, not your memory of it. If there is a working
  tree, look at what changed. If tests were run, use the last real result. If
  you are not sure whether something was done, check, and if you cannot check,
  say it is unverified.
- **Scope.** By default the recap covers this session from its start, or from
  the last recap if there was one. If the reader names a scope (a branch, a
  pull request, since some point), use that scope. A branch or working-tree
  scope includes uncommitted changes; say which part is committed and which
  is not.
- Never claim a check passed that did not run. Never claim something is done
  because it was planned.

## Rationalizations

| Thought | Reality |
|---|---|
| "The reader should know what I tried, in case it matters" | If it matters, it is a decision in part 3 or a watch item in part 5. State that. The attempts are still cut. |
| "That was an obvious choice, not really a decision" | If the ask was silent and you picked, and the pick is in the result, it is a decision. List it in part 3. Obvious to you is not obvious to a reader planning the next step on top of it. |
| "I rejected my own first idea; that is a decision worth reporting" | It left nothing in the result. It is the path. At most, "the plan took two passes". |
| "I was wrong earlier and fixed it; honesty says I should mention it" | Honesty is the corrected fact stated as fact. The correction history is a second thing for the reader to hold for no gain. |
| "The file names help them find it" | They never opened the code. A file name tells them nothing. If they need to go somewhere, say what the thing does and add the path at the end of the sentence. |
| "This unrelated fix was small, I'll skip it" | Any change outside the ask goes in part 4, however small. A reader who deploys a surprise is worse off than one who reads one extra line. |
| "I'll list the tools I ran to show I verified" | Say what was verified, in words. "All tests pass, linter clean." The command names are not the evidence. |
| "Every check I list is a fact the reader might want" | Facts that are fine are the result line. The reader asks if they want one of them expanded. Listing them buries the one that is not fine. |
| "A longer recap is more complete" | Longer buries parts 3 to 5, the only parts that change what the reader does next. Complete means every decision and side effect is present, not every event. |
| "I should say which parts I verified myself" | Provenance is narration. State the fact. Mark it unverified only if nobody verified it. |
| "It was a long session, they need the full picture" | The full picture is the result, the decisions, the side effects, and the verification. That is parts 1 to 6. The rest is the agent's log. |
| "I'll skip the communication rules, I know them" | You do not have them loaded. Invoke the skill or read the file first. |
| "The user is technical, so identifiers are fine" | Technical is not the same as having seen this code in this session. Words first; a name as a trailing reference only if the reader will go there. |

## Red flags — stop and rewrite

- You started writing without invoking `effective-communicator` or reading
  `communication.md` this session.
- The message opens with anything other than what was built, why, how, and
  whether it is done.
- A bullet starts with a file path, a function name, or a type name.
- A sentence contains "first", "then", "reverted", "turned out", "realized",
  "tried", "considered", "corrected", or "earlier I".
- A test name, an error string, or a linter message appears in the text.
- A sentence other than the result line says something is fine, holds up,
  or was confirmed.
- Checks, reviewers, or audits are reported one by one instead of as one
  line.
- A sentence says who verified something or how sure you felt.
- A sentence reports an idea the session had and then dropped, or a
  statement it made and then corrected.
- Headings appear over parts that hold a single item.
- A choice the session made where the ask was silent is not listed in part
  3, or is listed without its alternative.
- A change outside the ask is missing, or is told as a story instead of a
  state.
- A decision the reader must make is not in its own bullet with its
  consequence and options.
- The recap fills a screen, or is longer than its open items justify.
- A verification claim names a command instead of a result, or claims a
  result you did not observe.

**All of these mean: rewrite it. Result first, exceptions only, as short as
the content allows.**

## Checklist

Before sending:

- [ ] `effective-communicator` invoked, or `communication.md` read, this session
- [ ] Original ask re-read; part 1 opens with what, why, how, and done, partly, or not, in two or three sentences
- [ ] Every bullet in part 2 names a behavior the reader can see, not a file
- [ ] Every choice made where the ask was silent, and still in the result, is in part 3 with its alternative and reason; part 3 says so when there are none
- [ ] Every change outside the ask is in part 4, as a state, not a story
- [ ] Every decision for the reader and every risk is in part 5 with consequence and options
- [ ] Part 6 reports only checks that actually ran, and the commit state
- [ ] No sentence survives the journey filter or the delete filter by accident
- [ ] No confirmation, per-check walk-through, self-correction, or "I verified this myself" sentence remains
- [ ] Headings only where a part holds two or more items; short sessions recap in a few sentences
- [ ] Only names the reader will type or set remain; every other identifier is replaced by words, or trails the sentence as a reference. Test names, error strings and linter messages never appear
- [ ] As short as the content allows, short sentences, active voice, present tense
- [ ] Every number, setting, command, and decision exact; no headings over single items, no tables, same language as the reader
