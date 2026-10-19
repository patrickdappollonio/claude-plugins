---
name: use-premium-models-efficiently
description: Use when running a premium model (Claude Fable, Claude Opus, GPT-5.6 Sol, or similar) on codebase-heavy or token-heavy work and the user wants it to orchestrate research, coding, and testing while cheaper subagents (Sonnet, Haiku, Terra, Luna, or similar) do bounded heavy lifting.
---

# Use Premium Models Efficiently

The premium model is the orchestrator, architect, synthesizer, and final judge. Cheaper subagents do the token-heavy research, coding, testing, and summarization that doesn't require its full judgment.

```mermaid
flowchart TB
    input["User goal<br>repo context<br>constraints"] --> premium["Premium model<br>orchestrator + judge<br>plan, tradeoffs, synthesis"]
    premium --> result["Integrated result<br>final review<br>user answer + next action"]
    premium <--> research["Lighter agents<br>research scans<br>docs, APIs, repo map"]
    premium <--> coding["Lighter agents<br>bounded coding<br>patches, refactors"]
    premium <--> testing["Lighter agents<br>testing passes<br>scripts, browser, logs"]
```

## Which Models Are Which

The split is by relative cost within whatever provider you're running, not by brand. As of mid-2026:

| Provider | Premium (orchestrator + judge) | Cheaper (subagents) |
|---|---|---|
| Anthropic | Claude Fable, Claude Opus | Claude Sonnet, Claude Haiku |
| OpenAI | GPT-5.6 Sol | GPT-5.6 Terra, GPT-5.6 Luna |

Model families evolve; when these names are stale, apply the same rule — the most expensive available model takes the judgment seat, the cheaper tiers take the bounded heavy lifting.

## Keep with the Premium Model

- Decomposing ambiguous work into clean parallel slices.
- Architecture, product, and safety tradeoffs.
- Reading conflicting subagent reports and deciding what matters.
- Integrating partial implementations into one coherent result.
- Final review, risk assessment, and user-facing synthesis.

## Delegate to Cheaper Subagents

1. Spot the heavy lifting — you can't predict token counts, but you can recognize the shapes that always burn them: large repo search, long logs, broad docs, repetitive edits.
2. Split independent work into subagents **before** reading everything yourself.
3. Use cheaper models for research scans, inventory, search summaries, narrow bug hunts, browser/testing passes, test-output reduction, and bounded code edits.
4. Ask subagents for concise evidence: files, line references, commands run, diffs, uncertainties, and stop conditions they hit.
5. Spend premium tokens on the decision layer: compare results, resolve conflicts, choose the implementation path, review the final patch.

Prefer parallel subagents when slices don't depend on each other. Keep blocking or highly coupled work local.

## Handoff Packets

Write every delegated prompt as if the subagent has no useful chat context — because it doesn't. Each packet contains:

- The repo path and exact objective.
- The files, packages, or surfaces in scope, and anything explicitly **out** of scope.
- The evidence format to return: files, line refs, commands, diffs, failures, screenshots, and uncertainty.
- The verification commands or browser flows to run, plus what success should look like when that is knowable.
- Stop conditions: if the code doesn't match the prompt, a command fails after a reasonable retry, or the task needs out-of-scope files — **stop and report instead of improvising**. Stopping ends the run; the subagent does not wait for an answer.

## Subagents Are One-Shot

Every subagent gets one self-contained packet, does it, returns its report, and ends. This is a hard rule, not a default:

- **Never resume, message, or continue a subagent that has reported** (`SendMessage` in Claude Code, or the equivalent elsewhere). A follow-up, a correction, a retry, or a second round is a **new** subagent whose packet carries everything it needs, including the earlier report.
- **Never tell a subagent to wait** for your next instruction, for another subagent, or for the user. A question it cannot answer ends its run: it reports the question, and the answer goes to a new subagent.
- **End every packet with:** "This is a single task. Return your report when you are done and end; nobody will send you further instructions. If a command may run longer than three minutes, run it in the background and check it with a wait capped at three minutes, again and again, until it finishes; report only once it has."

Why: a subagent's prompt cache can expire within minutes while it sits idle, far sooner than the orchestrator's. The next message to it then re-reads its whole history at full price — hundreds of thousands of tokens per turn on a codebase-heavy task. A fresh packet costs a fraction of that, and it carries only what the next step needs.

**Long commands keep a heartbeat no more than three minutes apart.** Inside its run, a subagent's prompt cache expires about five minutes after its last model request, and while it waits on a command it makes no requests, so a silent wait past five minutes re-reads its whole history at full price. Any command that may run past three minutes (a full test suite, a build, an E2E run, a container start) starts in the background with its output and exit code going to a log, for example `( <command>; echo "EXIT=$?" ) > <log> 2>&1 &`. The subagent checks it with a foreground loop capped at three minutes, `for i in $(seq 18); do grep -q '^EXIT=' <log> && break; sleep 10; done; tail -n 3 <log>`, and repeats until the log shows `EXIT=`. A bare `sleep` may be refused by the tool; the loop is not. It never waits on a monitor or notification with no cap, and never ends its run while the command is still going. If the expected wait is longer than about 40 minutes, it skips the checks: one cold restart is cheaper. Do not act on a subagent until its final report arrives; a notice that it is still waiting on its own work is not a result.

## Vet Delegated Work

Treat subagent reports as leads, not facts. Before acting on a high-impact finding, opening a PR, or telling the user the work is done, reopen the important cited files, confirm the relevant line refs or failures, and review the final diff against the task. Lighter agents gather signal; truth-judgment stays with the premium model.

## Scenario Defaults

Soft defaults, not rigid rules:

| Work | Lighter agents do | Premium model does |
|---|---|---|
| Research | Scan docs, prior art, APIs, repo surfaces | Decide what evidence changes the plan |
| Coding | Bounded edits, candidate patches | Shared-file coordination, integration, final review |
| Testing | Run targeted tests, browser flows, screenshots; reduce logs; report exact commands, failures, and whether failures look flaky, environmental, or real | Choose the validation direction and the checks that matter; judge the signal |
| Debugging | Cluster logs, reproduce issues, try small fixes | Decide which diagnosis is most trustworthy |

## When Not to Delegate

If a task is tiny, highly coupled, or the validation itself needs delicate judgment, keep it with the premium model — delegating would cost more in coordination than it saves.
