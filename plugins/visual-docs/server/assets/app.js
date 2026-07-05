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
    edit: svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>'),
    sun: svgIcon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svgIcon('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    chevronLeft: svgIcon('<polyline points="15 6 9 12 15 18"/>'),
    chevronRight: svgIcon('<polyline points="9 6 15 12 9 18"/>'),
    close: svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    doc: svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    folder: svgIcon('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    help: svgIcon('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    check: svgIcon('<polyline points="20 6 9 17 4 12"/>'),
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
  // base64-encoded because DOMPurify drops an attribute whose value contains
  // markup-like content (e.g. mermaid's `<-->`); base64 is always attribute-safe.
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

  function firstH1Text(md) {
    const m = (md || '').match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : null;
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
      stripped so the value stays safe in an attribute (DOMPurify drops
      attributes whose value contains markup-like content). */
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
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  /* ---------- custom fence renderers ---------- */

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

  /** Ensure content parses as a unified diff for diff2html; if it's a bare
      +/- snippet without headers, synthesize a minimal header. */
  function normalizeDiff(code) {
    if (/^(diff --git|---[ ]|Index: )/m.test(code)) return code;
    let body;
    if (/^@@/m.test(code)) {
      body = code;
    } else {
      // Synthesize a hunk header with the REAL line counts, so diff2html aligns
      // the two sides correctly (a fixed "@@ -1,1 +1,1 @@" botches multi-line
      // and side-by-side rendering).
      const lines = code.split('\n');
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      let oldC = 0, newC = 0;
      for (const l of lines) {
        if (l[0] === '+') newC++;
        else if (l[0] === '-') oldC++;
        else { oldC++; newC++; } // context (incl. unprefixed lines)
      }
      body = `@@ -${oldC ? 1 : 0},${oldC} +${newC ? 1 : 0},${newC} @@\n${lines.join('\n')}\n`;
    }
    return `--- a/snippet\n+++ b/snippet\n${body}`;
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
    let panes = '';
    if (m.up || m.down) {
      panes = `<div class="migration-panes">
        ${m.up ? pane('up', `${ICON.arrowUp} up — apply`, m.up) : ''}
        ${m.down ? pane('down', `${ICON.arrowDown} down — roll back`, m.down) : ''}
      </div>`;
      if (m.other) {
        panes = `<div class="migration-panes">${pane('up', 'preamble', m.other)}</div>` + panes;
      }
    } else {
      panes = `<div class="migration-panes">${pane('up', 'migration', m.other)}</div>`;
    }
    const reversible = m.up && m.down ? 'reversible' : 'irreversible';
    return `<div class="migration-block" ${blockAttrs(code)}>
      <div class="migration-head">
        <span class="mig-icon">${ICON.database}</span>
        <span class="mig-title">${escapeHTML(m.title)}</span>
        <span class="mig-badge">${reversible}</span>
      </div>
      ${panes}
    </div>`;
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
      return `<div class="codewrap"><span class="lang-tag">api</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
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
      return `<div class="codewrap"><span class="lang-tag">openapi</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
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
      const sp = rest.match(/^(.*?)(?:\s{2,}|\t|\s+—\s+)(.+)$/);
      if (sp) { path = sp[1].trim(); note = sp[2].trim(); }
      cur.entries.push({ flag, path, note });
    }
    const used = groups.filter((g) => g.entries.length);

    // Build a directory trie for one group's entries.
    const buildTree = (entries) => {
      const root = { dirs: new Map(), files: [] };
      for (const e of entries) {
        // For renames ("old -> new"), place by the new path but keep the label.
        const arrow = e.path.split(/\s*(?:->|→)\s*/);
        const treePath = arrow.length === 2 ? arrow[1] : e.path;
        const segs = treePath.split('/').filter(Boolean);
        const base = segs.pop();
        const name = arrow.length === 2 ? e.path : (base || treePath);
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
      <table class="ft-table"><tbody>${rows}</tbody></table>
    </div>`;
  }

  /* ---------- agent questions ---------- */

  /** Parse a ` ```question ` fence. First line is the prompt; `- `/`* ` lines are
      options; a lone leading `multiple`/`multi` line makes it multi-select. */
  function parseQuestion(code) {
    const lines = code.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
    let multiple = false;
    if (lines.length && /^(multiple|multi|select all( that apply)?)$/i.test(lines[0].trim())) {
      multiple = true;
      lines.shift();
    }
    const question = (lines.shift() || '').trim();
    const options = [];
    for (const l of lines) {
      const m = l.match(/^\s*[-*]\s+(.*)$/);
      if (m && m[1].trim()) options.push(m[1].trim());
    }
    return { question, options, multiple };
  }

  function renderQuestionFence(code) {
    const { question, options, multiple } = parseQuestion(code);
    if (!question) {
      return `<div class="codewrap"><span class="lang-tag">question</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
    }
    const type = multiple ? 'checkbox' : 'radio';
    const opts = options.map((o) => `
      <label class="q-option">
        <input type="${type}" name="q-opt" value="${escapeHTML(o)}" />
        <span>${escapeHTML(o)}</span>
      </label>`).join('');
    return `<div class="question-block" ${blockAttrs(code)}>
      <div class="q-head">
        <span class="mig-icon">${ICON.help}</span>
        <span class="q-title">${escapeHTML(question)}</span>
        ${multiple ? '<span class="q-badge">select any</span>' : ''}
      </div>
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
      // marked v12/v13 call renderer.code(code, infostring) by default; the
      // token-object signature is opt-in in v13 (useNewRenderer) and mandatory
      // in v14+. Handle both so a future vendor bump doesn't break rendering.
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

  /* ---------- imperative hydration (runs on a rendered container) ---------- */

  function initMermaid(theme) {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
      });
    }
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
        b.innerHTML = svg;
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
        b.innerHTML = window.nomnoml.renderSvg(src);
        const svg = b.querySelector('svg');
        if (svg) { svg.removeAttribute('width'); svg.removeAttribute('height'); svg.style.maxWidth = '100%'; }
      } catch (err) {
        b.innerHTML = `<div class="render-error">nomnoml: ${escapeHTML(String(err.message || err))}\n\n${escapeHTML(src)}</div>`;
      }
    }
  }

  function hydrateDiffs(container) {
    for (const block of container.querySelectorAll('[data-diff]')) {
      const src = decodeSrc(block.dataset.diffSource);
      const body = block.querySelector('.diff-body');
      const draw = (mode) => {
        if (window.Diff2Html) {
          try {
            body.innerHTML = window.Diff2Html.html(normalizeDiff(src), {
              drawFileList: false,
              matching: 'lines',
              outputFormat: mode,
              colorScheme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
            });
            return;
          } catch { /* fall through */ }
        }
        body.innerHTML = renderPlainDiff(src);
      };
      const buttons = block.querySelectorAll('.diff-toolbar button');
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.toggle('active', b === btn));
          draw(btn.dataset.mode);
        });
      });
      draw('line-by-line');
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
      const box = document.createElement('div');
      box.className = `admonition adm-${def.cls}`;
      const title = document.createElement('div');
      title.className = 'adm-title';
      title.innerHTML = ICON[def.icon];
      const label = document.createElement('span');
      label.textContent = def.label;
      title.appendChild(label);
      const body = document.createElement('div');
      body.className = 'adm-body';
      while (bq.firstChild) body.appendChild(bq.firstChild);
      box.appendChild(title);
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
    ['.mermaid-block', 'mermaid diagram'],
    ['.nomnoml-block', 'nomnoml diagram'],
    ['.diff-block', 'diff'],
    ['.migration-block', 'migration'],
    ['.api-block', 'API exchange'],
    ['.openapi-block', 'OpenAPI spec'],
    ['.filetree-block', 'file tree'],
  ];

  // Derived from COMPONENTS so there's one source of truth for the block set.
  // A text selection cannot meaningfully sit inside these (they get their own
  // 💬 pin instead). Plain code (.codewrap) is deliberately excluded: selecting
  // a line of code to comment on it is allowed, and it's the only way to comment
  // on an api/openapi fence that failed to parse.
  const COMPONENT_SELECTOR = COMPONENTS.map(([sel]) => sel).join(', ');

  function isInComponent(node) {
    const el = node && (node.nodeType === 3 ? node.parentElement : node);
    // .question-block is interactive (answer form), so exclude it from
    // text-selection comments even though it carries no comment pin.
    return !!(el && el.closest(COMPONENT_SELECTOR + ', .question-block'));
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

  /** Resolve a component block to its comment anchor (type + ordinal label +
      stable id + hint), matching the "commented on component X" behaviour. */
  function componentAnchorFor(container, el) {
    for (const [sel, typeName] of COMPONENTS) {
      if (!el.matches(sel)) continue;
      const blocks = [...container.querySelectorAll(sel)];
      const i = blocks.indexOf(el);
      const label = blocks.length > 1 ? `${typeName} #${i + 1}` : typeName;
      return { kind: 'component', type: typeName, label, id: el.dataset.blockId || '', hint: el.dataset.blockHint || '' };
    }
    return null;
  }

  /** Highlight the quoted span of each unresolved text-anchored comment, so the
      reader can see what's been commented on. Idempotent: unwraps prior marks
      first. Quotes that span multiple nodes are left unhighlighted (the comment
      still shows in the drawer). */
  function applyTextHighlights(container, comments, onOpen) {
    container.querySelectorAll('mark.comment-highlight').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
    for (const c of comments) {
      if (!c.anchor || c.anchor.kind !== 'text' || commentStatus(c) === 'resolved') continue;
      const best = bestQuoteMatch(container, c.anchor);
      if (!best) continue;
      try {
        const range = document.createRange();
        range.setStart(best.node, best.idx);
        range.setEnd(best.node, best.idx + c.anchor.quote.length);
        const mark = document.createElement('mark');
        mark.className = 'comment-highlight';
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

  function buildPrompt(path, entries) {
    const lines = [`Please revise the visual doc \`${path}\` based on this feedback:`, ''];
    for (const e of entries) {
      const label = commentAnchorLabel(e);
      lines.push(label ? `- [${label}] ${e.text}` : `- ${e.text}`);
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

  function Sidebar({ docs, current, conn, theme, open, onToggleTheme, onExpand, onCollapse }) {
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
        <nav id="doc-list" aria-label="Documents">
          ${docs.map((d) => html`
            <a class="doc-link ${d.path === current ? 'active' : ''}" href=${`#/${d.path}`}>
              <span class="dl-title">${d.title}</span>
              <span class="dl-path mono">${d.path} · ${fmtTime(d.mtime)}</span>
            </a>`)}
        </nav>
        <footer class="side-foot mono" title=${connTitle}>
          <span id="conn-dot" class="dot ${conn === 'on' ? 'on' : conn === 'off' ? 'off' : ''}"></span>
          <span id="conn-label">${connLabel}</span>
        </footer>
      </aside>`;
  }

  function TitleBlock({ doc, openCount, raw, onOpenComments, onToggleRaw }) {
    const title = firstH1Text(doc.content) || doc.path.split('/').pop();
    return html`
      <div id="doc-header">
        <div class="titleblock">
          <div class="tb-cell tb-title">
            <span class="tb-label mono">document</span>
            <h1 id="tb-doc-title">${title}</h1>
          </div>
          <div class="tb-cell"><span class="tb-label mono">file</span><span id="tb-doc-path" class="mono">${doc.path}</span></div>
          <div class="tb-cell"><span class="tb-label mono">updated</span><span id="tb-doc-mtime" class="mono">${fmtTime(doc.mtime)}</span></div>
          <div class="tb-cell"><span class="tb-label mono">view</span><button id="tb-raw-btn" class="mono ${raw ? 'active' : ''}" title=${raw ? 'Show the rendered document' : 'Show the raw markdown source'} onClick=${onToggleRaw}>${raw ? 'rendered' : 'raw'}</button></div>
          <div class="tb-cell"><span class="tb-label mono">comments</span><button id="tb-comments-btn" class="mono" onClick=${onOpenComments}>${openCount} open</button></div>
        </div>
      </div>`;
  }

  /** Renders sanitized markdown into a Preact-owned-but-manually-managed
      element. Preact never touches the children (the article is empty in its
      vdom), so imperative hydration is safe. */
  function DocView({ doc, comments, theme, raw, onOpenSection, onOpenComponent, onOpenText, onViewComments, onAnswer }) {
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
      hydrateDiffs(el);
      hydrateNomnoml(el);
      hydrateQuestions(el, onAnswer);
      markAnsweredQuestions(el, comments);
      // Mark headings/components as commentable (ids + hover class); the gutter
      // button is the affordance. The cancel flag stops a stale async mermaid
      // render from touching a doc/theme that has moved on.
      markCommentables(el);
      hydrateMermaid(el, () => cancelled);
      const changedDoc = lastPath.current !== doc.path;
      lastPath.current = doc.path;
      window.scrollTo(0, changedDoc ? 0 : y);
      return () => { cancelled = true; };
    }, [doc, theme, raw, onAnswer]);

    // Text highlights + answered-question state: re-applied whenever the comment
    // set changes.
    useEffect(() => {
      const el = ref.current;
      if (!el || raw) return; // nothing to mark over raw source
      applyTextHighlights(el, comments, onViewComments);
      markAnsweredQuestions(el, comments);
      // doc/theme/raw are dependencies (not all read here) only so this effect
      // re-runs AFTER the sibling effect rebuilds el.innerHTML — Preact runs
      // effects in declaration order. Don't drop them.
    }, [doc, comments, theme, raw, onViewComments]);

    // Notion-style gutter comment button: a single button that follows the
    // hovered heading or component into the document's right margin, labelled
    // for what it targets. Clicking opens the drawer anchored there.
    useEffect(() => {
      const content = ref.current;
      if (!content || raw) return;
      const btn = makeCommentButton('pos-gutter');
      document.body.appendChild(btn);
      let target = null;
      let action = null;
      let hideTimer = null;
      const clearHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };
      const scheduleHide = () => { clearHide(); hideTimer = setTimeout(() => { btn.hidden = true; target = null; action = null; }, 200); };

      const place = () => {
        if (!target || btn.hidden) return;
        const r = target.getBoundingClientRect();
        const cr = content.getBoundingClientRect();
        let x = cr.right + 14;
        const maxX = window.innerWidth - btn.offsetWidth - 10;
        if (x > maxX) x = maxX;
        btn.style.left = `${Math.round(x)}px`;
        btn.style.top = `${Math.round(Math.max(12, r.top))}px`;
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
          const anchor = { kind: 'component', type: 'code block', label: lbl, id: el.dataset.blockId || '', hint: el.dataset.blockHint || '' };
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
        btn.hidden = false;
        place();
      };

      const onMove = (e) => {
        if (e.target === btn || btn.contains(e.target)) { clearHide(); return; }
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
      btn.addEventListener('mouseenter', clearHide);
      btn.addEventListener('mouseleave', scheduleHide);
      btn.addEventListener('click', () => { if (action) action(); });
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
      return () => {
        content.removeEventListener('mousemove', onMove);
        content.removeEventListener('mouseleave', scheduleHide);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
        clearHide();
        btn.remove();
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
      const onDocMouseDown = (e) => { if (e.target !== btn) hide(); };
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

  function initialTheme() {
    return localStorage.getItem('vd-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    const [navOpen, setNavOpen] = useState(true);

    const currentRef = useRef(current);
    currentRef.current = current;

    const loadDocs = useCallback(async () => {
      try {
        const { docs } = await api('/api/docs');
        setDocs(docs);
        return docs;
      } catch {
        setDocs([]);
        return [];
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
          if (!cancelled) setDoc(d);
        } catch {
          if (!cancelled) setDoc({ error: true, path: current });
        }
      })();
      loadComments(current);
      return () => { cancelled = true; };
    }, [current, loadComments]);

    // Theme side effects (document attribute, hljs stylesheet, persistence).
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      const light = document.getElementById('hljs-light');
      const dark = document.getElementById('hljs-dark');
      if (light) light.disabled = theme === 'dark';
      if (dark) dark.disabled = theme !== 'dark';
      localStorage.setItem('vd-theme', theme);
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

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    const toggleRaw = () => setRaw((r) => !r);
    const openSection = useCallback((section, title) => setDrawer({ open: true, target: { section, title } }), []);
    const openComponent = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    const openText = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    // Submit an answer to a ```question fence as a comment anchored to it.
    const answerQuestion = useCallback(async (anchor, text) => {
      const cur = currentRef.current;
      if (!cur || !text) return;
      try {
        await api('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: cur, anchor, text }),
        });
        setStatus({ msg: 'Answer sent — the agent reads it before its next revision.', tone: 'ok' });
        loadComments(cur);
      } catch {
        const ok = await copyToClipboard(buildPrompt(cur, [{ text, anchor }]));
        setStatus({ msg: ok ? 'Saving failed, but the answer was copied — paste it to your agent.' : 'Saving failed and clipboard is unavailable.', tone: 'warn' });
      }
    }, [loadComments]);
    const openComments = useCallback(() => setDrawer({ open: true, target: {} }), []);
    // Collapse resets the target so reopening starts document-level, not on a stale anchor.
    const collapseDrawer = () => setDrawer({ open: false, target: {} });
    // Cancel the pending anchor but keep the drawer open (comment on the doc instead).
    const clearTarget = useCallback(() => setDrawer((d) => ({ ...d, target: {} })), []);

    // Build a comment payload/entry from the current drawer target + text.
    const entryFor = (text) => {
      const t = drawer.target || {};
      return { text, ...(t.section ? { section: t.section, title: t.title } : {}), ...(t.anchor ? { anchor: t.anchor } : {}) };
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
      } catch {
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

    let main;
    if (!doc) {
      main = html`<${EmptyContent} message="No document selected." detail="Pick a document from the sidebar, or write a markdown file into the served directory and it will appear here." />`;
    } else if (doc.error) {
      main = html`<${EmptyContent} message=${`Document not found: ${doc.path}`} />`;
    } else {
      main = html`<${DocView} doc=${doc} comments=${comments} theme=${theme} raw=${raw}
        onOpenSection=${openSection} onOpenComponent=${openComponent}
        onOpenText=${openText} onViewComments=${openComments} onAnswer=${answerQuestion} />`;
    }

    return html`
      <${Sidebar} docs=${docs} current=${current} conn=${conn} theme=${theme} open=${navOpen}
        onToggleTheme=${toggleTheme} onExpand=${() => setNavOpen(true)} onCollapse=${() => setNavOpen(false)} />
      <main id="main">
        ${doc && !doc.error ? html`<${TitleBlock} doc=${doc} openCount=${openCount} raw=${raw} onOpenComments=${openComments} onToggleRaw=${toggleRaw} />` : null}
        ${main}
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
