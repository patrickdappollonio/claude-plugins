# Companion Skills — what each adds, and how to install it

This skill works alone: every companion below is distilled into the files
beside this one. When a companion **is** installed, use it instead of the
distilled version — it is the fuller procedure. When one is not, keep going
with the distilled version, and if the user asks how to get the real thing,
give them the commands below. Never stop the run to install a skill yourself.

All of them live in the same marketplace, `patrickdappollonio/claude-plugins`.
Register it once per harness, then install by plugin name:

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

| Skill (`--skill`) | Plugin (`/plugin install`, `codex plugin add`) | What it adds when installed | Distilled here in |
|---|---|---|---|
| `adversarial-review` | `adversarial-review` | The full 18-reviewer hostile panel with a standalone verifier and fix validator — the review to run on large changes after G2 | `adversarial-review-fallback.md` |
| `adversarial-review-quick` | `adversarial-review` | The 8-reviewer panel with the same verifier and validator — the review for small changes and fix rounds | `adversarial-review-fallback.md` |
| `visual-plan` | `visual-docs` | Renders the plan in the browser with diagrams and a comment loop; the decisions log appended at the end live-reloads there, and `question` fences collect the user's answers as comments | step 0 and step 8 of `SKILL.md` |
| `visual-recap` | `visual-docs` | A browser recap of what changed, grounded in the real diff — useful after step 10 if the user wants to see the result rather than read it | not distilled; optional |
| `use-premium-models-efficiently` | `use-premium-models-efficiently` | The general delegation pattern: premium model judges, cheap models do bounded work, handoff packets, vetting delegated reports | `model-routing.md` |
| `use-claude-limits-efficiently` | `use-claude-limits-efficiently` | The pause-and-resume loop for 5-hour and weekly usage windows, with chained wakeups | `capacity-check.md` |

Installing the `adversarial-review` plugin brings **both** review skills; with
`npx skills`, name each one you want.

## When the user asks

Answer with the exact lines for their harness — nothing more. If you cannot
tell which harness they are on, give the Claude Code, Codex, and `npx skills`
lines and let them pick. Installed skills take effect on the next session in
most harnesses, so say that the current run continues on the distilled version.
