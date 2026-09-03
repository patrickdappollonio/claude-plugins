# Companion Skills — what each adds, and how to install it when asked

This skill works alone: every companion below is distilled into the files
beside this one. When a companion **is** installed, use it instead of the
distilled version, because it is the fuller procedure. When one is not, keep
going with the distilled version.

**Never suggest installing a companion skill.** Do not say the
result would be better with one, do not list what is missing. The user chose
what to install. Give the install lines below only when the user asks how to
get one.

Check what is installed by looking at the skill list your harness gives you.

| Skill (`--skill`) | Plugin | What it adds when installed | Distilled here in |
|---|---|---|---|
| `visual-plan` | `visual-docs` | Renders the plan in the browser with diagrams, a comment loop, and `question` fences that collect answers as comments. Under this skill the audience is **technical**: its write-for-a-non-developer rule and the linter's warnings about code symbols in prose do not apply; everything else, including its own rewrite-in-place rule, does. | `SKILL.md` step 8 |
| `adversarial-review-quick` | `adversarial-review` | An 8-reviewer hostile panel, with a separate reviewer that discards false findings and another that checks each fix — the review for plans inside one subsystem | `plan-review.md` |
| `adversarial-review` | `adversarial-review` | The full 18-reviewer panel with the same two checking reviewers — the review for plans that touch the database schema, sign-in and permissions, work that runs at the same time, outside services, or more than one subsystem | `plan-review.md` |
| `implement-plan` | `implement-plan` | Builds the approved plan without further input from the user. It works in a separate copy of the repository, has cheaper models write the tests before the code, checks each ticket against the plan, runs a hostile review of the finished code, and appends its decisions to this same plan file. It reads the `.plans/` file directly and treats the decisions section as already decided. | not distilled; named in the closing when installed |
| `effective-communicator` | `effective-communicator` | The full plain-language discipline for every message | `communication.md` |
| `use-premium-models-efficiently` | `use-premium-models-efficiently` | The general delegation pattern: premium model judges, cheap models do bounded work | `model-routing.md` |

## Using `visual-plan` for the presentation

When it is installed, present through it: write the plan file where this
skill decided (the `.plans/` file is the source of truth, so serve that
directory rather than a temp directory), serve it, hand over the URL, and
read its comments back into the file. State to yourself, before its lint
step, that this document is for a technical audience; keep its other lint
findings and fix them. Answers that arrive as comments on `question` fences
become decisions in the file, and the fence is deleted.

## Using `implement-plan` after approval

When it is installed, the closing message names it as the recommended next
step and says it will pick up the plan file. Do not invoke it yourself; the
user starts it, in plain text, so they can also choose any other skill or
command they have.

## When the user asks how to install one

All of them live in the same marketplace, `patrickdappollonio/claude-plugins`.
Answer with the exact lines for their harness, nothing more. If you cannot
tell which harness they are on, give all three and let them pick. In most
harnesses a newly installed skill only takes effect in the next session.
Tell the user that this run continues with the version described here.

```text
# Claude Code — type inside a session
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install <plugin>@patrickdappollonio

# Claude Code — from a shell
claude plugin install <plugin>@patrickdappollonio

# Codex CLI — from a shell
codex plugin marketplace add patrickdappollonio/claude-plugins
codex plugin add <plugin>@patrickdappollonio

# Any other agent (Cursor, Copilot, opencode, Gemini, …) — one skill at a time
npx skills add patrickdappollonio/claude-plugins --skill <skill>
```

Claude Code and Codex install a whole **plugin** (every skill in it). `npx
skills` installs one **skill** directory. Repeat `--skill` to install several;
a comma-separated list installs nothing.
