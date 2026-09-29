---
name: anti-slop-ui
description: "Use when building, restyling, polishing, or reviewing a user interface — an HTML page, a web or mobile app screen, a dashboard, a component, CSS or Tailwind classes — especially when asked to make it look modern, polished, clean, or better, or when a UI looks generic, cheap, AI-generated, or vibe-coded. Covers gradients everywhere, purple gradients, rainbow palettes, pulsing or glowing badges, status dots, cards with a colored fingernail stripe, emoji as icons, misaligned icons or SVGs, Inter or JetBrains Mono by default, // decoration, fake terminal chrome, uppercase or small-caps labels, middle-dot separators, numbered sections, fade-in on scroll, carousels, filler sections, everything the same size and weight, missing empty, loading, or error states, every panel shown at once, glassmorphism, taglines, marketing hype on working screens, and text that repeats the brief or chat instead of serving the user."
---

# Anti-Slop UI

## The rule

**Every color, effect, badge, animation, and line of text on a screen must tell the person using it something they need on that screen.** If it is there because generated UI usually has it, it is slop: the default output of a model with no vision for this product. People recognize it at a glance and trust the product less.

"Make it modern and polished" means restraint: fewer colors, flat surfaces, clear type, and plain words. It never means more effects.

## Follow the project first

Before you write any style, look for the project's own design language: design tokens, a theme file, a Tailwind config, a component library, existing CSS variables, an icon package, a font already loaded. If one exists, use it, and apply this skill only to what you add. If the project's language itself uses a thing this skill calls a tell (a brand gradient, a glass effect), keep it where the project uses it and do not spread it further.

If the user explicitly asks for one of the tells ("add a gradient to the hero"), do what they asked, once, where they asked. Their request is the reason the element exists.

## Build it in this order

Decide these before writing the first rule of CSS, and write the decisions as variables or tokens at the top, so nothing downstream invents a new value.

1. **Palette: 60–30–10.** One neutral family for about 60–70% of the surface (backgrounds, body text), one secondary for about 20–30% (panels, borders, secondary text), and one accent for at most 10% — the primary action and the one thing that needs attention. Red, amber, and green appear only for real status (an error, a warning, a success the user caused). Name each token for what it does (`--color-action`, `--color-danger`, `--color-text-muted`), never for its hue or position (`--purple`, `--gradient-start`); a color you cannot name by its job does not belong. No color literal appears outside the token block. More than two hues besides status colors needs a reason you can state.
2. **Surfaces: flat.** Solid fills and one-pixel borders. No gradient backgrounds, no radial "glow" blobs behind the page, no gradient buttons or text. A gradient is allowed only when it depicts a range of values (a heat scale, a progress fill between two meaningful ends).
3. **Shape: one radius scale, no fingernails.** One or two radius values, small on controls (around 4–8px). Group content with spacing, headings, and dividers first; draw a box around it only when it is a separate object the user acts on. Do not put a thick colored stripe down one edge of a rounded card (`border-left: 4px solid` plus `border-radius`, which curves the stripe into a fingernail). A colored edge is allowed only when its color encodes a state that differs from card to card, such as overdue against on time, and then it follows the badge rule in step 7.
4. **Type: chosen, not defaulted.** A font the user named or the project already loads wins, whatever it is. With neither, do not pick silently: recommend two or three options that fit this product (a single family, or a display face for headings paired with a readable body face), each with a one-line reason (its tone, its legibility at the sizes this screen uses, how it loads — self-hosted, a font service, or already on the user's machine), and let the user choose. The system stack (`system-ui, sans-serif`) is one option among them, not the answer. If you must proceed before the user answers, use your first recommendation and say in your report that the font is open. Do not reach for Inter or JetBrains Mono only because the product is technical. Use monospace only for code, paths, commands, and values the user copies — never for a whole page. No `//`, `>_`, `$`, blinking cursors, or macOS window dots as decoration. Use sentence case: no uppercase or small-caps labels sprinkled over the page, no small letter-spaced label above each heading, and no section numbers ("01", "02") on sections that are not steps in an order. Separate items with layout (a gap, a column, a line break), not a row of middle dots (`·`).
5. **Icons: real icons or none.** The project's icon set, or inline SVG with a `viewBox` that matches its drawn size. Never emoji in the interface itself (labels, buttons, headings, list markers, empty states). Emoji belong only in content the user wrote.
6. **Copy: for the user's task, not from the chat.** Write every string from what the person on this screen needs to do or know. The brief, the client's reasons, the business story ("we merged three apps"), and the stack or editor the author uses are context for you, never text for them. Headings are plain nouns ("Timetable", "Machines"). On a page that must sell, a headline says what this product does in words its founder would say out loud; if it could sit on any other product's page ("Scale without limits", "Your all-in-one platform"), rewrite it. No tagline, no grey subtitle under every heading, no "Welcome back, Jordan ✨". A working screen is a tool, not a landing page. Build only the sections you have real content for: no FAQ without answers, no testimonials, stats, or feature grids you invented to fill the page, and no "Lorem" or "Coming soon" left in shipped markup.
7. **Badges and motion: only for state that changes.** A badge or status dot must stand for a state that can differ — between two items in the list, or between two moments the viewer will see. A student ID shown only to logged-in students cannot be "inactive"; an ID card does not need "verified" on it. Animation is only for two things: something in progress right now (syncing, uploading, a live connection being established), and brief feedback to the user's own action (a button's hover, press, and focus, an input's focus, a toggle switching). Nothing settled pulses, glows, or blinks. Content does not fade or slide in as the user scrolls, carousels do not rotate content on their own, and the page never takes over the scroll wheel.
8. **Effects: none by default.** No glassmorphism (`backdrop-filter: blur`, translucent panels over blobs) and no brutalism as a default style. Both predate generated UI and both can be right on purpose; the tell is reaching for them with no reason. Use a shadow only to show that something floats above the page (a menu, a dialog).
9. **Hierarchy: one thing first.** Decide the one element the user came to this screen for and make it bigger, heavier, or closer to the top than the rest; let secondary elements recede in size and color. Consistent tokens do not mean equal weight: cards take the height their content needs, and not every section gets the same padding and the same treatment. Show what the user needs now and put the rest one step away (a disclosure, a tab, a detail view, a menu) instead of every panel, filter, and export at once.
10. **States: empty, loading, and error too.** Every view that shows data also has an empty state (what this is and the one action that fills it), a loading state, and an error state in plain language that says what happened and what to do. Build them in the same pass as the full view; they are invisible in a screenshot and the first thing a new user sees.

## Check alignment by looking

Misalignment is the tell you cannot catch by reading CSS. Before deciding you cannot render, look for a way to: a browser tool in this session, Playwright or Puppeteer in the project, or a local Chrome or Chromium, which takes a screenshot with `--headless --screenshot=<file> --window-size=<w>,<h> <url>`. If you can render, render the page at a desktop width and at 375px and look at: icons next to text (vertical center and baseline), columns in lists and tables (times, amounts, and statuses line up), SVGs (not clipped or offset), and anything drawn with characters. Without a renderer, check that every icon-and-text row uses `align-items: center`, every SVG's `viewBox` matches its width and height, list columns have fixed or tabular widths (`font-variant-numeric: tabular-nums` for numbers), and ASCII art sits in a `<pre>` in a monospace font. Say in your report which of these you could not check.

## Review against the tells

Before calling UI work done, run this pass over what you wrote or changed. Search the code for each signal, then read every hit in context, since some hits are legitimate.

| Tell | Signal to search for | Fix |
|---|---|---|
| 1. Gradients everywhere | `gradient(` | Replace with a solid token. Keep only a gradient that shows a range of values. |
| 2. Rainbow palette | count distinct color literals and hues; any literal outside the token block | Collapse to 60–30–10 tokens; status colors only for status. |
| 3. Pulsing or meaningless badges | `@keyframes`, `animation`, `pulse`, `blink`, `.dot`, `badge`, words like Active, Verified, Online, Live | Delete any badge whose state cannot change for this viewer. Remove animation from anything not in progress. |
| 4. Fingernail cards | `border-left` (or `border-inline-start`) of 3px or more on an element with `border-radius`; distinct `border-radius` values; boxes nested in boxes | Remove the stripe unless its color encodes a state that differs between cards; one radius scale; spacing and dividers instead of boxes. |
| 5. Emoji slop | emoji characters in markup and strings | Real icon or no icon. |
| 6. Misaligned things | icon-and-text rows, SVGs, list columns, ASCII art | See "Check alignment by looking". |
| 7. Default fonts and `//` | `font-family`, `Inter`, `JetBrains Mono`, `//` or `>_` in visible text | The user's or project's font; with neither, recommend options and let the user choose; monospace only for code and copyable values. |
| 8. Text from the chat | the brief's words, stack or editor names, "built with", "powered by", the business reason for the change | Delete; the user did not ask to know it. |
| 9. Glassmorphism or brutalism | `backdrop-filter`, `blur(`, translucent `rgba` panels, thick black borders and hard offset shadows | Flat surface with a border. |
| 10. Taglines and hype | Elevate, Seamless, Next-generation, Supercharge, Unleash, Empower, Revolutionize, Effortless, cutting-edge, "Welcome to your", ✨; a subtitle under every heading | Plain noun heading; delete the subtitle, or replace it with a fact the user needs. |
| 11. Shouting labels | `text-transform: uppercase`, `font-variant: small-caps`, `uppercase`, `tracking-wide`, `letter-spacing` on labels; a small label above every heading | Sentence case; delete the label or make it the heading. |
| 12. Middle-dot chains | `·`, `&middot;`, `\u00b7` in visible text | Separate with layout: a gap, a column, or a new line. |
| 13. Numbered sections | "01", "02", "/ 01" before headings | Delete unless the sections are steps the user follows in order. |
| 14. Filler sections | FAQ without answers, invented testimonials or stats, "Lorem", "Coming soon", placeholder links (`href="#"`) | Delete the section, or ask for the real content. |
| 15. Scroll effects | `IntersectionObserver` used to reveal content, `opacity: 0` with a reveal class, `fade-in`, carousels with auto-advance, `wheel` listeners that call `preventDefault` | Show the content; let the user scroll and page on their own. |
| 16. Uniform everything | the same padding, radius, font size, and weight on every block; a grid of identical cards; no element clearly larger than the rest | Pick the primary element and give it size and weight; let the rest recede. |
| 17. Missing states | views that render a list or data with no branch for empty, loading, or failure; error text like "Something went wrong" | Add the empty, loading, and error states, in plain language. |
| 18. Everything at once | every panel, filter, form field, and export visible on first load | Show what the task needs now; move the rest behind a disclosure, tab, or detail view. |

In your report, list each tell you found and what you did about it, in one line each. If you kept one, say why (the project uses it, or the user asked for it).

## Rationalizations

| Thought | Reality |
|---|---|
| "The client asked for modern and polished." | Polished means restraint. Effects are what make it read as generated. |
| "The user told me about the stack / the merger / their editor, so it belongs on the page." | That told you who you are building for. The screen's user did not ask. |
| "A status badge adds reassurance." | A state that cannot change reassures no one. It is noise that makes real status harder to see. |
| "The pulse makes it feel alive." | Motion tells the user something is in progress. When nothing is, it misleads them. |
| "Emoji add personality and save finding icons." | They render differently on every platform and make the product look unfinished. |
| "A subtle gradient is fine." | Once one is allowed, more follow on other elements. Start flat; add one only for a range of values. |
| "It's a developer tool, so monospace and terminal chrome fit." | Developers read proportional text all day, and fake terminal chrome is decoration with no function. |
| "Every section needs a subtitle to explain it." | If the heading needs explaining, fix the heading. |
| "Uppercase labels and numbered sections look designed." | They look like every generated page. Sentence case reads faster. |
| "A fade-in on scroll feels smooth." | It hides content the user already scrolled to and makes them wait for it. |
| "Consistent spacing and cards everywhere is clean." | Equal weight everywhere means nothing stands out, so the user has to read everything to find what matters. |
| "The screenshot looks done." | Screenshots show the happy path. Empty, loading, and error are what a new user sees first. |

## Red flags — stop and re-read "Build it in this order"

- You are about to type `linear-gradient`, `radial-gradient`, `backdrop-filter`, or `@keyframes`.
- You wrote a hex color that is not in the token block.
- You wrote a sentence that could appear on the product's marketing page.
- A string on the screen contains something you only know from the chat.
- You added a badge, a dot, or a check mark and cannot say what its other state looks like.
- You put an emoji in a label, a button, or a heading.
- You typed `text-transform: uppercase`, a `·` separator, or "01" before a heading.
- You are writing a section because pages like this usually have one, not because you have its content.
- You cannot say which element on the screen is the most important one.
- The data view is done and you have not written what it shows when the data is empty, loading, or failed.

## Checklist

- [ ] Looked for the project's design language and used it.
- [ ] Palette written as tokens first, 60–30–10, status colors only for status.
- [ ] Surfaces flat; any remaining gradient depicts a range of values.
- [ ] One radius scale; boxes only for separate objects; no colored stripe unless it encodes a state.
- [ ] Font is the user's or the project's, or the user chose it from options you recommended; monospace only for code and copyable values; sentence case, no middle-dot chains, no section numbers.
- [ ] No emoji in the interface.
- [ ] Every string serves the screen's user; nothing from the chat or the brief; no taglines or hype; no section without real content.
- [ ] Every badge has a state that can change; every animation shows work in progress or answers the user's own action; no scroll reveals, auto-advancing carousels, or scroll hijacking.
- [ ] One primary element per screen; secondary things recede; the rest is one step away, not all visible at once.
- [ ] Every data view has empty, loading, and error states in plain language.
- [ ] Alignment checked by rendering, or the unchecked parts named in the report.
- [ ] Ran the tells review and reported each finding in one line.
