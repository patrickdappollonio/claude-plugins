# Anti-Slop

Keep the interfaces and the prose your agent writes from reading as AI-generated. The plugin ships two skills, and installing it from a marketplace gets both.

## anti-slop-ui

Ask an agent to make a screen "modern and polished" and it reaches for the same defaults every time. You get gradients on everything, a rainbow of accent colors, and a pulsing "Active" badge on a state that can never be inactive. You also get rounded cards with a colored "fingernail" stripe down one edge, emoji as icons, Inter or JetBrains Mono, uppercase labels over every heading, chains of middle dots, content that fades in as you scroll, and a grey hype subtitle under every heading. It also turns the chat into page text: the client's reasons for the project, or the stack and editor the author mentioned, end up printed on the screen. People recognize the result at a glance and trust the product less.

`anti-slop-ui` is built on the ten tells from the article ["10 Tells of a Slop UI"](https://hereticpleb.vercel.app/blog/10-tells-of-slop), five more from the [Hacker News discussion](https://news.ycombinator.com/item?id=49867038) of it, and three from ["Spot the slop: a UI designer's guide to fixing AI defaults"](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c).

### What it does

- **One rule**: every color, effect, badge, animation, and line of text on a screen must tell the person using it something they need on that screen.
- **Follows the project first**: existing tokens, theme, component library, icon set, and font win. The skill applies to what the agent adds, and an element the user explicitly asks for stays.
- **Decides before it styles**: palette (60–30–10, status colors only for real status), flat surfaces, one radius scale, the font, and the icons are set as tokens before any CSS is written. Your font wins; with no font named or loaded, it recommends two or three that fit the product, with a reason for each, and lets you choose instead of defaulting to one.
- **Writes copy for the screen's user, not from the chat**: plain noun headings, no taglines, no hype words, and nothing that only the brief or the conversation knew.
- **Badges and motion must mean something**: a badge stands for a state that can change, and animation only shows work in progress or answers the user's own click, press, or focus.
- **Gives the screen a hierarchy and its other states**: one primary element, secondary things that recede, the rest one step away instead of all at once, and empty, loading, and error states for every data view.
- **Checks alignment by looking**: renders at desktop and phone width when a browser is available, and says which parts it could not check when one is not.
- **Reviews against eighteen tells** before finishing, with a search signal and a fix for each, and reports every tell it found in one line.

### When to use it

Use it when building, restyling, polishing, or reviewing any user interface: an HTML page, an app screen, a dashboard, a component, or CSS and Tailwind classes. It also fits when a UI looks generic, cheap, or vibe-coded and you want to know why.

## anti-slop-text

Ask an agent for a README, a blog post, or a PR description that "sounds professional" and the same patterns come back: a fact "stands as a testament" or "plays a pivotal role" instead of being stated, "not just X, but Y" corrects a misconception nobody held, lists come in threes, sentences end in ", highlighting …", and the text opens with "Certainly!" and closes with a summary of what you just read. To make the text feel concrete, the agent also makes up reasons, numbers, and outcomes nobody gave it, and no word list catches that. In testing, a blog post about a CI migration came back with an invented account of which scripts turned out to be dead code.

`anti-slop-text` is built on Wikipedia's ["Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) guide and the phrase patterns in Simon Willison's [LLM cliché highlighter](https://tools.simonwillison.net/llm-cliche-highlighter).

### What it does

- **One rule**: every sentence gives the reader a fact they need, in the plainest words that carry it, and every fact comes from the material the agent was given or something it checked.
- **Lists the facts before writing**, and asks for a missing reason, number, or outcome instead of inventing one.
- **Writes plainly**: plain verbs (*is*, *has*, *uses*), numbers over adjectives, named sources or no claim, and Y instead of "not X, but Y".
- **Fits structure to the content and the destination**: sentence-case headings only where the length needs them, rare bold, paragraphs for reasoning, the destination's markup, and no closing summary.
- **Writes for the reader of each destination**: a README user, a PR reviewer, or the colleague who asked, with the answer or the change first and every code name explained, using the `effective-communicator` rules.
- **Keeps the conversation out of the artifact**: no "Certainly!", "I hope this helps", disclaimers, or unfilled placeholders.
- **Says what changed** in commit messages, PR descriptions, and reports, not what was preserved or left alone.
- **Reviews against sixteen groups of tells** before handing text over, using a catalog of the words and sentence shapes to search for, and lists each one it fixed.
- **Does not overcorrect**: plain constructions, repeated terms, and a real list of three stay. Asked whether someone else's text is AI-written, it reports patterns and says style alone is weak evidence.

### When to use it

Use it when writing, editing, or reviewing prose people will read: a README, docs, a commit message, a PR description, release notes, a blog post, an email, a report, or a chat reply. It uses the `effective-communicator` skill for plain-language structure when that is installed, and a distilled copy of the same rules when it is not, so it works on its own.

## Install

**Claude Code:**

```
/plugin marketplace add patrickdappollonio/claude-plugins
/plugin install anti-slop@patrickdappollonio
```

**Codex CLI:**

```bash
codex plugin add anti-slop@patrickdappollonio
```

**Any other agent** — Cursor, Copilot, opencode, Gemini, and 70+ more — via [`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add patrickdappollonio/claude-plugins --skill anti-slop-ui --skill anti-slop-text
```

Drop either `--skill` flag to install only one; each skill works without the other.

Add `-g` to install for your user instead of just this project, and `-a <agent>` to target one agent. Update later with `npx skills update`.

## Running it

Each skill activates on its own when a task involves building UI or writing prose, or you can invoke one explicitly:

```
/anti-slop:anti-slop-ui
/anti-slop:anti-slop-text
```

## Inspiration

For `anti-slop-ui`: the ten tells, the color-proportion rule (the article says 70-30-10; the skill uses the common 60–30–10 and allows 60–70% for the neutral), and the examples of the pulsing "active student" badge and the "Built with Hugo. Written from Neovim." footer come from ["10 Tells of a Slop UI"](https://hereticpleb.vercel.app/blog/10-tells-of-slop). Uppercase and small-caps labels, middle-dot chains, numbered sections, filler sections such as an FAQ without answers, and scroll effects (fade-in on scroll, carousels, scroll hijacking) come from the [Hacker News discussion](https://news.ycombinator.com/item?id=49867038). The same thread pushed back that a colored card edge can signal state and that glass effects and Inter predate AI, so the skill allows each one when it has a reason. Uniform size and weight everywhere, missing empty, loading, and error states, and every panel shown at once come from ["Spot the slop"](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), along with naming colors by what they do, pairing a display face with a body face, the "would the founder say it out loud" test for headlines, and allowing brief motion as feedback to the user's own action.

For `anti-slop-text`: the inflated-significance, promotional, vague-attribution, contrast, rule-of-three, vocabulary, formatting, chat-residue, placeholder, and edit-summary patterns come from Wikipedia's ["Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), including its advice that plain constructions are signs of human writing and that style alone is weak evidence of AI use. The rhetorical tics (negation chains, "here's the twist", "turns out", "that's the whole point", stacked questions, repeated openers, stranded auxiliaries, performative honesty, therapist voice) come from Simon Willison's [LLM cliché highlighter](https://tools.simonwillison.net/llm-cliche-highlighter). Invented details as the first tell comes from testing the skill.
