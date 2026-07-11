---
name: use-claude-limits-efficiently
description: Use when long-running or parallel agent work must respect 5-hour and weekly usage limits by checking usage between waves, pausing near the cap, and resuming only when the window is clear.
---

# Use Claude Limits Efficiently

Keep long-running agent work inside the current 5-hour and weekly usage
windows. Check **real, observed** usage before launching substantial work and
between waves of parallel subagents — never invent a usage number or a usage
tool. If an active 5-hour or weekly window is at or above **95%**, pause new
work until the window is clear enough to continue safely.

## Core Loop

1. Run a bounded wave of work. Default to at most **3 parallel subagents**
   unless the user or host sets a different throttle.
2. Wait for the wave to finish. Don't interrupt in-flight subagents just to
   save budget — that usually loses work.
3. Check current 5-hour and weekly usage (see below).
4. If either window is at or above 95%, stop launching work and schedule a
   self-contained resume for when the window should clear.
5. On resume, re-check the real window before continuing. Never trust elapsed
   wall-clock time alone.

## Checking Usage

Prefer a first-party host usage tool when one exists. In Claude Code, when
none does, use:

```sh
npx -y ccusage@latest blocks --active --json
```

Read the active block's `startTime`/`id`, current cost or token usage, and
time remaining. On wake, compare the active block's start timestamp with the
one from the previous check — a **new block timestamp** is proof the 5-hour
window rolled over; "enough time passed" is not.

If the tool reports cost instead of a percentage, convert through the current
account limit when known. The stop rule is 95% of the active 5-hour or weekly
limit unless the user configures a stricter guardrail.

## Pausing and Resuming

When a wake/resume tool is available, schedule a wakeup for:

```txt
min(3600, secondsUntilWindowClears)
```

Runtimes commonly clamp wake delays to 60–3600 seconds. That is **not** a cap
on how long you can wait: **chain wakeups** — each wakeup re-checks usage,
reschedules if still over budget, and continues only when the window is safely
below the threshold. This covers overnight and multi-hour waits.

Make every wake prompt self-contained — the resumed turn cannot rely on
conversation momentum. Include:

- The remaining plan.
- The check-then-reschedule rule.
- The 95% threshold and the wave throttle.
- The exact usage command or host usage tool to run.
- The previous block/window identifier, when available.
- The next verification steps.
- The next wave's handoff packets (scope, verification commands, stop
  conditions) if delegation will resume.

## Choosing the Wait Mechanism

- **Wake/resume tool** when instructions must travel with the future resume.
- **Background sleep or watcher** for fixed timers a process can observe.
- **Cron / recurring schedules** only for recurring fresh-session work.

Don't short-poll for things the host will notify you about (subagent or
background-task completion). For budget pauses, a prompt-cache miss after a
long sleep is acceptable — preserving the limit matters more.

## Reporting

If you pause, tell the user which window is over threshold, the observed
usage, when the next check is scheduled or expected, and what work remains.
Keep enough state in the wake prompt that the next turn resumes without
relying on this conversation.
