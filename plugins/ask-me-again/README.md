# ask-me-again

A skill that makes an agent ask its open questions again, properly: **one at a time, in plain chat, in one fixed shape, with every recommended fix checked first.**

## The problem

An agent stops mid-task and asks you four things at once. Each one is a line of jargon — a function name, a flag, "A or B?" — with no picture of what either choice does to anyone. Or it opens a multiple-choice prompt that has room for one line per option and none for context. You cannot answer without opening the code, which is the work you gave the agent in the first place. And when you reply "sure, sounds fine" to the first one, it takes that as a yes to all four.

## What the skill does

Say `/ask-me-again` (or "ask me again", "one question at a time"). The agent then:

1. **Collects every open question** from the conversation, including the assumptions it made without asking. It invents none.
2. **Checks the facts and the fix before asking anything.** It re-reads the code behind each question. It also checks that the fix it recommends really works: the function or flag exists in the version that is installed, and the change fits where it says. When a small throwaway test would settle it, it runs that test. A question that a fact answers is dropped and reported in one line. Anything that cannot be checked from where the agent sits is marked `Not verified:` inside the fix.
3. **Asks one question per message**, in plain chat, never through the multiple-choice question tool that some agent programs offer. Every question has the same shape:
   - a numbered heading that states the claim — `### Question 2 of 4 — A crashed worker leaves its wallet claimed forever`
   - **The situation.** What exists, what is unsettled, and why the code cannot settle it.
   - **The flow.** A numbered walk through what the user of the code does and what they hit, ending at the consequence they would notice. Three to five steps; one or two when that is the whole story, more only when absolutely needed.
   - **The fix.** The one path the agent recommends.
   - **Cost.** What that fix costs, or `None`.
   - **Your call:** the question in a few words, with up to four alternatives.
4. **Closes a question only on a direct answer**: apply, reject, or a different direction. After a doubtful or vague reply ("fine, I guess"), the agent says what it could not tell and asks the same **Your call** again. When you give a direction of your own, it does not stop to investigate: it notes the direction, keeps asking, checks it once after the last question, and comes back only when the check fails. It looks into something in the middle only when you ask it to. It builds nothing until the last question is closed.
5. **Carries answers forward.** When one answer already settles part of a later question, the agent asks only what is left. When two answers cannot both hold, it says so, recommends which one gives way and why, in a few lines, and lets you choose. New questions that come up along the way are added; that is the uncertainty being worked through, not a failure.
6. **Ends with what is now known.** After the last answer it lists, one line each, what was decided, what it found out, and what is still open and why. Then it carries on with exactly what was decided.

The prose of a question is capped at 200 counted words (a little more on the rare flow that needs over five steps), so a question is one reading and never a long block of text.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install ask-me-again@patrickdappollonio
```

**Codex CLI:**

```
codex plugin add ask-me-again@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via [`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill ask-me-again
```

Add `-g` to install for your user instead of just this project, and `-a <agent>` to target one agent. Update later with `npx skills update`.

Then, when an agent's questions make no sense: *"/ask-me-again"*.

## License

MIT.
