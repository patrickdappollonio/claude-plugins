/* Visual Docs client. A small Preact app (vendored under /assets/vendor)
   renders the shell — sidebar, title block, comment drawer, routing, live
   reload — while markdown is rendered to HTML with marked, sanitized with
   DOMPurify, and hydrated imperatively (mermaid, diff2html, nomnoml) inside
   effects. If a renderer library fails to load, blocks degrade to plain
   <pre> output. */

(() => {
  'use strict';

  const { render } = window.preact;
  const { useState, useEffect, useRef, useCallback } = window.preactHooks;
  const html = window.htm.bind(window.preact.h);

  /* ---------- inline SVG icons (currentColor, theme-aware, render identically
     across platforms — unlike emoji) ---------- */

  const svgIcon = (inner) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const ICON = {
    comment: svgIcon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    sun: svgIcon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svgIcon('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    chevronLeft: svgIcon('<polyline points="15 6 9 12 15 18"/>'),
    chevronRight: svgIcon('<polyline points="9 6 15 12 9 18"/>'),
    close: svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    doc: svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    folder: svgIcon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    help: svgIcon('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    check: svgIcon('<polyline points="20 6 9 17 4 12"/>'),
    text: svgIcon('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'),
    list: svgIcon('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
    expand: svgIcon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'),
    plus: svgIcon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
    minus: svgIcon('<line x1="5" y1="12" x2="19" y2="12"/>'),
    download: svgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
    clock: svgIcon('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>'),
    code: svgIcon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
    printer: svgIcon('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
    branch: svgIcon('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
    info: svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
    tip: svgIcon('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>'),
    important: svgIcon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="12" y1="14" x2="12.01" y2="14"/>'),
    warning: svgIcon('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    caution: svgIcon('<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
    database: svgIcon('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
    exchange: svgIcon('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    arrowRight: svgIcon('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
    arrowLeft: svgIcon('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),
    arrowUp: svgIcon('<polyline points="18 15 12 9 6 15"/>'),
    arrowDown: svgIcon('<polyline points="6 9 12 15 18 9"/>'),
  };

  // Preact component for icons in htm markup.
  const Icon = ({ name }) => html`<span class="icon-wrap" dangerouslySetInnerHTML=${{ __html: ICON[name] || '' }}></span>`;

  /* ================================================================
     Pure helpers, fence renderers, and hydration — framework-agnostic.
     ================================================================ */

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Fence sources travel to hydration inside data-* attributes. They're stored
  // base64-encoded because DOMPurify's mXSS guard strips an attribute value that
  // looks like it closes a comment/tag (matches /((--!?|])>)|<\/(style|title)/i)
  // — mermaid source commonly contains `-->` arrows; base64 is always attr-safe.
  function encodeSrc(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (const byte of bytes) bin += String.fromCharCode(byte);
    return btoa(bin);
  }
  function decodeSrc(b64) {
    if (!b64) return '';
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      return '';
    }
  }

  function fmtTime(ms) {
    const d = new Date(ms);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // A section comment's stable key: its stored slug, else one derived from the
  // heading title (back-compat with early comments keyed by raw heading title).
  function commentSlug(c) {
    return slugify(c.section || c.title || '');
  }

  // First real H1, skipping any `#` line inside a fenced code block (mirrors the
  // server's firstH1 and the linter's inFence tracking).
  function firstH1Text(md) {
    let inFence = false;
    for (const line of (md || '').split('\n')) {
      if (/^```/.test(line)) { inFence = !inFence; continue; }
      if (!inFence) {
        const m = line.match(/^#\s+(.+)$/);
        if (m) return m[1].trim();
      }
    }
    return null;
  }

  /** Stable short id for a component, derived from its source (FNV-1a → base36).
      Same source → same id across re-renders. It is a display-only reference —
      shown in the comment label and the agent digest so a human/agent can find
      the block by id+hint — not a live anchor the viewer resolves back to the
      DOM. Identical fence source yields the same id (the ordinal in the label
      disambiguates duplicates for the reader). */
  function blockHash(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(36).padStart(7, '0').slice(-7);
  }

  /** First non-empty line of a source, trimmed and clamped — a human/agent-
      readable hint for locating a component in the markdown. Angle brackets are
      stripped so the value can't trip DOMPurify's mXSS attribute guard (which
      strips values that look like they close a comment/tag). */
  function blockHint(code) {
    const line = (code.split('\n').find((l) => l.trim()) || '').trim().replace(/[<>]/g, '');
    return line.length > 50 ? line.slice(0, 50) + '…' : line;
  }

  /** The `data-block-*` attributes every component block carries, so its comment
      anchor can reference the exact block by a stable id plus a source hint. */
  function blockAttrs(code) {
    return `data-block-id="${blockHash(code)}" data-block-hint="${escapeHTML(blockHint(code))}"`;
  }

  async function api(path, opts) {
    const res = await fetch(path, opts);
    if (!res.ok) {
      // Surface the server's specific reason ({error: "..."}) so callers can show
      // it, instead of a bare status the user can't act on.
      let serverMessage = '';
      try { serverMessage = (await res.json()).error || ''; } catch { /* no JSON body */ }
      const err = new Error(serverMessage || `${res.status} ${res.statusText}`);
      err.status = res.status;
      err.serverMessage = serverMessage;
      throw err;
    }
    return res.json();
  }

  /* ---------- persisted preferences (server-backed, cross-session) ----------
     The server binds a random port each start, so localStorage (origin-keyed)
     does NOT survive across sessions — it silently resets every restart. The
     server also persists a flat preferences object outside the served dir
     (see prefsFile()/PREF_SCHEMA in lib/server.js) that survives restarts and
     origins. Each preference keeps its own localStorage mirror for an instant,
     network-free value at boot; readLocalPref/writeLocalPref/setPref are the
     one place that talks to both. */
  const PREF_LOCAL_KEYS = {
    viewMode: 'vd-view-mode',
    theme: 'vd-theme',
    navOpen: 'vd-nav-open',
    sidebarTab: 'vd-sidebar-tab',
  };

  /** Read a preference's localStorage mirror, or `undefined` if never set.
      Booleans are stored as the strings 'true'/'false' and coerced back. */
  function readLocalPref(key) {
    const raw = localStorage.getItem(PREF_LOCAL_KEYS[key]);
    if (raw === null) return undefined;
    return raw === 'true' ? true : raw === 'false' ? false : raw;
  }

  function writeLocalPref(key, value) {
    localStorage.setItem(PREF_LOCAL_KEYS[key], String(value));
  }

  /** Update the localStorage mirror immediately (instant, synchronous) and
      fire-and-forget POST the single changed key to the server. The viewer
      must keep working even offline or if the write fails — no user-visible
      error, just a preference that won't survive this session. */
  function setPref(key, value) {
    writeLocalPref(key, value);
    api('/api/prefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  }

  /* ---------- global view-mode (diff/migration unified ⇄ side-by-side) ----------
     One preference drives every diff and migration toolbar on the page. `null`
     means "no preference yet" — each component falls back to its own historical
     default (diff → unified, migration → side-by-side). Once the user clicks any
     toggle, the choice is global and persists (localStorage for instant boot,
     the server for cross-session/cross-agent survival). */
  let currentViewMode = readLocalPref('viewMode') === 'side-by-side' ? 'side-by-side'
    : readLocalPref('viewMode') === 'unified' ? 'unified' : null;

  /** Apply `mode` ('unified' | 'side-by-side') to every diff and migration block
      currently in the DOM, sync their toolbar buttons, persist the choice, and
      remember it as the default for blocks hydrated later (live reload, nav). */
  function applyViewMode(mode) {
    currentViewMode = mode;
    const diffMode = mode === 'side-by-side' ? 'side-by-side' : 'line-by-line';
    document.querySelectorAll('[data-diff]').forEach((block) => {
      block.querySelectorAll('.diff-toolbar button').forEach((b) => b.classList.toggle('active', b.dataset.mode === diffMode));
      if (typeof block._draw === 'function') block._draw(diffMode);
    });
    document.querySelectorAll('.migration-toolbar').forEach((tb) => {
      const block = tb.closest('.migration-block');
      const panes = block && block.querySelector('.mig-updown');
      if (!panes) return;
      tb.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
      panes.classList.toggle('side-by-side', mode === 'side-by-side');
      panes.classList.toggle('unified', mode === 'unified');
    });
    setPref('viewMode', mode);
  }

  /* ---------- custom fence renderers ---------- */

  // NOTE: the set of structured fence languages dispatched below is mirrored in
  // bin/visual-docs-lint.js (STRUCTURED / NEEDS_INTENT). Adding a fence type here
  // means adding it there too, or the linter won't validate it.
  function renderCodeFence(code, lang) {
    const language = (lang || '').trim().toLowerCase();

    if (language === 'mermaid') {
      // Source lives base64-encoded in a data-* attribute (not a <script>) so it
      // survives HTML sanitization intact; hydrateMermaid decodes it.
      return `<div class="mermaid-block" ${blockAttrs(code)} data-mermaid-source="${encodeSrc(code)}"></div>`;
    }

    if (language === 'diff' || language === 'patch') {
      return renderDiffFence(code);
    }

    if (language === 'migration' || language === 'sql-migration' || language === 'db-migration') {
      return renderMigrationFence(code);
    }

    if (language === 'api' || language === 'http') {
      return renderApiFence(code);
    }

    if (language === 'nomnoml') {
      return `<div class="nomnoml-block" ${blockAttrs(code)} data-nomnoml-source="${encodeSrc(code)}"></div>`;
    }

    if (language === 'openapi' || language === 'swagger') {
      return renderOpenApiFence(code);
    }

    if (language === 'filetree' || language === 'file-tree' || language === 'files') {
      return renderFileTreeFence(code);
    }

    if (language === 'question' || language === 'ask') {
      return renderQuestionFence(code);
    }

    if (language === 'tldr' || language === 'tl;dr' || language === 'summary') {
      // Prose summary rendered as a prominent top-of-doc card. The body markdown
      // is rendered at hydrate time (hydrateTldr), not here, to avoid re-entering
      // marked.parse from inside its own renderer.
      return `<div class="tldr-block" ${blockAttrs(code)} data-tldr-source="${encodeSrc(code)}"></div>`;
    }

    let inner;
    if (window.hljs && language && window.hljs.getLanguage(language)) {
      try {
        inner = window.hljs.highlight(code, { language }).value;
      } catch {
        inner = escapeHTML(code);
      }
    } else if (window.hljs && !language) {
      try {
        inner = window.hljs.highlightAuto(code).value;
      } catch {
        inner = escapeHTML(code);
      }
    } else {
      inner = escapeHTML(code);
    }
    const tag = language ? `<span class="lang-tag">${escapeHTML(language)}</span>` : '';
    return `<div class="codewrap" ${blockAttrs(code)}>${tag}<pre><code class="hljs">${inner}</code></pre></div>`;
  }

  /** Ensure content parses as a unified diff for diff2html. Handles: a full diff
      (pass through), file headers present but NO `@@` hunk (common for authored
      new-file diffs like `--- /dev/null` + all `+` lines — diff2html can't parse
      these and renders "File without changes"), and a bare +/- snippet with no
      headers at all. In the last two cases we synthesize a hunk header with the
      REAL line counts (a fixed "@@ -1,1 +1,1 @@" botches multi-line/side-by-side)
      while preserving any real file headers so the filename still renders. */
  function normalizeDiff(code) {
    const lines = code.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();

    // Peel contiguous leading file-header lines so we can tell whether a hunk exists.
    const head = [];
    let i = 0;
    while (i < lines.length && /^(diff --git |index |Index: |--- |\+\+\+ )/.test(lines[i])) {
      head.push(lines[i]);
      i++;
    }
    const body = lines.slice(i);

    // Already has a hunk header → diff2html can parse it; just ensure file headers.
    if (body.some((l) => /^@@/.test(l))) {
      const headers = head.length ? head : ['--- a/snippet', '+++ b/snippet'];
      return `${[...headers, ...body].join('\n')}\n`;
    }

    // No hunk header: synthesize one from the real +/- counts.
    let oldC = 0, newC = 0;
    for (const l of body) {
      if (l[0] === '+') newC++;
      else if (l[0] === '-') oldC++;
      else { oldC++; newC++; } // context (incl. unprefixed lines)
    }
    // Recover the file path from any real +++/--- header for the git-style output.
    const pathFrom = (re) => {
      const h = head.find((l) => re.test(l));
      return h ? h.replace(re, '').replace(/^[ab]\//, '').trim() : '';
    };
    const path = pathFrom(/^\+\+\+ /) || pathFrom(/^--- /) || 'snippet';
    // Emit canonical git headers so diff2html badges + parses correctly: a pure
    // addition is a NEW file (`@@ -0,0 +1,N @@`), a pure deletion a DELETED file,
    // otherwise a normal modification. Bare `--- /dev/null` without these markers
    // mis-renders as "RENAMED" / "File without changes".
    let git, hunk;
    if (oldC === 0 && newC > 0) {
      git = [`diff --git a/${path} b/${path}`, 'new file mode 100644', 'index 0000000..1111111', '--- /dev/null', `+++ b/${path}`];
      hunk = `@@ -0,0 +1,${newC} @@`;
    } else if (newC === 0 && oldC > 0) {
      git = [`diff --git a/${path} b/${path}`, 'deleted file mode 100644', 'index 1111111..0000000', `--- a/${path}`, '+++ /dev/null'];
      hunk = `@@ -1,${oldC} +0,0 @@`;
    } else {
      git = [`diff --git a/${path} b/${path}`, 'index 1111111..2222222 100644', `--- a/${path}`, `+++ b/${path}`];
      hunk = `@@ -1,${oldC} +1,${newC} @@`;
    }
    return `${[...git, hunk, ...body].join('\n')}\n`;
  }

  function renderDiffFence(code) {
    return `<div class="diff-block" ${blockAttrs(code)} data-diff data-diff-source="${encodeSrc(code)}">
      <div class="diff-toolbar">
        <span class="tb-label">diff</span>
        <button type="button" data-mode="line-by-line" class="active">unified</button>
        <button type="button" data-mode="side-by-side">side by side</button>
      </div>
      <div class="diff-body"></div>
    </div>`;
  }

  function renderPlainDiff(code) {
    const lines = code.split('\n').map((l) => {
      const esc = escapeHTML(l) || '&nbsp;';
      if (/^(\+\+\+|---|@@|diff |index )/.test(l)) return `<span class="meta">${esc}</span>`;
      if (l.startsWith('+')) return `<span class="add">${esc}</span>`;
      if (l.startsWith('-')) return `<span class="del">${esc}</span>`;
      return `<span class="ctx">${esc}</span>`;
    });
    return `<pre class="plain-diff">${lines.join('')}</pre>`;
  }

  /** Split a migration fence into up/down sections. Recognizes:
      "-- up" / "-- down", "-- +migrate Up/Down" (sql-migrate),
      "-- migrate:up" / "-- migrate:down" (dbmate). First fence line may be
      a "-- name: ..." or "-- title: ..." comment used as the block title. */
  function parseMigration(code) {
    const upRe = /^\s*--\s*(\+migrate\s+up|migrate:\s*up|up)\b.*$/i;
    const downRe = /^\s*--\s*(\+migrate\s+down|migrate:\s*down|down)\b.*$/i;
    const titleRe = /^\s*--\s*(?:name|title)\s*:\s*(.+)$/i;
    let title = 'Database migration';
    let target = null;
    const sections = { up: [], down: [], other: [] };
    for (const line of code.split('\n')) {
      const t = line.match(titleRe);
      if (t && target === null) { title = t[1].trim(); continue; }
      if (upRe.test(line)) { target = 'up'; continue; }
      if (downRe.test(line)) { target = 'down'; continue; }
      sections[target || 'other'].push(line);
    }
    const clean = (arr) => arr.join('\n').replace(/^\n+|\n+$/g, '');
    return { title, up: clean(sections.up), down: clean(sections.down), other: clean(sections.other) };
  }

  function highlightSQL(code) {
    if (window.hljs) {
      try { return window.hljs.highlight(code, { language: 'sql' }).value; } catch { /* fall through */ }
    }
    return escapeHTML(code);
  }

  function renderMigrationFence(code) {
    const m = parseMigration(code);
    const pane = (cls, label, sql) =>
      `<div class="migration-pane ${cls}">
        <div class="pane-label">${label}</div>
        <pre><code class="hljs">${highlightSQL(sql)}</code></pre>
      </div>`;
    const bothPanes = m.up && m.down;
    let panes = '';
    let toolbar = '';
    if (m.up || m.down) {
      // Two panes side-by-side only when BOTH exist; a lone up/down pane renders
      // single-column (`unified`) so an irreversible migration has no empty half.
      panes = `<div class="migration-panes mig-updown ${bothPanes ? 'side-by-side' : 'unified'}">
        ${m.up ? pane('up', `${ICON.arrowUp} up — apply`, m.up) : ''}
        ${m.down ? pane('down', `${ICON.arrowDown} down — roll back`, m.down) : ''}
      </div>`;
      if (m.other) {
        panes = `<div class="migration-panes">${pane('up', 'preamble', m.other)}</div>` + panes;
      }
      if (bothPanes) {
        // Same unified / side-by-side toggle idiom as the diff viewer.
        toolbar = `<div class="migration-toolbar">
          <span class="tb-label mono">up / down</span>
          <button type="button" data-mode="side-by-side" class="active">side by side</button>
          <button type="button" data-mode="unified">unified</button>
        </div>`;
      }
    } else {
      panes = `<div class="migration-panes">${pane('up', 'migration', m.other)}</div>`;
    }
    const reversible = bothPanes ? 'reversible' : 'irreversible';
    return `<div class="migration-block" ${blockAttrs(code)}>
      <div class="migration-head">
        <span class="mig-icon">${ICON.database}</span>
        <span class="mig-title">${escapeHTML(m.title)}</span>
        <span class="mig-badge">${reversible}</span>
      </div>
      ${toolbar}
      ${panes}
    </div>`;
  }

  /** Wire the migration up/down side-by-side ⇄ unified toggle. Shares the same
      global view-mode preference as the diff toolbar (see applyViewMode). */
  function hydrateMigrations(container) {
    container.querySelectorAll('.migration-toolbar').forEach((tb) => {
      const block = tb.closest('.migration-block');
      const panes = block && block.querySelector('.mig-updown');
      if (!panes) return;
      tb.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => applyViewMode(btn.dataset.mode === 'unified' ? 'unified' : 'side-by-side'));
      });
      // No global preference yet → this component's historical default (side-by-side).
      const mode = currentViewMode === 'unified' ? 'unified' : 'side-by-side';
      tb.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
      panes.classList.toggle('side-by-side', mode === 'side-by-side');
      panes.classList.toggle('unified', mode === 'unified');
    });
  }

  /* ---------- API request/response fences ---------- */

  const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'];

  function tryPrettyJSON(text) {
    const t = text.trim();
    if (!t || !(t.startsWith('{') || t.startsWith('['))) return null;
    try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return null; }
  }

  function highlightBody(text) {
    const pretty = tryPrettyJSON(text);
    const body = pretty ?? text.trim();
    if (window.hljs) {
      try {
        return window.hljs.highlight(body, { language: pretty ? 'json' : 'plaintext' }).value;
      } catch { /* fall through */ }
    }
    return escapeHTML(body);
  }

  /** Parse an ```api fence: an HTTP exchange in plain or `curl -v` style
      (`>` request lines, `<` response lines). Returns {request, response},
      each {startLine, headers[], body}. */
  function parseApiExchange(code) {
    const lines = code.split('\n');
    const req = { startLine: '', headers: [], body: [] };
    const res = { startLine: '', headers: [], body: [] };
    let target = req;
    let inBody = false;
    for (let raw of lines) {
      let line = raw;
      const curl = line.match(/^([<>])\s?(.*)$/);
      if (curl) {
        const dir = curl[1];
        line = curl[2];
        const next = dir === '>' ? req : res;
        if (next !== target) { target = next; inBody = false; }
      }
      if (/^HTTP\/[\d.]+\s+\d{3}/.test(line.trim())) {
        target = res;
        inBody = false;
        res.startLine = line.trim();
        continue;
      }
      const methodLine = line.match(new RegExp(`^(${METHODS.join('|')})\\s+(\\S+)(\\s+HTTP/[\\d.]+)?$`));
      if (methodLine && !inBody && target === req && !req.startLine) {
        req.startLine = line.trim();
        continue;
      }
      if (!inBody) {
        if (line.trim() === '') {
          if (target.startLine || target.headers.length) inBody = true;
          continue;
        }
        if (/^[A-Za-z][A-Za-z0-9-]*:\s?/.test(line)) {
          target.headers.push(line.trim());
          continue;
        }
        inBody = true;
      }
      target.body.push(line);
    }
    const finish = (x) => ({
      startLine: x.startLine,
      headers: x.headers,
      body: x.body.join('\n').replace(/^\n+|\n+$/g, ''),
    });
    return { request: finish(req), response: finish(res) };
  }

  function methodBadge(method) {
    return `<span class="api-method m-${method.toLowerCase()}">${escapeHTML(method)}</span>`;
  }

  function statusBadge(status) {
    const cls = status >= 500 ? 's-5xx' : status >= 400 ? 's-4xx' : status >= 300 ? 's-3xx' : 's-2xx';
    return `<span class="api-status ${cls}">${status}</span>`;
  }

  function renderApiHalf(kind, part) {
    if (!part.startLine && !part.headers.length && !part.body) return '';
    let head = '';
    if (kind === 'request') {
      const m = part.startLine.match(/^(\S+)\s+(\S+)/);
      head = m
        ? `${methodBadge(m[1])}<code class="api-path">${escapeHTML(m[2])}</code>`
        : `<code class="api-path">${escapeHTML(part.startLine)}</code>`;
    } else {
      const m = part.startLine.match(/^HTTP\/[\d.]+\s+(\d{3})\s*(.*)$/);
      head = m
        ? `${statusBadge(Number(m[1]))}<span class="api-status-text">${escapeHTML(m[2] || '')}</span>`
        : `<span class="api-status-text">${escapeHTML(part.startLine || 'response')}</span>`;
    }
    const headers = part.headers.length
      ? `<details class="api-headers"><summary class="mono">${part.headers.length} header${part.headers.length > 1 ? 's' : ''}</summary><pre><code class="hljs">${escapeHTML(part.headers.join('\n'))}</code></pre></details>`
      : '';
    const body = part.body
      ? `<pre class="api-body"><code class="hljs">${highlightBody(part.body)}</code></pre>`
      : '';
    return `<div class="api-half api-${kind}">
      <div class="api-half-label mono">${kind === 'request' ? `${ICON.arrowRight} request` : `${ICON.arrowLeft} response`}</div>
      <div class="api-startline">${head}</div>
      ${headers}${body}
    </div>`;
  }

  function renderApiFence(code) {
    const { request, response } = parseApiExchange(code);
    if (!request.startLine && !response.startLine) {
      return `<div class="codewrap" ${blockAttrs(code)}><span class="lang-tag">api</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
    }
    return `<div class="api-block" ${blockAttrs(code)}>${renderApiHalf('request', request)}${renderApiHalf('response', response)}</div>`;
  }

  /* ---------- OpenAPI fences ---------- */

  function parseOpenApiSpec(code) {
    const t = code.trim();
    if (t.startsWith('{')) {
      try { return JSON.parse(t); } catch { return null; }
    }
    if (window.jsyaml) {
      try { return window.jsyaml.load(t); } catch { return null; }
    }
    return null;
  }

  function schemaToText(schema, depth = 0) {
    if (!schema || typeof schema !== 'object' || depth > 6) return String(schema ?? '');
    if (schema.$ref) return schema.$ref.split('/').pop();
    if (schema.type === 'array') return `${schemaToText(schema.items, depth + 1)}[]`;
    if (schema.type === 'object' || schema.properties) {
      const props = Object.entries(schema.properties || {})
        .map(([k, v]) => {
          const req = (schema.required || []).includes(k) ? '*' : '';
          return `${'  '.repeat(depth + 1)}${k}${req}: ${schemaToText(v, depth + 1)}`;
        })
        .join('\n');
      return props ? `{\n${props}\n${'  '.repeat(depth)}}` : 'object';
    }
    let s = schema.type || 'any';
    if (schema.format) s += ` (${schema.format})`;
    if (schema.enum) s += ` ∈ [${schema.enum.join(', ')}]`;
    return s;
  }

  function renderOpenApiOperation(path, method, op) {
    const params = (op.parameters || [])
      .map((p) => {
        const schema = p.schema ? schemaToText(p.schema) : p.type || '';
        return `<tr><td class="mono">${escapeHTML(p.name)}${p.required ? '<span class="oa-req">*</span>' : ''}</td><td class="mono">${escapeHTML(p.in || '')}</td><td class="mono">${escapeHTML(schema)}</td><td>${escapeHTML(p.description || '')}</td></tr>`;
      })
      .join('');
    const paramsTable = params
      ? `<div class="oa-sub mono">parameters</div><table class="oa-table"><thead><tr><th>name</th><th>in</th><th>type</th><th>description</th></tr></thead><tbody>${params}</tbody></table>`
      : '';

    let bodyBlock = '';
    const content = op.requestBody?.content;
    if (content) {
      const [ctype, media] = Object.entries(content)[0] || [];
      if (media?.schema) {
        bodyBlock = `<div class="oa-sub mono">request body · ${escapeHTML(ctype)}</div><pre class="oa-schema"><code>${escapeHTML(schemaToText(media.schema))}</code></pre>`;
      }
    }

    const responses = Object.entries(op.responses || {})
      .map(([codeStr, r]) => {
        const status = Number(codeStr) || 0;
        const badge = status ? statusBadge(status) : `<span class="api-status s-3xx">${escapeHTML(codeStr)}</span>`;
        const rcontent = r?.content && Object.entries(r.content)[0];
        const rschema = rcontent?.[1]?.schema
          ? `<pre class="oa-schema"><code>${escapeHTML(schemaToText(rcontent[1].schema))}</code></pre>`
          : '';
        return `<div class="oa-response">${badge}<span>${escapeHTML(r?.description || '')}</span>${rschema}</div>`;
      })
      .join('');
    const responsesBlock = responses ? `<div class="oa-sub mono">responses</div>${responses}` : '';

    return `<details class="oa-op">
      <summary>${methodBadge(method.toUpperCase())}<code class="api-path">${escapeHTML(path)}</code><span class="oa-summary">${escapeHTML(op.summary || '')}</span></summary>
      <div class="oa-op-body">
        ${op.description ? `<p>${escapeHTML(op.description)}</p>` : ''}
        ${paramsTable}${bodyBlock}${responsesBlock}
      </div>
    </details>`;
  }

  function renderOpenApiFence(code) {
    const spec = parseOpenApiSpec(code);
    if (!spec || typeof spec !== 'object' || !spec.paths) {
      return `<div class="codewrap" ${blockAttrs(code)}><span class="lang-tag">openapi</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
    }
    const title = spec.info?.title || 'API';
    const version = spec.info?.version ? ` · v${spec.info.version}` : '';
    const ops = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!methods || typeof methods !== 'object') continue;
      for (const [method, op] of Object.entries(methods)) {
        if (!METHODS.includes(method.toUpperCase()) || !op || typeof op !== 'object') continue;
        ops.push(renderOpenApiOperation(path, method, op));
      }
    }
    return `<div class="openapi-block" ${blockAttrs(code)}>
      <div class="oa-head">
        <span class="mig-icon">${ICON.exchange}</span>
        <span class="mig-title">${escapeHTML(title)}${escapeHTML(version)}</span>
        <span class="mig-badge">openapi · read-only</span>
      </div>
      ${ops.join('')}
    </div>`;
  }

  /* ---------- file-tree fence ---------- */

  const FILE_FLAGS = {
    a: 'added', m: 'modified', d: 'deleted', r: 'renamed',
    added: 'added', modified: 'modified', changed: 'modified',
    deleted: 'deleted', removed: 'deleted', renamed: 'renamed', moved: 'renamed',
  };

  // Inline-only markdown (bold/italic/code/links) for file descriptions; the
  // result is sanitized by the outer sanitizeHTML pass like all fence output.
  function inlineMarkdown(s) {
    try {
      return window.marked ? window.marked.parseInline(s) : escapeHTML(s);
    } catch {
      return escapeHTML(s);
    }
  }

  /** Render a ` ```filetree ` fence: a "what changed" file map as a striped
      table. Each line is `<flag> <path>  <note>` (flag = A|M|D|R or
      added/modified/deleted/renamed; note optional, separated by 2+ spaces, a
      tab, or " — ", and may use inline markdown). A line starting with `#` is a
      group heading. Shared directories collapse into folder rows so filenames
      shrink to basenames. */
  function renderFileTreeFence(code) {
    // Parse into groups of {flag, path, note} entries.
    const groups = [];
    let cur = { label: null, entries: [] };
    groups.push(cur);
    for (const raw of code.split('\n')) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) continue;
      if (line.trim().startsWith('#')) {
        cur = { label: line.replace(/^\s*#\s?/, ''), entries: [] };
        groups.push(cur);
        continue;
      }
      let flag = '';
      let rest = line.trim();
      const fm = rest.match(/^([A-Za-z]+)\s+(\S.*)$/);
      if (fm && FILE_FLAGS[fm[1].toLowerCase()]) { flag = FILE_FLAGS[fm[1].toLowerCase()]; rest = fm[2]; }
      let path = rest.trim();
      let note = '';
      // A rename ("old -> new") legitimately has spaces inside the path itself,
      // so its "path contains whitespace" isn't a sign of a bad split.
      const isRenameShape = /\s(?:->|→)\s/.test(rest);
      const sp = rest.match(/^(.*?)(?:\s{2,}|\t|\s+—\s+)(.+)$/);
      if (sp && (isRenameShape || !/\s/.test(sp[1].trim()))) {
        path = sp[1].trim();
        note = sp[2].trim();
      } else {
        // Either there was no 2-space/tab/"—" separator, or the primary regex's
        // non-greedy match found one *inside the note* (e.g. a note containing
        // " — ") and swallowed a whitespace-containing prefix as the "path" —
        // a single space typed instead of the real separator is easy to do by
        // accident. Re-split so the note doesn't fold into the path chip: the
        // path is the first whitespace-delimited token when it looks like a
        // path (contains '.' or '/'), and everything after it is the note.
        const renameNote = rest.match(/^(\S+\s*(?:->|→)\s*\S+)\s+(\S.*)$/);
        if (renameNote) {
          path = renameNote[1].trim();
          note = renameNote[2].trim();
        } else if (!isRenameShape) {
          const one = rest.match(/^(\S+)\s+(\S.*)$/);
          if (one && /[./]/.test(one[1])) { path = one[1]; note = one[2].trim(); }
        }
      }
      cur.entries.push({ flag, path, note });
    }
    const used = groups.filter((g) => g.entries.length);

    // Build a directory trie for one group's entries.
    const buildTree = (entries) => {
      const root = { dirs: new Map(), files: [] };
      for (const e of entries) {
        // For renames ("old -> new"), place by the new path. Collapse the shared
        // directory the way plain rows do: show "old.go → new.go" when both sit
        // in the same folder, else "old/path → newbase".
        const arrow = e.path.split(/\s*(?:->|→)\s*/);
        const treePath = arrow.length === 2 ? arrow[1] : e.path;
        const segs = treePath.split('/').filter(Boolean);
        const base = segs.pop();
        let name;
        if (arrow.length === 2) {
          const [oldP, newP] = arrow.map((s) => s.trim());
          const oldBase = oldP.split('/').pop();
          const sameDir = oldP.split('/').slice(0, -1).join('/') === newP.split('/').slice(0, -1).join('/');
          name = sameDir ? `${oldBase} → ${base}` : `${oldP} → ${base}`;
        } else {
          name = base || treePath;
        }
        let node = root;
        for (const seg of segs) {
          if (!node.dirs.has(seg)) node.dirs.set(seg, { dirs: new Map(), files: [] });
          node = node.dirs.get(seg);
        }
        node.files.push({ ...e, name });
      }
      return root;
    };

    const flagBadge = (f) => f
      ? `<span class="ft-flag ft-${f}" title="${f}">${f[0].toUpperCase()}</span>`
      : '<span class="ft-flag ft-none"></span>';

    const fileRow = (f, depth) => {
      const pad = 12 + depth * 18;
      return `<tr class="ft-row">
        <td class="ft-name" style="padding-left:${pad}px"><span class="ft-inner">${flagBadge(f.flag)}<code class="ft-path">${escapeHTML(f.name)}</code></span></td>
        <td class="ft-note">${f.note ? inlineMarkdown(f.note) : ''}</td>
      </tr>`;
    };
    const dirRow = (label, depth) => {
      const pad = 12 + depth * 18;
      return `<tr class="ft-dirrow"><td class="ft-dir" colspan="2" style="padding-left:${pad}px"><span class="ft-inner">${ICON.folder}<span>${escapeHTML(label)}/</span></span></td></tr>`;
    };

    // Render a trie node; collapse single-child directory chains (a/b/c).
    const renderNode = (node, depth) => {
      let out = '';
      for (const [seg, child] of node.dirs) {
        let label = seg;
        let c = child;
        while (c.files.length === 0 && c.dirs.size === 1) {
          const [s2, c2] = c.dirs.entries().next().value;
          label += '/' + s2;
          c = c2;
        }
        out += dirRow(label, depth);
        out += renderNode(c, depth + 1);
      }
      for (const f of node.files) out += fileRow(f, depth);
      return out;
    };

    const rows = used.map((g) => {
      const header = g.label
        ? `<tr class="ft-grouprow"><td class="ft-group" colspan="2">${escapeHTML(g.label)}</td></tr>`
        : '';
      return header + renderNode(buildTree(g.entries), 0);
    }).join('');

    return `<div class="filetree-block" ${blockAttrs(code)}>
      <div class="ft-scroll"><table class="ft-table"><tbody>${rows}</tbody></table></div>
    </div>`;
  }

  /* ---------- agent questions ---------- */

  /** Parse a ` ```question ` fence. First line is the prompt; `- `/`* ` lines are
      options; a lone leading `multiple`/`multi` line makes it multi-select; any
      other non-option lines after the prompt form an optional description. */
  function parseQuestion(code) {
    const lines = code.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
    let multiple = false;
    if (lines.length && /^(multiple|multi|select all( that apply)?)$/i.test(lines[0].trim())) {
      multiple = true;
      lines.shift();
    }
    const question = (lines.shift() || '').trim();
    const options = [];
    const descParts = [];
    for (const l of lines) {
      const m = l.match(/^\s*[-*]\s+(.*)$/);
      if (m && m[1].trim()) options.push(m[1].trim());
      else descParts.push(l.trim());
    }
    return { question, options, multiple, description: descParts.join(' ').trim() };
  }

  function renderQuestionFence(code) {
    const { question, options, multiple, description } = parseQuestion(code);
    if (!question) {
      return `<div class="codewrap" ${blockAttrs(code)}><span class="lang-tag">question</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
    }
    const type = multiple ? 'checkbox' : 'radio';
    // value stays the plain option text (that's the answer we store); the visible
    // label may use inline markdown for emphasis.
    const opts = options.map((o) => `
      <label class="q-option">
        <input type="${type}" name="q-opt" value="${escapeHTML(o)}" />
        <span>${inlineMarkdown(o)}</span>
      </label>`).join('');
    return `<div class="question-block" ${blockAttrs(code)}>
      <div class="q-head">
        <span class="mig-icon">${ICON.help}</span>
        <span class="q-title">${inlineMarkdown(question)}</span>
        ${multiple ? '<span class="q-badge">select any</span>' : ''}
      </div>
      ${description ? `<div class="q-desc">${inlineMarkdown(description)}</div>` : ''}
      <form class="q-form">
        ${opts ? `<div class="q-options">${opts}</div>` : ''}
        <label class="q-other">
          <span class="q-other-label mono">${opts ? 'or write your own' : 'your answer'}</span>
          <input type="text" class="q-other-input" placeholder="Type a custom answer…" />
        </label>
        <div class="q-actions"><button type="submit" class="q-send">Send answer</button></div>
      </form>
      <div class="q-answered" hidden></div>
    </div>`;
  }

  /* ---------- markdown → sanitized HTML ---------- */

  function renderMarkdown(md) {
    if (!window.marked) {
      return `<pre>${escapeHTML(md)}</pre>`;
    }
    const renderer = new window.marked.Renderer();
    renderer.code = (code, infostring) => {
      // Vendored marked is v12.0.2, which calls renderer.code(code, infostring).
      // For a Renderer instance passed as options.renderer (this wiring), v13+
      // already calls renderer.code(token) — a single token object — unconditionally
      // (useNewRenderer only affects renderers registered via marked.use()). Handle
      // both forms so a future vendor bump doesn't break rendering.
      if (typeof code === 'object' && code !== null) {
        return renderCodeFence(code.text || '', code.lang || '');
      }
      return renderCodeFence(code, infostring || '');
    };
    const baseImage = new window.marked.Renderer().image;
    renderer.image = function (href, title, text) {
      if (typeof href === 'string' && !/^([a-z]+:)?\/\//i.test(href) && !href.startsWith('data:') && !href.startsWith('/')) {
        href = `/files/${href}`;
      }
      return baseImage.call(this, href, title, text);
    };
    return window.marked.parse(md, { renderer, gfm: true, breaks: false });
  }

  /** Sanitize rendered markdown before it touches innerHTML. A served document
      is untrusted (e.g. a recap of someone else's branch), so raw <script>,
      event handlers, and javascript: links must be stripped. DOMPurify keeps
      our data-* fence carriers and dangerous-scheme links are dropped. */
  function sanitizeHTML(dirty) {
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(dirty);
    }
    // DOMPurify is vendored and same-origin, so this is effectively unreachable;
    // if it ever fails to load, show escaped source rather than execute markup.
    return `<pre>${escapeHTML(dirty)}</pre>`;
  }

  // SVG-preserving sanitize for the diagram renderers (mermaid/nomnoml). The
  // libraries escape their own output (and mermaid runs securityLevel:'strict'),
  // but their result is injected via innerHTML, so this is a second line of
  // defense that keeps SVG/foreignObject/style intact.
  function sanitizeSvg(dirty) {
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(dirty, {
        USE_PROFILES: { svg: true, svgFilters: true, html: true },
        ADD_TAGS: ['foreignObject', 'style'],
      });
    }
    return `<pre>${escapeHTML(dirty)}</pre>`;
  }

  /* ---------- imperative hydration (runs on a rendered container) ---------- */

  function initMermaid(theme) {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
        // Render labels as SVG <text>, not HTML <foreignObject>. Keeps the
        // diagram a pure vector (no foreignObject) so it can be rasterized to PNG
        // without tainting the canvas; `<br/>` line breaks still work.
        htmlLabels: false,
        flowchart: { htmlLabels: false },
      });
    }
  }

  /** Rasterize a diagram SVG to a PNG and download it. Works because labels are
      SVG <text> (mermaid htmlLabels:false), so there's no <foreignObject> to taint
      the canvas. Rendered at 2× on the diagram card's background colour so it
      reads on its own in light or dark theme. */
  function exportSvgPng(svg) {
    try {
      const clone = svg.cloneNode(true);
      const vb = svg.viewBox && svg.viewBox.baseVal;
      const w = (vb && vb.width) || svg.getBoundingClientRect().width || 800;
      const h = (vb && vb.height) || svg.getBoundingClientRect().height || 600;
      clone.setAttribute('width', w);
      clone.setAttribute('height', h);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.style.maxWidth = 'none';
      clone.style.cursor = '';
      const bg = (svg.parentElement && getComputedStyle(svg.parentElement).backgroundColor) || '#ffffff';
      const xml = new XMLSerializer().serializeToString(clone);
      const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'diagram.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, 'image/png');
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch { /* export unavailable — ignore */ }
  }

  /** Open a diagram's SVG in a full-viewport modal so a dense diagram is
      readable. Clones the already-sanitized SVG and re-namespaces its element
      ids so markers/arrowheads resolve to the clone, not the original in the
      page. Closes on backdrop / X / Esc. */
  function openDiagramModal(svg) {
    const overlay = document.createElement('div');
    overlay.className = 'diagram-modal';
    overlay.innerHTML = `<div class="dm-backdrop"></div><div class="dm-panel">
      <button type="button" class="dm-close" title="Close (Esc)">${ICON.close}</button>
      <div class="dm-stage"></div>
      <div class="dm-toolbar">
        <button type="button" class="dm-out" title="Zoom out (−)">${ICON.minus}</button>
        <span class="dm-level">100%</span>
        <button type="button" class="dm-in" title="Zoom in (+)">${ICON.plus}</button>
        <button type="button" class="dm-fit" title="Fit width (0)">fit</button>
        <span class="dm-sep"></span>
        <button type="button" class="dm-png" title="Download PNG">${ICON.download}</button>
      </div></div>`;
    const clone = svg.cloneNode(true);
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.style.maxWidth = 'none';
    // Duplicate ids (defs/markers/gradients) otherwise resolve to the first copy
    // in the document (the original) — fine when it's visible, but re-namespace to
    // be safe so the enlarged copy is self-contained.
    const suffix = `-dm${Math.random().toString(36).slice(2, 7)}`;
    clone.querySelectorAll('[id]').forEach((el) => {
      const oldId = el.id;
      const newId = oldId + suffix;
      el.id = newId;
      clone.querySelectorAll('*').forEach((ref) => {
        for (const attr of ref.attributes) {
          if (attr.value.includes(`#${oldId}`)) ref.setAttribute(attr.name, attr.value.split(`#${oldId}`).join(`#${newId}`));
        }
      });
    });
    const stage = overlay.querySelector('.dm-stage');
    clone.style.cursor = 'inherit'; // don't inherit the card's zoom-in cursor
    stage.appendChild(clone);
    document.body.appendChild(overlay); // in DOM so stage.clientWidth is measurable

    // Zoom by setting the SVG's real layout width (height auto-follows the
    // viewBox), so the stage's scroll area grows and you can pan — a CSS
    // transform would enlarge visually but not create scrollbars. Default "fit"
    // fills the stage width (like the doc, but the full modal width), so a TALL
    // diagram stays large and scrolls vertically instead of shrinking to height.
    const level = overlay.querySelector('.dm-level');
    let baseW = 1, zoom = 1;
    const apply = () => {
      clone.style.width = `${Math.round(baseW * zoom)}px`;
      clone.style.height = 'auto';
      level.textContent = `${Math.round(zoom * 100)}%`;
    };
    const fit = () => { baseW = Math.max(200, stage.clientWidth - 56); zoom = 1; apply(); };
    const setZoom = (z) => { zoom = Math.min(6, Math.max(0.2, z)); apply(); };
    fit();
    overlay.querySelector('.dm-in').addEventListener('click', () => setZoom(zoom * 1.25));
    overlay.querySelector('.dm-out').addEventListener('click', () => setZoom(zoom * 0.8));
    overlay.querySelector('.dm-fit').addEventListener('click', fit);
    stage.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return; // plain wheel scrolls/pans; ctrl/⌘+wheel zooms
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });
    overlay.querySelector('.dm-png').addEventListener('click', () => exportSvgPng(svg));

    // Drag-to-pan: hold and drag anywhere on the stage to scroll around a
    // zoomed-in diagram (scrollbars and ⌘/ctrl+wheel still work too).
    let panning = false, sx = 0, sy = 0, sl = 0, st = 0;
    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest('.dm-toolbar, .dm-close')) return;
      panning = true; sx = e.clientX; sy = e.clientY; sl = stage.scrollLeft; st = stage.scrollTop;
      stage.classList.add('grabbing');
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!panning) return;
      stage.scrollLeft = sl - (e.clientX - sx);
      stage.scrollTop = st - (e.clientY - sy);
    };
    const onUp = () => { panning = false; stage.classList.remove('grabbing'); };
    stage.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') setZoom(zoom * 1.25);
      else if (e.key === '-' || e.key === '_') setZoom(zoom * 0.8);
      else if (e.key === '0') fit();
    };
    overlay.querySelector('.dm-close').addEventListener('click', close);
    overlay.querySelector('.dm-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  /** A very wide/short diagram (e.g. a long left-to-right flowchart chain)
      scaled down by `max-width:100%` to fit the card can become illegible —
      shrinking a ~300px-tall diagram to fit a 700px-wide card can leave text a
      few px tall. If fitting the diagram to the card would shrink it past a
      legibility floor, keep it at natural size instead and let the card's own
      overflow-x:auto (already set) scroll horizontally. Diagrams that already
      fit (scale >= 1) are left untouched — no gratuitous scrollbars. */
  function fitDiagramSvg(block, svg) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const natW = (vb && vb.width) || rect.width;
    const natH = (vb && vb.height) || rect.height;
    if (!natW || !natH) return;
    const cs = getComputedStyle(block);
    const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0');
    const innerW = Math.max(1, block.clientWidth - padX);
    const scale = innerW / natW;
    // Legibility floor: below ~220px rendered height, or a scale factor below
    // 0.7x, text reads as illegible — chosen from observing a ~290px-tall
    // diagram shrink to ~110px (0.38x) on a 10-node `flowchart LR` chain.
    if (scale < 1 && (natH * scale < 220 || scale < 0.7)) {
      svg.style.maxWidth = 'none';
      svg.style.width = `${natW}px`;
      block.classList.add('diagram-wide');
    }
  }

  /** Give a rendered diagram card a hover "expand" button and click-to-open. */
  function addDiagramExpand(block) {
    const svg = block.querySelector('svg');
    if (!svg || block.querySelector('.diagram-expand')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'diagram-expand';
    btn.title = 'Open full screen';
    btn.innerHTML = ICON.expand;
    btn.addEventListener('click', (e) => { e.stopPropagation(); openDiagramModal(svg); });
    block.appendChild(btn);
    svg.style.cursor = 'zoom-in';
    svg.addEventListener('click', () => openDiagramModal(svg));
  }

  async function hydrateMermaid(container, isCancelled = () => false) {
    const blocks = container.querySelectorAll('.mermaid-block');
    if (!blocks.length) return;
    if (!window.mermaid) {
      for (const b of blocks) {
        b.innerHTML = `<pre style="text-align:left">${escapeHTML(decodeSrc(b.dataset.mermaidSource))}</pre>`;
      }
      return;
    }
    for (const b of blocks) {
      // Bail if the document/theme moved on mid-loop, so a stale run doesn't keep
      // rendering under an outdated theme.
      if (isCancelled()) return;
      const src = decodeSrc(b.dataset.mermaidSource);
      const id = `m-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const { svg } = await window.mermaid.render(id, src);
        if (isCancelled()) return;
        b.innerHTML = sanitizeSvg(svg);
        const svgEl = b.querySelector('svg');
        if (svgEl) fitDiagramSvg(b, svgEl);
        addDiagramExpand(b);
      } catch (err) {
        document.getElementById(`d${id}`)?.remove(); // mermaid leaves an error node behind
        b.innerHTML = `<div class="render-error">mermaid: ${escapeHTML(String(err.message || err))}\n\n${escapeHTML(src)}</div>`;
      }
    }
  }

  function hydrateNomnoml(container) {
    for (const b of container.querySelectorAll('.nomnoml-block')) {
      const src = decodeSrc(b.dataset.nomnomlSource);
      if (!window.nomnoml) {
        b.innerHTML = `<pre style="text-align:left">${escapeHTML(src)}</pre>`;
        continue;
      }
      try {
        b.innerHTML = sanitizeSvg(window.nomnoml.renderSvg(src));
        const svg = b.querySelector('svg');
        if (svg) {
          svg.removeAttribute('width'); svg.removeAttribute('height'); svg.style.maxWidth = '100%';
          fitDiagramSvg(b, svg);
        }
        addDiagramExpand(b);
      } catch (err) {
        b.innerHTML = `<div class="render-error">nomnoml: ${escapeHTML(String(err.message || err))}\n\n${escapeHTML(src)}</div>`;
      }
    }
  }

  // diff2html logs a benign "Failed to parse lines, starting in 0!" to
  // console.error for new-file (`@@ -0,0`) hunks even though it renders them
  // correctly. Swallow only that message so it doesn't masquerade as a real page
  // error during review; everything else passes through untouched.
  function quietDiff2Html(fn) {
    const orig = console.error;
    console.error = (...a) => {
      if (typeof a[0] === 'string' && a[0].includes('Failed to parse lines')) return;
      orig.apply(console, a);
    };
    try { return fn(); } finally { console.error = orig; }
  }

  function hydrateDiffs(container) {
    for (const block of container.querySelectorAll('[data-diff]')) {
      const src = decodeSrc(block.dataset.diffSource);
      const body = block.querySelector('.diff-body');
      const draw = (mode) => {
        if (window.Diff2Html) {
          try {
            body.innerHTML = sanitizeHTML(quietDiff2Html(() => window.Diff2Html.html(normalizeDiff(src), {
              drawFileList: false,
              matching: 'lines',
              outputFormat: mode,
              colorScheme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
            })));
            return;
          } catch { /* fall through */ }
        }
        body.innerHTML = renderPlainDiff(src);
      };
      // Stashed on the element so the global applyViewMode() can redraw this
      // specific block from outside this loop's closure.
      block._draw = draw;
      const buttons = block.querySelectorAll('.diff-toolbar button');
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => applyViewMode(btn.dataset.mode === 'side-by-side' ? 'side-by-side' : 'unified'));
      });
      // No global preference yet → this component's historical default (unified).
      const diffMode = currentViewMode === 'side-by-side' ? 'side-by-side' : 'line-by-line';
      buttons.forEach((b) => b.classList.toggle('active', b.dataset.mode === diffMode));
      draw(diffMode);
    }
  }

  const ADMONITIONS = {
    NOTE: { cls: 'note', label: 'Note', icon: 'info' },
    TIP: { cls: 'tip', label: 'Tip', icon: 'tip' },
    IMPORTANT: { cls: 'important', label: 'Important', icon: 'important' },
    WARNING: { cls: 'warning', label: 'Warning', icon: 'warning' },
    CAUTION: { cls: 'caution', label: 'Caution', icon: 'caution' },
  };

  /** Convert GitHub-style alert blockquotes (`> [!NOTE]` …) into styled callout
      boxes. Runs on the sanitized DOM; a blockquote without a recognized marker
      is left untouched. */
  function hydrateAdmonitions(container) {
    container.querySelectorAll('blockquote').forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first) return;
      // The marker sits in the first text node, e.g. "[!NOTE]" then a <br>.
      let node = first.firstChild;
      while (node && node.nodeType === 3 && !node.nodeValue.trim()) node = node.nextSibling;
      if (!node || node.nodeType !== 3) return;
      const m = node.nodeValue.match(/^\s*\[!(\w+)\]\s*/);
      if (!m) return;
      const def = ADMONITIONS[m[1].toUpperCase()];
      if (!def) return;
      // Strip the marker; drop the node (and a trailing <br>) if nothing remains.
      node.nodeValue = node.nodeValue.slice(m[0].length);
      if (!node.nodeValue.trim()) {
        const next = node.nextSibling;
        node.remove();
        if (next && next.tagName === 'BR') next.remove();
      }
      // Icon-chip callout (Notion's own pattern): [ icon | title + body ].
      const box = document.createElement('div');
      box.className = `admonition adm-${def.cls}`;
      const chip = document.createElement('span');
      chip.className = 'adm-ichip';
      chip.innerHTML = ICON[def.icon];
      const main = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'adm-title';
      title.textContent = def.label;
      const body = document.createElement('div');
      body.className = 'adm-body';
      while (bq.firstChild) body.appendChild(bq.firstChild);
      main.appendChild(title);
      main.appendChild(body);
      box.appendChild(chip);
      box.appendChild(main);
      bq.replaceWith(box);
    });
  }

  /** Render a ```tldr fence's markdown body into a prominent summary card.
      Runs after the empty block is in the DOM (like hydrateMermaid); the body is
      rendered here rather than during the main parse to avoid re-entering
      marked.parse from inside renderCodeFence. */
  function hydrateTldr(container) {
    container.querySelectorAll('.tldr-block').forEach((block) => {
      if (block.dataset.hydrated) return;
      const src = decodeSrc(block.dataset.tldrSource || '');
      const head = document.createElement('div');
      head.className = 'tldr-head';
      const chip = document.createElement('span');
      chip.className = 'tldr-ichip';
      chip.innerHTML = ICON.list;
      const label = document.createElement('span');
      label.className = 'tldr-label';
      label.textContent = 'TL;DR';
      head.appendChild(chip);
      head.appendChild(label);
      const body = document.createElement('div');
      body.className = 'tldr-body';
      body.innerHTML = sanitizeHTML(renderMarkdown(src));
      block.appendChild(head);
      block.appendChild(body);
      block.dataset.hydrated = '1';
    });
  }

  const CALLOUTS = {
    'decision needed': { cls: 'decision', icon: 'branch' },
    'decision': { cls: 'decision', icon: 'branch' },
    'risk': { cls: 'risk', icon: 'warning' },
  };

  /** Convert `> **Decision needed:** …` / `> **Risk:** …` blockquotes into
      icon-chip callouts. Runs after hydrateAdmonitions, on remaining blockquotes;
      keyed on the bolded lead so a plain quote is left untouched. */
  function hydrateCallouts(container) {
    container.querySelectorAll('blockquote').forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first) return;
      const strong = first.querySelector('strong, b');
      if (!strong) return;
      const key = strong.textContent.trim().toLowerCase().replace(/:$/, '');
      const def = CALLOUTS[key];
      if (!def) return;
      const box = document.createElement('div');
      box.className = `callout ${def.cls}`;
      const chip = document.createElement('span');
      chip.className = 'co-ichip';
      chip.innerHTML = ICON[def.icon];
      const body = document.createElement('div');
      body.className = 'co-body';
      while (bq.firstChild) body.appendChild(bq.firstChild);
      box.appendChild(chip);
      box.appendChild(body);
      bq.replaceWith(box);
    });
  }

  /** Fill a question block's "answered" box with the submitted answer and hide
      the form. Idempotent — safe to call on every comment update. */
  function showQuestionAnswered(blk, answer) {
    const form = blk.querySelector('.q-form');
    const box = blk.querySelector('.q-answered');
    if (!form || !box) return;
    form.hidden = true;
    box.hidden = false;
    box.innerHTML = `<span class="q-ans-label mono">${ICON.check} your answer</span>`;
    const ans = document.createElement('span');
    ans.className = 'q-ans';
    ans.textContent = answer; // user text — never as HTML
    box.appendChild(ans);
  }

  /** Wire each ` ```question ` form so submitting sends the answer as a comment
      anchored to the question. onAnswer(anchor, text) does the POST. */
  function hydrateQuestions(container, onAnswer) {
    container.querySelectorAll('.question-block').forEach((blk) => {
      const form = blk.querySelector('.q-form');
      if (!form || form.dataset.wired) return;
      form.dataset.wired = '1';
      const id = blk.dataset.blockId || '';
      const question = blk.querySelector('.q-title')?.textContent || '';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const picked = [...form.querySelectorAll('input[name="q-opt"]:checked')].map((i) => i.value);
        const other = form.querySelector('.q-other-input')?.value.trim();
        if (other) picked.push(other);
        if (!picked.length) return;
        const answer = picked.join('; ');
        onAnswer({ kind: 'component', type: 'question', label: 'question', id, hint: question.slice(0, 120) }, answer);
        showQuestionAnswered(blk, answer);
      });
    });
  }

  /** Reflect already-answered questions (from stored comments) on load/refresh. */
  function markAnsweredQuestions(container, comments) {
    container.querySelectorAll('.question-block').forEach((blk) => {
      const id = blk.dataset.blockId || '';
      const answers = comments.filter((c) => c.anchor && c.anchor.kind === 'component' && c.anchor.type === 'question' && c.anchor.id === id);
      if (answers.length) showQuestionAnswered(blk, answers[answers.length - 1].text);
    });
  }

  // Friendly names for generic blocks, used in the gutter button's label.
  const BLOCK_NAMES = { P: 'paragraph', UL: 'list', OL: 'list', DL: 'list', TABLE: 'table', BLOCKQUOTE: 'note', PRE: 'code', FIGURE: 'figure', HR: 'divider' };

  const COMPONENTS = [
    ['.tldr-block', 'summary'],
    ['.mermaid-block', 'mermaid diagram'],
    ['.nomnoml-block', 'nomnoml diagram'],
    ['.diff-block', 'diff'],
    ['.migration-block', 'migration'],
    ['.api-block', 'API exchange'],
    ['.openapi-block', 'OpenAPI spec'],
    ['.filetree-block', 'file tree'],
  ];

  // Derived from COMPONENTS so there's one source of truth for the block set.
  const COMPONENT_SELECTOR = COMPONENTS.map(([sel]) => sel).join(', ');

  // Components whose text stays readable, so selecting a line inside them to
  // comment on it IS allowed. Everything else in COMPONENTS transforms its
  // content (a diagram, an interactive explorer, a table) and is whole-block-only
  // — deriving OPAQUE_SELECTOR from COMPONENTS means a NEW component type defaults
  // to opaque (the safe choice) until it's explicitly listed as text-preserving.
  const TEXT_PRESERVING = new Set(['.tldr-block', '.diff-block', '.migration-block', '.api-block']);
  const OPAQUE_SELECTOR = [
    ...COMPONENTS.map(([sel]) => sel).filter((sel) => !TEXT_PRESERVING.has(sel)),
    '.question-block', // interactive answer form, not a COMPONENTS entry
  ].join(', ');

  function isInComponent(node) {
    const el = node && (node.nodeType === 3 ? node.parentElement : node);
    return !!(el && el.closest(OPAQUE_SELECTOR));
  }

  /** Give every commentable element a stable handle: H2s get an id, component
      blocks get the .component-block class (for the hover outline). No embedded
      buttons — the single gutter button (setupGutter) is the affordance. */
  function markCommentables(container) {
    for (const h of container.querySelectorAll('h2, h3, h4, h5, h6')) {
      h.id = h.id || slugify(h.textContent.trim());
    }
    for (const sel of [...COMPONENTS.map(([s]) => s), '.codewrap']) {
      container.querySelectorAll(sel).forEach((blk) => blk.classList.add('component-block'));
    }
  }

  /** The one floating "comment" button, shared by the text-selection affordance
      and the gutter (heading/component) affordance so they look identical. The
      caller adds a positioning modifier (`pos-selection` fixed-to-page /
      `pos-gutter` fixed-to-viewport) and drives visibility via `hidden`. */
  function makeCommentButton(posClass) {
    const btn = document.createElement('button');
    btn.className = `floating-comment-btn ${posClass}`;
    btn.type = 'button';
    btn.hidden = true;
    return btn;
  }
  function setCommentButtonLabel(btn, label, count = 0) {
    btn.innerHTML = ICON.comment
      + `<span class="fcb-label">${escapeHTML(label)}</span>`
      + (count ? `<span class="fcb-count">${count}</span>` : '');
  }

  /** Build a component comment anchor from an element — the single shape used by
      every commentable block (COMPONENTS types and the code-block special case). */
  function makeComponentAnchor(type, label, el) {
    return { kind: 'component', type, label, id: el.dataset.blockId || '', hint: el.dataset.blockHint || '' };
  }

  /** Resolve a component block to its comment anchor (type + ordinal label +
      stable id + hint), matching the "commented on component X" behaviour. */
  function componentAnchorFor(container, el) {
    for (const [sel, typeName] of COMPONENTS) {
      if (!el.matches(sel)) continue;
      const blocks = [...container.querySelectorAll(sel)];
      const i = blocks.indexOf(el);
      const label = blocks.length > 1 ? `${typeName} #${i + 1}` : typeName;
      return makeComponentAnchor(typeName, label, el);
    }
    return null;
  }

  /** Highlight the quoted span of every text-anchored comment, so the reader can
      always see what's been commented on — the highlight persists for the life of
      the comment (new → acknowledged → resolved), resolved ones rendered a touch
      softer. Idempotent: unwraps prior marks first. Quotes that span multiple
      nodes are left unhighlighted (the comment still shows in the drawer). */
  function applyTextHighlights(container, comments, onOpen) {
    const existing = container.querySelectorAll('mark.comment-highlight');
    const active = comments.filter((c) => c.anchor && c.anchor.kind === 'text');
    // Nothing to draw and nothing drawn before — skip the whole-document tree walk.
    if (!active.length && !existing.length) return;
    existing.forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
    for (const c of active) {
      const best = bestQuoteMatch(container, c.anchor);
      if (!best) continue;
      try {
        const range = document.createRange();
        range.setStart(best.node, best.idx);
        range.setEnd(best.node, best.idx + c.anchor.quote.length);
        const mark = document.createElement('mark');
        mark.className = `comment-highlight st-${commentStatus(c)}`;
        mark.title = c.text;
        mark.addEventListener('click', () => onOpen());
        range.surroundContents(mark);
      } catch { /* range not wrappable — skip */ }
    }
  }

  /** Find the occurrence of anchor.quote whose surrounding text best matches the
      stored prefix/suffix, so a phrase that appears more than once highlights
      the one the reader actually selected. Returns {node, idx} or null. */
  function bestQuoteMatch(container, anchor) {
    const { quote, prefix = '', suffix = '' } = anchor;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (isInComponent(n.parentElement)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.includes(quote) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    let best = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const v = node.nodeValue;
      for (let idx = v.indexOf(quote); idx !== -1; idx = v.indexOf(quote, idx + 1)) {
        // Score by how many trailing chars of prefix / leading chars of suffix
        // match the text immediately around this occurrence.
        const before = v.slice(0, idx);
        const after = v.slice(idx + quote.length);
        let score = 0;
        for (let k = 1; k <= prefix.length && before.endsWith(prefix.slice(prefix.length - k)); k++) score = k;
        let s2 = 0;
        for (let k = 1; k <= suffix.length && after.startsWith(suffix.slice(0, k)); k++) s2 = k;
        score += s2;
        if (!best || score > best.score) best = { node, idx, score };
      }
    }
    return best;
  }

  /** Human label for what a comment (or a pending drawer target) is anchored to.
      One source of truth used by the drawer context line, the comment list, and
      the copy-as-prompt text, so the same comment is never labelled two ways. */
  // Comment lifecycle state. Prefers explicit `status`; falls back to the legacy
  // `resolved` boolean. Mirrors commentStatus() in the server.
  const COMMENT_STATUSES = ['new', 'acknowledged', 'resolved'];
  function commentStatus(c) {
    if (c && COMMENT_STATUSES.includes(c.status)) return c.status;
    return c && c.resolved ? 'resolved' : 'new';
  }

  function commentAnchorLabel(c) {
    if (c.anchor && c.anchor.kind === 'text') {
      const q = c.anchor.quote.replace(/\s+/g, ' ').trim();
      return `“${q.length > 60 ? q.slice(0, 60) + '…' : q}”`;
    }
    if (c.anchor && c.anchor.kind === 'component') {
      // Just the type + stable id in the UI — the code hint is noise here (the
      // agent still gets it in the /agent digest to locate the block).
      const base = c.anchor.label || c.anchor.type;
      return c.anchor.id ? `${base} #${c.anchor.id}` : base;
    }
    if (c.title || c.section) return `§ ${c.title || c.section}`;
    return '';
  }

  /* ---------- feedback helpers ---------- */

  /** Best-effort 1-based source line for a comment entry, found by searching the
      raw markdown for a representative string (the quote / fence hint / heading).
      Returns null if not locatable — the anchor still identifies the target. */
  // Reduce a string to lowercase alphanumeric words so a *rendered* quote can be
  // matched against *raw* markdown — bold/italic/`code`/[links]/smart-quotes and
  // other syntax collapse away on both sides. (Mirrors resolveCommentLine on the
  // server; keep the two in sync.)
  function normalizeForLineMatch(s) {
    return (s || '')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) / ![alt](url) -> visible text only
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, '');
  }
  function sourceLineFor(content, entry) {
    if (!content || !entry) return null;
    const a = entry.anchor;
    let raw = '';
    if (a && a.kind === 'text') raw = a.quote;
    else if (a && a.kind === 'component') raw = a.hint;
    else if (entry.title || entry.section) raw = entry.title || entry.section;
    const needle = normalizeForLineMatch(raw).slice(0, 40).trim();
    if (needle.length < 3) return null;
    const norm = content.split('\n').map(normalizeForLineMatch);
    for (let i = 0; i < norm.length; i++) {
      if (norm[i].includes(needle)) return i + 1;
    }
    // The quote may straddle a source line break (soft-wrapped prose); retry
    // across a two-line sliding window before giving up.
    for (let i = 0; i < norm.length - 1; i++) {
      if (`${norm[i]} ${norm[i + 1]}`.includes(needle)) return i + 1;
    }
    return null;
  }

  function buildPrompt(path, entries) {
    const lines = [`Please revise the visual doc \`${path}\` based on this feedback:`, ''];
    for (const e of entries) {
      const label = commentAnchorLabel(e);
      const loc = `${path}${e.line ? `:${e.line}` : ''}`;
      const head = label ? `${loc} · on ${label}` : loc;
      lines.push(`- [${head}] ${e.text}`);
    }
    lines.push('', 'Update the markdown file in place; the viewer live-reloads.');
    return lines.join('\n');
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ================================================================
     Components
     ================================================================ */

  function Sidebar({ docs, current, outline, conn, theme, open, tab, onTabChange, onToggleTheme, onExpand, onCollapse }) {
    // Outline (this doc's sections) vs Docs (the other files). Default to the
    // outline — a short-doc set rarely needs a file list, but a table of contents
    // is always useful. Lifted to App (as `sidebarTab`) so it can be persisted.
    const setTab = onTabChange;
    const scrollToHeading = (id) => {
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // Show the icon of the mode you'll switch TO.
    const themeIcon = theme === 'dark' ? 'sun' : 'moon';

    // Collapsed: a thin clickable rail on the left edge that reopens the sidebar.
    if (!open) {
      return html`
        <aside id="sidebar" class="collapsed">
          <button class="side-rail" title="Open document list" aria-label="Open document list" onClick=${onExpand}>
            <span class="rail-icon"><${Icon} name="doc" /></span>
            <${Icon} name="chevronRight" />
            <span class="rail-label">documents</span>
          </button>
        </aside>`;
    }

    const connLabel = conn === 'on' ? 'updates automatically as agents edit' : conn === 'off' ? 'reconnecting…' : 'connecting…';
    const connTitle = conn === 'on'
      ? 'This page refreshes on its own whenever an agent edits the document file — no reload needed.'
      : conn === 'off' ? 'Lost the live-update connection — retrying.' : 'Connecting to the live-update stream…';
    return html`
      <aside id="sidebar">
        <header class="side-head">
          <span class="side-mark"><${Icon} name="doc" /></span>
          <div class="side-head-titles">
            <div class="side-title">Visual Docs</div>
            <div class="side-sub mono">local · live</div>
          </div>
          <button id="theme-toggle" class="side-icon-btn" title=${`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle theme" onClick=${onToggleTheme}><${Icon} name=${themeIcon} /></button>
          <button id="nav-collapse" class="side-icon-btn" title="Collapse sidebar" aria-label="Collapse sidebar" onClick=${onCollapse}><${Icon} name="chevronLeft" /></button>
        </header>
        <div class="side-tabs" data-active=${tab} role="tablist">
          <span class="seg-indicator"></span>
          <button class="seg-btn ${tab === 'outline' ? 'active' : ''}" role="tab" aria-selected=${tab === 'outline'} onClick=${() => setTab('outline')}>Outline</button>
          <button class="seg-btn ${tab === 'docs' ? 'active' : ''}" role="tab" aria-selected=${tab === 'docs'} onClick=${() => setTab('docs')}>Docs${docs.length > 1 ? html` <span class="seg-count">${docs.length}</span>` : ''}</button>
        </div>
        ${tab === 'outline'
          ? html`<nav id="doc-outline" aria-label="Outline">
              ${outline && outline.length
                ? outline.map((h) => html`<button class="ol-item lvl-${h.level}" title=${h.text} onClick=${() => scrollToHeading(h.id)}>${h.text}</button>`)
                : html`<div class="side-empty">No sections in this document.</div>`}
            </nav>`
          : html`<nav id="doc-list" aria-label="Documents">
              ${docs.map((d) => html`
                <a class="doc-link ${d.path === current ? 'active' : ''}" href=${`#/${d.path}`}>
                  <span class="dl-title">${d.title}</span>
                  <span class="dl-path mono">${d.path} · ${fmtTime(d.mtime)}</span>
                </a>`)}
            </nav>`}
        <footer class="side-foot mono" title=${connTitle}>
          <span id="conn-dot" class="dot ${conn === 'on' ? 'on' : conn === 'off' ? 'off' : ''}"></span>
          <span id="conn-label">${connLabel}</span>
        </footer>
      </aside>`;
  }

  function TitleBlock({ doc, openCount, raw, onOpenComments, onToggleRaw, onPrint }) {
    const title = firstH1Text(doc.content) || doc.path.split('/').pop();
    return html`
      <div id="doc-header">
        <div class="pagehead">
          <div class="eyebrow"><${Icon} name="doc" /><span>document</span></div>
          <h1 id="tb-doc-title">${title}</h1>
          <div class="metarow">
            <span class="m mono">${doc.path}</span>
            <span class="m"><${Icon} name="clock" />updated ${fmtTime(doc.mtime)}</span>
            <span class="spacer"></span>
            <button id="tb-raw-btn" class="${raw ? 'active' : ''}" title=${raw ? 'Show the rendered document' : 'Show the raw markdown source'} onClick=${onToggleRaw}><${Icon} name=${raw ? 'doc' : 'code'} />${raw ? 'rendered' : 'raw'}</button>
            <button id="tb-print-btn" title="Print / Save as PDF (document only)" onClick=${onPrint}><${Icon} name="printer" />print</button>
            <button id="tb-comments-btn" onClick=${onOpenComments}><${Icon} name="comment" />${openCount} open</button>
          </div>
        </div>
      </div>`;
  }

  /** Renders sanitized markdown into a Preact-owned-but-manually-managed
      element. Preact never touches the children (the article is empty in its
      vdom), so imperative hydration is safe. */
  function DocView({ doc, comments, theme, raw, onOpenSection, onOpenComponent, onOpenText, onViewComments, onAnswer, onOutline }) {
    const ref = useRef(null);
    const lastPath = useRef(null);
    const commentsRef = useRef(comments);
    commentsRef.current = comments;

    // Body render + fence hydration + component pins: only on doc/theme change.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      let cancelled = false;
      const y = window.scrollY;
      document.documentElement.setAttribute('data-theme', theme);
      // Raw view: dump the untouched markdown source, no rendering/hydration.
      if (raw) {
        el.innerHTML = '<pre class="raw-md"></pre>';
        el.firstChild.textContent = doc.content;
        if (onOutline) onOutline([]); // no headings to outline over raw source
        const changed = lastPath.current !== doc.path;
        lastPath.current = doc.path;
        window.scrollTo(0, changed ? 0 : y);
        return () => { cancelled = true; };
      }
      initMermaid(theme);
      el.innerHTML = sanitizeHTML(renderMarkdown(doc.content));
      const h1 = el.querySelector('h1');
      if (h1) h1.remove(); // title shown in TitleBlock
      hydrateAdmonitions(el);
      hydrateCallouts(el);
      hydrateTldr(el);
      hydrateDiffs(el);
      hydrateMigrations(el);
      hydrateNomnoml(el);
      hydrateQuestions(el, onAnswer);
      markAnsweredQuestions(el, comments);
      // Mark headings/components as commentable (ids + hover class); the gutter
      // button is the affordance. The cancel flag stops a stale async mermaid
      // render from touching a doc/theme that has moved on.
      markCommentables(el);
      // Report the heading outline (h2/h3, with their slug ids) for the sidebar TOC.
      if (onOutline) {
        onOutline([...el.querySelectorAll('h2, h3')].map((h) => ({ level: +h.tagName[1], text: h.textContent.trim(), id: h.id })));
      }
      // Draw comment highlights/answered-state as the LAST step of the rebuild,
      // so this doesn't depend on effect declaration order — the sibling effect
      // below only handles later comment-set changes.
      applyTextHighlights(el, comments, onViewComments);
      hydrateMermaid(el, () => cancelled);
      const changedDoc = lastPath.current !== doc.path;
      lastPath.current = doc.path;
      window.scrollTo(0, changedDoc ? 0 : y);
      return () => { cancelled = true; };
    }, [doc, theme, raw, onAnswer, onViewComments]);

    // Re-apply highlights + answered state when the comment set changes (the doc
    // body is untouched here — the sibling effect above already drew them on
    // doc/theme/raw change).
    useEffect(() => {
      const el = ref.current;
      if (!el || raw) return; // nothing to mark over raw source
      applyTextHighlights(el, comments, onViewComments);
      markAnsweredQuestions(el, comments);
    }, [comments, raw, onViewComments]);

    // Notion-style gutter comment button: a single button that follows the
    // hovered heading or component into the document's right margin, labelled
    // for what it targets. Clicking opens the drawer anchored there.
    useEffect(() => {
      const content = ref.current;
      if (!content || raw) return;
      // A fixed wrapper holds the button plus a faint "or select text" hint.
      const wrap = document.createElement('div');
      wrap.className = 'gutter-comment';
      wrap.hidden = true;
      const btn = makeCommentButton('');
      btn.hidden = false;
      const hint = document.createElement('div');
      hint.className = 'gutter-hint';
      hint.innerHTML = ICON.text + '<span>or highlight text to comment on a phrase</span>';
      wrap.appendChild(btn);
      wrap.appendChild(hint);
      document.body.appendChild(wrap);
      let target = null;
      let action = null;
      let hideTimer = null;
      const clearHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };
      const scheduleHide = () => { clearHide(); hideTimer = setTimeout(() => { wrap.hidden = true; target = null; action = null; }, 200); };

      const place = () => {
        if (!target || wrap.hidden) return;
        const r = target.getBoundingClientRect();
        const cr = content.getBoundingClientRect();
        // Sit just past the TEXT's right edge (content box minus its right
        // padding), not the padded element edge — otherwise the button floats
        // ~70px off the text with a big empty gap.
        const padRight = parseFloat(getComputedStyle(content).paddingRight) || 0;
        let x = cr.right - padRight + 14;
        const maxX = window.innerWidth - wrap.offsetWidth - 10;
        if (x > maxX) x = maxX;
        wrap.style.left = `${Math.round(x)}px`;
        wrap.style.top = `${Math.round(Math.max(12, r.top))}px`;
      };

      // The top-level block child of the document under a node — so every block
      // (paragraph, list, table, heading, component, code…) is a comment target.
      const closestBlock = (node) => {
        let el = node && node.nodeType === 3 ? node.parentElement : node;
        if (!el || !content.contains(el)) return null;
        while (el && el.parentElement !== content) el = el.parentElement;
        return el && el.parentElement === content ? el : null;
      };

      const countComponent = (comments, id) => comments.filter((c) => c.anchor && c.anchor.kind === 'component' && c.anchor.id === id && commentStatus(c) !== 'resolved').length;

      const showFor = (el) => {
        const comments = commentsRef.current;
        if (el.classList.contains('question-block')) { scheduleHide(); return; } // interactive
        let label = '';
        let count = 0;
        if (el.matches(COMPONENT_SELECTOR)) {
          const anchor = componentAnchorFor(content, el);
          if (!anchor) return;
          count = countComponent(comments, anchor.id);
          label = `Comment on ${anchor.label}`;
          action = () => onOpenComponent(anchor);
        } else if (el.classList.contains('codewrap')) {
          const blocks = [...content.querySelectorAll('.codewrap')];
          const i = blocks.indexOf(el);
          const lbl = blocks.length > 1 ? `code block #${i + 1}` : 'code block';
          const anchor = makeComponentAnchor('code block', lbl, el);
          count = countComponent(comments, anchor.id);
          label = `Comment on ${lbl}`;
          action = () => onOpenComponent(anchor);
        } else if (/^H[2-6]$/.test(el.tagName)) {
          const title = el.textContent.trim();
          const slug = slugify(title);
          count = comments.filter((c) => commentSlug(c) === slug && commentStatus(c) !== 'resolved').length;
          const short = title.length > 42 ? title.slice(0, 42) + '…' : title;
          label = `Comment on “${short}”`;
          action = () => onOpenSection(slug, title);
        } else {
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (!text) { scheduleHide(); return; }
          const quote = text.slice(0, 400);
          const name = BLOCK_NAMES[el.tagName] || (el.classList.contains('admonition') ? 'callout' : 'block');
          count = comments.filter((c) => c.anchor && c.anchor.kind === 'text' && c.anchor.quote === quote && commentStatus(c) !== 'resolved').length;
          label = `Comment on this ${name}`;
          action = () => onOpenText({ kind: 'text', quote, prefix: '', suffix: '' });
        }
        target = el;
        setCommentButtonLabel(btn, label, count);
        // The hint only applies where text selection is possible (components
        // exclude it); show it for paragraphs, lists, headings, and code.
        hint.hidden = el.matches(COMPONENT_SELECTOR);
        wrap.hidden = false;
        place();
      };

      const onMove = (e) => {
        if (e.target === wrap || wrap.contains(e.target)) { clearHide(); return; }
        const cand = closestBlock(e.target);
        if (cand) {
          clearHide();
          if (cand !== target) showFor(cand);
        } else {
          scheduleHide();
        }
      };
      const onScroll = () => place();

      content.addEventListener('mousemove', onMove);
      content.addEventListener('mouseleave', scheduleHide);
      wrap.addEventListener('mouseenter', clearHide);
      wrap.addEventListener('mouseleave', scheduleHide);
      btn.addEventListener('click', () => { if (action) action(); });
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
      return () => {
        content.removeEventListener('mousemove', onMove);
        content.removeEventListener('mouseleave', scheduleHide);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
        clearHide();
        wrap.remove();
      };
    }, [doc, raw, onOpenSection, onOpenComponent, onOpenText]);

    // Text-selection → floating "comment" affordance.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const btn = makeCommentButton('pos-selection');
      setCommentButtonLabel(btn, 'Comment');
      document.body.appendChild(btn);
      let captured = null;
      const hide = () => { btn.hidden = true; captured = null; };
      const onMouseUp = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return hide();
        const range = sel.getRangeAt(0);
        if (!el.contains(range.commonAncestorContainer) || isInComponent(range.commonAncestorContainer)) return hide();
        const quote = sel.toString().trim();
        if (quote.length < 2) return hide();
        const sc = range.startContainer, ec = range.endContainer;
        const prefix = sc.nodeType === 3 ? sc.nodeValue.slice(Math.max(0, range.startOffset - 40), range.startOffset) : '';
        const suffix = ec.nodeType === 3 ? ec.nodeValue.slice(range.endOffset, range.endOffset + 40) : '';
        captured = { quote, prefix, suffix };
        const rect = range.getBoundingClientRect();
        btn.style.top = `${window.scrollY + rect.bottom + 6}px`;
        btn.style.left = `${window.scrollX + rect.left}px`;
        btn.hidden = false;
      };
      const onBtnClick = () => {
        if (captured) {
          onOpenText({ kind: 'text', quote: captured.quote, prefix: captured.prefix, suffix: captured.suffix });
          window.getSelection().removeAllRanges();
          hide();
        }
      };
      // Use contains(), not ===: the button has child nodes (icon svg + label),
      // so a click lands on a descendant — `e.target !== btn` would hide the
      // button on mousedown, before its own click could fire.
      const onDocMouseDown = (e) => { if (!btn.contains(e.target)) hide(); };
      el.addEventListener('mouseup', onMouseUp);
      btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep the selection alive
      btn.addEventListener('click', onBtnClick);
      document.addEventListener('mousedown', onDocMouseDown);
      return () => {
        el.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousedown', onDocMouseDown);
        btn.remove();
      };
    }, [doc, onOpenText]);

    return html`<article id="content" class="markdown-body" ref=${ref}></article>`;
  }

  function DocFooter() {
    return html`
      <footer id="doc-footer">
        <span>Rendered with <a href="https://github.com/patrickdappollonio/claude-plugins" target="_blank" rel="noopener noreferrer">visual-docs</a></span>
        <span class="foot-sep">·</span>
        <span>by <a href="https://www.patrickdap.com" target="_blank" rel="noopener noreferrer">Patrick D'appollonio</a></span>
      </footer>`;
  }

  function EmptyContent({ message, detail }) {
    return html`
      <article id="content" class="markdown-body">
        <div class="empty-state">
          <p class="mono">${message}</p>
          ${detail ? html`<p>${detail}</p>` : null}
        </div>
      </article>`;
  }

  function CommentDrawer({ open, target, comments, status, onExpand, onCollapse, onClearTarget, onSubmit, onCopy }) {
    const textRef = useRef(null);
    const t = target || {};
    // What's being commented on. Text anchors show the quote itself; section and
    // component anchors show a short label.
    const pendingQuote = t.anchor && t.anchor.kind === 'text' ? t.anchor.quote : '';
    const contextLabel = pendingQuote ? '' : commentAnchorLabel(t);
    const hasTarget = !!(pendingQuote || contextLabel);
    const openCount = comments.filter((c) => commentStatus(c) !== 'resolved').length;
    useEffect(() => {
      if (open && textRef.current) textRef.current.focus();
    }, [open, contextLabel, pendingQuote]);

    // Collapsed: a thin clickable rail on the right edge that reopens the panel.
    if (!open) {
      return html`
        <aside id="comment-drawer" class="collapsed">
          <button class="comment-rail" title="Open comments" aria-label="Open comments" onClick=${onExpand}>
            <span class="rail-icon"><${Icon} name="comment" /></span>
            <${Icon} name="chevronLeft" />
            ${openCount > 0 ? html`<span class="rail-count">${openCount}</span>` : null}
            <span class="rail-label">comments</span>
          </button>
        </aside>`;
    }

    const submit = (e) => {
      e.preventDefault();
      const text = textRef.current.value.trim();
      if (!text) return;
      onSubmit(text);
      textRef.current.value = '';
    };
    const copy = () => onCopy(textRef.current.value.trim());

    // Newest first, but keep resolved comments sunk to the bottom.
    const rank = { new: 0, acknowledged: 1, resolved: 2 };
    const ordered = comments
      .map((c, i) => ({ c, i }))
      .sort((a, b) => (rank[commentStatus(a.c)] - rank[commentStatus(b.c)]) || (b.i - a.i))
      .map((x) => x.c);
    const statusLabel = { new: 'new', acknowledged: 'acknowledged', resolved: 'resolved' };
    return html`
      <aside id="comment-drawer">
        <header class="drawer-head">
          <span class="mono tb-label">comments</span>
          <button id="drawer-close" class="side-icon-btn" title="Collapse comments panel" aria-label="Collapse comments panel" onClick=${onCollapse}><${Icon} name="chevronRight" /></button>
        </header>
        <div id="comment-list">
          ${ordered.length === 0
            ? html`<p class="mono" style="color:var(--ink-soft)">No comments yet. Anything you write here is saved locally and read back by the agent.</p>`
            : ordered.map((c) => {
              const isText = c.anchor && c.anchor.kind === 'text';
              const chip = isText ? '' : commentAnchorLabel(c);
              const st = commentStatus(c);
              return html`
                <div class="comment-item st-${st}">
                  <div class="c-meta">
                    <span class="c-status s-${st}">${statusLabel[st]}</span>
                    ${chip ? html`<span class="c-section">${chip}</span>` : null}
                    <span>${new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  ${isText ? html`<div class="c-quote">“${c.anchor.quote}”</div>` : null}
                  <div class="c-text">${c.text}</div>
                </div>`;
            })}
        </div>
        <form id="comment-form" onSubmit=${submit}>
          ${hasTarget ? html`
            <div id="comment-context">
              <div class="ctx-body mono">
                <span class="ctx-lead">commenting on</span>
                ${pendingQuote
                  ? html`<span class="ctx-quote">“${pendingQuote.length > 90 ? pendingQuote.slice(0, 90) + '…' : pendingQuote}”</span>`
                  : html`<span class="ctx-label">${contextLabel}</span>`}
              </div>
              <button type="button" class="ctx-clear" title="Cancel — comment on the document instead" onClick=${onClearTarget}><${Icon} name="close" /></button>
            </div>` : null}
          <textarea id="comment-text" rows="4" ref=${textRef} placeholder="Leave feedback for the agent… It will read this before revising the document." required></textarea>
          <div class="form-actions">
            <button type="button" id="copy-prompt-btn" class="secondary" title="Copy this feedback as a prompt you can paste to your agent" onClick=${copy}>Copy as prompt</button>
            <button type="submit">Add comment</button>
          </div>
          ${status ? html`<div id="comment-status" class="mono" data-tone=${status.tone}>${status.msg}</div>` : null}
        </form>
      </aside>`;
  }

  /* ================================================================
     App: state, routing, data loading, live reload
     ================================================================ */

  /* No pref saved yet (fresh machine/browser) → keep the OS-level light/dark
     signal, same as before prefs.json existed. Applied to <html data-theme>
     synchronously at the bottom of this file, before Preact ever renders, so
     there's no flash of the wrong theme. */
  function initialTheme() {
    const stored = readLocalPref('theme');
    return stored === 'light' || stored === 'dark' ? stored : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function initialNavOpen() {
    const stored = readLocalPref('navOpen');
    return typeof stored === 'boolean' ? stored : true;
  }

  function initialSidebarTab() {
    return readLocalPref('sidebarTab') === 'docs' ? 'docs' : 'outline';
  }

  function App() {
    const [docs, setDocs] = useState([]);
    const [current, setCurrent] = useState(null);
    const [doc, setDoc] = useState(null); // {path,content,mtime} | {error:true,path} | null
    const [comments, setComments] = useState([]);
    const [theme, setTheme] = useState(initialTheme());
    const [conn, setConn] = useState('connecting');
    // target describes the comment anchor: {section,title} | {anchor} | {} (doc-level)
    const [drawer, setDrawer] = useState({ open: false, target: {} });
    const [status, setStatus] = useState(null);
    const [raw, setRaw] = useState(false);
    const [navOpen, setNavOpenState] = useState(initialNavOpen());
    const [sidebarTab, setSidebarTabState] = useState(initialSidebarTab());
    const [outline, setOutline] = useState([]); // headings of the current doc, for the sidebar TOC
    // What version the server reported it's running vs. what's on disk now —
    // populated from /api/docs and /api/doc responses (never a dedicated fetch).
    const [versionInfo, setVersionInfo] = useState({ serverVersion: null, installedVersion: null });
    const [versionDismissed, setVersionDismissed] = useState(false);

    const currentRef = useRef(current);
    currentRef.current = current;

    const loadDocs = useCallback(async () => {
      try {
        const { docs, serverVersion, installedVersion } = await api('/api/docs');
        setDocs(docs);
        setVersionInfo({ serverVersion: serverVersion ?? null, installedVersion: installedVersion ?? null });
        return docs;
      } catch {
        // Keep the last-known list rather than blanking the sidebar — a failed
        // refresh (e.g. during --restart) shouldn't look like an empty project.
        return null;
      }
    }, []);

    const loadComments = useCallback(async (path) => {
      try {
        const { comments } = await api(`/api/comments?path=${encodeURIComponent(path)}`);
        // Drop the result if the user navigated away while it was in flight.
        if (currentRef.current === path) setComments(comments);
      } catch {
        if (currentRef.current === path) setComments([]);
      }
    }, []);

    // Preferences: each one's localStorage mirror was already applied at
    // module load / initial state (view mode, theme, sidebar) so the first
    // paint never waits on the network. Fetch the server copy once and let it
    // win on a mismatch (e.g. a preference was changed from another
    // machine/session, or this is a fresh browser context with no
    // localStorage at all — the exact case a random per-start port breaks).
    useEffect(() => {
      api('/api/prefs').then((prefs) => {
        if (prefs.viewMode && prefs.viewMode !== currentViewMode) applyViewMode(prefs.viewMode);
        if (prefs.theme === 'light' || prefs.theme === 'dark') {
          setTheme((prev) => {
            if (prefs.theme !== prev) writeLocalPref('theme', prefs.theme);
            return prefs.theme;
          });
        }
        if (typeof prefs.navOpen === 'boolean') {
          setNavOpenState((prev) => {
            if (prefs.navOpen !== prev) writeLocalPref('navOpen', prefs.navOpen);
            return prefs.navOpen;
          });
        }
        if (prefs.sidebarTab === 'outline' || prefs.sidebarTab === 'docs') {
          setSidebarTabState((prev) => {
            if (prefs.sidebarTab !== prev) writeLocalPref('sidebarTab', prefs.sidebarTab);
            return prefs.sidebarTab;
          });
        }
      }).catch(() => { /* offline or first run — keep the local/default values */ });
    }, []);

    // Routing: hash → current path.
    useEffect(() => {
      const onHash = () => {
        const h = location.hash.replace(/^#\//, '');
        if (h) setCurrent(decodeURIComponent(h));
      };
      window.addEventListener('hashchange', onHash);
      onHash();
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // Initial doc list.
    useEffect(() => { loadDocs(); }, [loadDocs]);

    // Auto-open the most recent doc when nothing is selected.
    useEffect(() => {
      if (!current && docs.length) location.hash = `#/${docs[0].path}`;
    }, [docs, current]);

    // Fetch the selected document + its comments.
    useEffect(() => {
      if (!current) return;
      let cancelled = false;
      (async () => {
        try {
          const d = await api(`/api/doc?path=${encodeURIComponent(current)}`);
          if (!cancelled) {
            setDoc(d);
            setVersionInfo({ serverVersion: d.serverVersion ?? null, installedVersion: d.installedVersion ?? null });
          }
        } catch (err) {
          // Distinguish a real 404 from a server/network failure.
          if (!cancelled) setDoc({ error: true, path: current, missing: err && err.status === 404 });
        }
      })();
      loadComments(current);
      return () => { cancelled = true; };
    }, [current, loadComments]);

    // Theme side effects (document attribute, hljs stylesheet). Persistence
    // (localStorage mirror + server) happens explicitly in toggleTheme, not
    // here — this effect also re-runs for printDoc's temporary light-mode
    // flip, which must never overwrite the user's saved preference.
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      const light = document.getElementById('hljs-light');
      const dark = document.getElementById('hljs-dark');
      if (light) light.disabled = theme === 'dark';
      if (dark) dark.disabled = theme !== 'dark';
      initMermaid(theme);
    }, [theme]);

    // Document title.
    useEffect(() => {
      if (doc && !doc.error) {
        document.title = `${firstH1Text(doc.content) || doc.path.split('/').pop()} — Visual Docs`;
      }
    }, [doc]);

    // Live reload over SSE (subscribe once; read current via ref).
    useEffect(() => {
      const es = new EventSource('/api/events');
      es.onopen = () => setConn('on');
      es.onerror = () => setConn('off');
      es.onmessage = async (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        const cur = currentRef.current;
        if (msg.type === 'change') {
          await loadDocs();
          if (cur) {
            try {
              const d = await api(`/api/doc?path=${encodeURIComponent(cur)}`);
              // Only apply if we're still on the doc this fetch was for.
              if (currentRef.current === cur) setDoc(d);
            } catch { /* keep last */ }
          }
        } else if (msg.type === 'comment') {
          if (cur) loadComments(cur); // loadComments self-guards on current path
        }
      };
      return () => es.close();
    }, [loadDocs, loadComments]);

    // Auto-dismiss the comment status line.
    useEffect(() => {
      if (!status) return;
      const t = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(t);
    }, [status]);

    // Reset to the rendered view whenever the document changes.
    useEffect(() => setRaw(false), [current]);

    const toggleTheme = () => setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      setPref('theme', next);
      return next;
    });
    const setNavOpen = (v) => { setNavOpenState(v); setPref('navOpen', v); };
    const setSidebarTab = (v) => { setSidebarTabState(v); setPref('sidebarTab', v); };
    const toggleRaw = () => setRaw((r) => !r);
    // Print the rendered document (never raw) in light theme; print CSS hides the
    // shell. Restore the prior theme after the print dialog closes.
    const printDoc = () => {
      setRaw(false);
      const prev = theme;
      if (prev !== 'light') setTheme('light');
      setTimeout(() => {
        window.print();
        if (prev !== 'light') setTheme(prev);
      }, 120);
    };
    const openSection = useCallback((section, title) => setDrawer({ open: true, target: { section, title } }), []);
    const openComponent = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    const openText = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    // Submit an answer to a ```question fence as a comment anchored to it.
    const answerQuestion = useCallback(async (anchor, text) => {
      const cur = currentRef.current;
      if (!cur || !text) return;
      const line = sourceLineFor(doc && doc.content, { anchor });
      try {
        await api('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: cur, anchor, text, ...(line ? { line } : {}) }),
        });
        setStatus({ msg: 'Answer sent — the agent reads it before its next revision.', tone: 'ok' });
        loadComments(cur);
      } catch (err) {
        if (err && err.status >= 400 && err.status < 500 && err.serverMessage) {
          setStatus({ msg: err.serverMessage, tone: 'warn' });
          return;
        }
        const ok = await copyToClipboard(buildPrompt(cur, [{ text, anchor, line }]));
        setStatus({ msg: ok ? 'Saving failed, but the answer was copied — paste it to your agent.' : 'Saving failed and clipboard is unavailable.', tone: 'warn' });
      }
    }, [loadComments, doc]);
    const openComments = useCallback(() => setDrawer({ open: true, target: {} }), []);
    // Collapse resets the target so reopening starts document-level, not on a stale anchor.
    const collapseDrawer = () => setDrawer({ open: false, target: {} });
    // Cancel the pending anchor but keep the drawer open (comment on the doc instead).
    const clearTarget = useCallback(() => setDrawer((d) => ({ ...d, target: {} })), []);

    // Build a comment payload/entry from the current drawer target + text,
    // resolving a best-effort source line so the agent gets file:line context.
    const entryFor = (text) => {
      const t = drawer.target || {};
      const entry = { text, ...(t.section ? { section: t.section, title: t.title } : {}), ...(t.anchor ? { anchor: t.anchor } : {}) };
      const line = sourceLineFor(doc && doc.content, entry);
      if (line) entry.line = line;
      return entry;
    };

    const submitComment = async (text) => {
      const cur = currentRef.current;
      if (!text || !cur) return;
      try {
        await api('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: cur, ...entryFor(text) }),
        });
        setStatus({ msg: 'Saved. The agent reads comments before its next revision.', tone: 'ok' });
        loadComments(cur);
      } catch (err) {
        // A 4xx is a validation problem (too long, bad anchor…) — show the reason
        // rather than pretending the message was lost to a failure.
        if (err && err.status >= 400 && err.status < 500 && err.serverMessage) {
          setStatus({ msg: err.serverMessage, tone: 'warn' });
          return;
        }
        const ok = await copyToClipboard(buildPrompt(cur, [entryFor(text)]));
        setStatus({
          msg: ok
            ? 'Saving failed, but the prompt was copied — paste it to your agent.'
            : 'Saving failed and clipboard is unavailable — copy the text manually.',
          tone: 'warn',
        });
      }
    };

    const copyPrompt = async (draftText) => {
      const cur = currentRef.current;
      // Copy only the still-`new` comments — acknowledged ones are already being
      // worked on, resolved ones are done — unless a draft is being copied.
      const entries = draftText
        ? [entryFor(draftText)]
        : comments.filter((c) => commentStatus(c) === 'new');
      if (!entries.length) {
        setStatus({ msg: draftText ? 'Nothing to copy — write feedback first.' : 'No new comments to copy.', tone: 'warn' });
        return;
      }
      const ok = await copyToClipboard(buildPrompt(cur, entries));
      setStatus({ msg: ok ? 'Prompt copied — paste it to your agent.' : 'Copy failed — select the text manually.', tone: ok ? 'ok' : 'warn' });
    };

    const openCount = comments.filter((c) => commentStatus(c) !== 'resolved').length;
    const versionMismatch = !!(versionInfo.installedVersion && versionInfo.installedVersion !== versionInfo.serverVersion);

    let main;
    if (!doc) {
      main = html`<${EmptyContent} message="No document selected." detail="Pick a document from the sidebar, or write a markdown file into the served directory and it will appear here." />`;
    } else if (doc.error) {
      main = doc.missing
        ? html`<${EmptyContent} message=${`Document not found: ${doc.path}`} />`
        : html`<${EmptyContent} message=${`Couldn't load ${doc.path}`} detail="The server returned an error or is unreachable. Check that it's still running, then reload." />`;
    } else {
      main = html`<${DocView} doc=${doc} comments=${comments} theme=${theme} raw=${raw}
        onOpenSection=${openSection} onOpenComponent=${openComponent}
        onOpenText=${openText} onViewComments=${openComments} onAnswer=${answerQuestion} onOutline=${setOutline} />`;
    }

    return html`
      ${versionMismatch && !versionDismissed ? html`
        <div class="update-banner" role="status">
          <${Icon} name="info" />
          <span>A new version of visual-docs (v${versionInfo.installedVersion}) is installed — restart the server to pick it up.</span>
          <button class="update-banner-dismiss" onClick=${() => setVersionDismissed(true)} aria-label="Dismiss"><${Icon} name="close" /></button>
        </div>` : null}
      <${Sidebar} docs=${docs} current=${current} outline=${outline} conn=${conn} theme=${theme} open=${navOpen}
        tab=${sidebarTab} onTabChange=${setSidebarTab}
        onToggleTheme=${toggleTheme} onExpand=${() => setNavOpen(true)} onCollapse=${() => setNavOpen(false)} />
      <main id="main">
        ${doc && !doc.error ? html`<${TitleBlock} doc=${doc} openCount=${openCount} raw=${raw} onOpenComments=${openComments} onToggleRaw=${toggleRaw} onPrint=${printDoc} />` : null}
        ${main}
        ${doc && !doc.error ? html`<${DocFooter} />` : null}
      </main>
      <${CommentDrawer}
        open=${drawer.open} target=${drawer.target}
        comments=${comments} status=${status}
        onExpand=${openComments} onCollapse=${collapseDrawer} onClearTarget=${clearTarget} onSubmit=${submitComment} onCopy=${copyPrompt} />`;
  }

  /* ---------- boot ---------- */

  document.documentElement.setAttribute('data-theme', initialTheme());
  render(html`<${App} />`, document.getElementById('app'));
})();
