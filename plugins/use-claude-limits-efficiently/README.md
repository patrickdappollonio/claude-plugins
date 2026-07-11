# Use Claude Limits Efficiently

Keep long-running agent work inside Claude's 5-hour and weekly usage windows.

This skill gives coding agents a lightweight budget loop for broad, parallel,
or multi-hour work: run work in bounded waves, check **real, observed** usage
between waves, and pause before crossing the limit instead of burning the last
usable budget mid-task — so there's headroom left when you come back in the
morning.

## What it does

- Runs waves of at most 3 parallel subagents by default, and never interrupts
  in-flight work just to save budget.
- Checks 5-hour and weekly usage between waves with a real usage signal — a
  first-party host tool when available, otherwise
  `npx -y ccusage@latest blocks --active --json` in Claude Code — instead of
  guessing or inventing a number.
- Pauses new work when either window reaches **95%** of its limit.
- Resumes only after confirming the window actually rolled over, by comparing
  the active block's start timestamp against the previous check — never by
  trusting elapsed wall-clock time.
- Chains wakeups when the runtime clamps wake delays (commonly 60–3600
  seconds), so overnight and multi-hour pauses work: each wakeup re-checks
  usage and reschedules until the window is clear.
- Makes every wake prompt self-contained — remaining plan, threshold, wave
  throttle, exact usage command, and the next wave's handoff packets — so the
  resumed turn doesn't depend on old conversation momentum.

## When to use it

Use it for long-running coding sessions, overnight runs, PR babysitting,
broad reviews, multi-wave refactors, or any task where parallel agents could
exhaust the current 5-hour or weekly budget.

Skip it for small one-shot edits, where checking the budget adds more ceremony
than value.

## Installing

Add the marketplace, then install the plugin:

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install use-claude-limits-efficiently@patrickdappollonio
```

## Running it

The skill activates on its own for long-running or parallel work, or you can
invoke it explicitly:

```
/use-claude-limits-efficiently:use-claude-limits-efficiently
```

## Inspiration

A rewrite of the [`stay-within-limits` skill from
@agent-native/skills](https://www.npmjs.com/package/@agent-native/skills),
trimmed to the guidance that measurably changes agent behavior.
