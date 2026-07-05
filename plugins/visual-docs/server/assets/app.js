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

  // A comment's stable section key: prefer its stored slug, else derive one
  // from whatever section/title it was saved with (back-compat with text keys).
  function commentSlug(c) {
    return slugify(c.section || c.title || '');
  }

  function firstH1Text(md) {
    const m = (md || '').match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : null;
  }

  /** Stable short id for a component, derived from its source (FNV-1a → base36).
      Same source → same id across re-renders, so a comment on a diagram keeps
      pointing at it even as the document changes around it. */
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
    return `<div class="codewrap">${tag}<pre><code class="hljs">${inner}</code></pre></div>`;
  }

  /** Ensure content parses as a unified diff for diff2html; if it's a bare
      +/- snippet without headers, synthesize a minimal header. */
  function normalizeDiff(code) {
    if (/^(diff --git|---[ ]|Index: )/m.test(code)) return code;
    const body = /^@@/m.test(code) ? code : `@@ -1,1 +1,1 @@\n${code.replace(/\n?$/, '\n')}`;
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
        ${m.up ? pane('up', '▲ up — apply', m.up) : ''}
        ${m.down ? pane('down', '▼ down — roll back', m.down) : ''}
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
        <span class="mig-icon">⛁</span>
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
      <div class="api-half-label mono">${kind === 'request' ? '→ request' : '← response'}</div>
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
        <span class="mig-icon">⇄</span>
        <span class="mig-title">${escapeHTML(title)}${escapeHTML(version)}</span>
        <span class="mig-badge">openapi · read-only</span>
      </div>
      ${ops.join('')}
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

  async function hydrateMermaid(container) {
    const blocks = container.querySelectorAll('.mermaid-block');
    if (!blocks.length) return;
    if (!window.mermaid) {
      for (const b of blocks) {
        b.innerHTML = `<pre style="text-align:left">${escapeHTML(decodeSrc(b.dataset.mermaidSource))}</pre>`;
      }
      return;
    }
    for (const b of blocks) {
      const src = decodeSrc(b.dataset.mermaidSource);
      const id = `m-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const { svg } = await window.mermaid.render(id, src);
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

  /** Attach a comment pin to every H2, idempotently (safe to re-run when the
      comment set changes without re-rendering the document body). Keyed on the
      stable heading slug so a rename doesn't orphan a comment. */
  function applySectionPins(container, comments, onOpen) {
    container.querySelectorAll('.section-comment-btn').forEach((b) => b.remove());
    for (const h2 of container.querySelectorAll('h2')) {
      const title = h2.textContent.trim();
      const slug = slugify(title);
      h2.id = h2.id || slug;
      const count = comments.filter((c) => commentSlug(c) === slug && !c.resolved).length;
      const btn = document.createElement('button');
      btn.className = 'section-comment-btn' + (count > 0 ? ' has-comments' : '');
      btn.type = 'button';
      btn.textContent = count > 0 ? `✎ ${count}` : '✎ comment';
      btn.title = `Comment on “${title}”`;
      btn.addEventListener('click', () => onOpen(slug, title));
      h2.appendChild(btn);
    }
  }

  // Component blocks can't be text-selected meaningfully, so each gets its own
  // "comment on this component" affordance instead.
  const COMPONENTS = [
    ['.mermaid-block', 'mermaid diagram'],
    ['.nomnoml-block', 'nomnoml diagram'],
    ['.diff-block', 'diff'],
    ['.migration-block', 'migration'],
    ['.api-block', 'API exchange'],
    ['.openapi-block', 'OpenAPI spec'],
  ];

  function isInComponent(node) {
    const el = node && (node.nodeType === 3 ? node.parentElement : node);
    return !!(el && el.closest('.mermaid-block, .nomnoml-block, .diff-block, .migration-block, .api-block, .openapi-block, .codewrap'));
  }

  /** Attach a "💬" affordance to each rendered component block. Anchors a
      comment to that component by type (with an ordinal when several share a
      type), matching the "commented on component X" behaviour. */
  function applyComponentPins(container, onOpen) {
    container.querySelectorAll('.component-comment-btn').forEach((b) => b.remove());
    for (const [sel, typeName] of COMPONENTS) {
      const blocks = container.querySelectorAll(sel);
      blocks.forEach((blk, i) => {
        if (getComputedStyle(blk).position === 'static') blk.style.position = 'relative';
        const label = blocks.length > 1 ? `${typeName} #${i + 1}` : typeName;
        const btn = document.createElement('button');
        btn.className = 'component-comment-btn';
        btn.type = 'button';
        btn.textContent = '💬';
        btn.title = `Comment on this ${typeName}`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onOpen({
            kind: 'component',
            type: typeName,
            label,
            id: blk.dataset.blockId || '',
            hint: blk.dataset.blockHint || '',
          });
        });
        blk.appendChild(btn);
      });
    }
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
      if (!c.anchor || c.anchor.kind !== 'text' || c.resolved) continue;
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (isInComponent(n.parentElement)) return NodeFilter.FILTER_REJECT;
          return n.nodeValue.includes(c.anchor.quote) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      });
      const node = walker.nextNode();
      if (!node) continue;
      const idx = node.nodeValue.indexOf(c.anchor.quote);
      try {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + c.anchor.quote.length);
        const mark = document.createElement('mark');
        mark.className = 'comment-highlight';
        mark.title = c.text;
        mark.addEventListener('click', () => onOpen());
        range.surroundContents(mark);
      } catch { /* range not wrappable — skip */ }
    }
  }

  /** Human label for what a comment is anchored to, for the drawer list. */
  function commentAnchorLabel(c) {
    if (c.anchor && c.anchor.kind === 'text') {
      const q = c.anchor.quote.replace(/\s+/g, ' ').trim();
      return `“${q.length > 60 ? q.slice(0, 60) + '…' : q}”`;
    }
    if (c.anchor && c.anchor.kind === 'component') {
      const base = c.anchor.label || c.anchor.type;
      return c.anchor.id ? `${base} · ${c.anchor.id}` : base;
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

  function Sidebar({ docs, current, conn, onToggleTheme }) {
    const connLabel = conn === 'on' ? 'live reload on' : conn === 'off' ? 'reconnecting…' : 'connecting…';
    return html`
      <aside id="sidebar">
        <header class="side-head">
          <span class="side-mark">▤</span>
          <div>
            <div class="side-title">Visual Docs</div>
            <div class="side-sub mono">local · live</div>
          </div>
          <button id="theme-toggle" title="Toggle theme" aria-label="Toggle theme" onClick=${onToggleTheme}>◐</button>
        </header>
        <nav id="doc-list" aria-label="Documents">
          ${docs.map((d) => html`
            <a class="doc-link ${d.path === current ? 'active' : ''}" href=${`#/${d.path}`}>
              <span class="dl-title">${d.title}</span>
              <span class="dl-path mono">${d.path} · ${fmtTime(d.mtime)}</span>
            </a>`)}
        </nav>
        <footer class="side-foot mono">
          <span id="conn-dot" class="dot ${conn === 'on' ? 'on' : conn === 'off' ? 'off' : ''}"></span>
          <span id="conn-label">${connLabel}</span>
        </footer>
      </aside>`;
  }

  function TitleBlock({ doc, openCount, onOpenComments }) {
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
          <div class="tb-cell"><span class="tb-label mono">comments</span><button id="tb-comments-btn" class="mono" onClick=${onOpenComments}>${openCount} open</button></div>
        </div>
      </div>`;
  }

  /** Renders sanitized markdown into a Preact-owned-but-manually-managed
      element. Preact never touches the children (the article is empty in its
      vdom), so imperative hydration is safe. */
  function DocView({ doc, comments, theme, onOpenSection, onOpenComponent, onOpenText, onViewComments }) {
    const ref = useRef(null);
    const lastPath = useRef(null);

    // Body render + fence hydration + component pins: only on doc/theme change.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const y = window.scrollY;
      document.documentElement.setAttribute('data-theme', theme);
      initMermaid(theme);
      el.innerHTML = sanitizeHTML(renderMarkdown(doc.content));
      const h1 = el.querySelector('h1');
      if (h1) h1.remove(); // title shown in TitleBlock
      hydrateDiffs(el);
      hydrateNomnoml(el);
      // Component pins go on AFTER mermaid resolves, since it replaces innerHTML.
      hydrateMermaid(el).then(() => applyComponentPins(el, onOpenComponent));
      const changedDoc = lastPath.current !== doc.path;
      lastPath.current = doc.path;
      window.scrollTo(0, changedDoc ? 0 : y);
    }, [doc, theme, onOpenComponent]);

    // Section pins + text highlights: re-applied whenever the comment set changes.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      applySectionPins(el, comments, onOpenSection);
      applyTextHighlights(el, comments, onViewComments);
    }, [doc, comments, theme, onOpenSection, onViewComments]);

    // Text-selection → floating "comment" affordance.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const btn = document.createElement('button');
      btn.className = 'selection-comment-btn';
      btn.textContent = '💬 Comment';
      btn.hidden = true;
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

  function CommentDrawer({ open, target, comments, status, onClose, onSubmit, onCopy }) {
    const textRef = useRef(null);
    // Label for the thing being commented on (section, quoted text, component).
    const t = target || {};
    const contextLabel = t.section
      ? `§ ${t.title || t.section}`
      : t.anchor && t.anchor.kind === 'text'
        ? `“${t.anchor.quote.length > 60 ? t.anchor.quote.slice(0, 60) + '…' : t.anchor.quote}”`
        : t.anchor && t.anchor.kind === 'component'
          ? t.anchor.label || t.anchor.type
          : '';
    useEffect(() => {
      if (open && textRef.current) textRef.current.focus();
    }, [open, contextLabel]);

    const submit = (e) => {
      e.preventDefault();
      const text = textRef.current.value.trim();
      if (!text) return;
      onSubmit(text);
      textRef.current.value = '';
    };
    const copy = () => onCopy(textRef.current.value.trim());

    const ordered = comments.slice().reverse();
    return html`
      <aside id="comment-drawer" hidden=${!open}>
        <header class="drawer-head">
          <span class="mono tb-label">comments</span>
          <button id="drawer-close" aria-label="Close comments" onClick=${onClose}>✕</button>
        </header>
        ${contextLabel ? html`<div id="comment-context" class="mono">commenting on ${contextLabel}</div>` : null}
        <div id="comment-list">
          ${ordered.length === 0
            ? html`<p class="mono" style="color:var(--ink-soft)">No comments yet. Anything you write here is saved locally and read back by the agent.</p>`
            : ordered.map((c) => html`
              <div class="comment-item ${c.resolved ? 'resolved' : ''}">
                <div class="c-meta">
                  ${commentAnchorLabel(c) ? html`<span class="c-section">${commentAnchorLabel(c)}</span>` : null}
                  <span>${new Date(c.createdAt).toLocaleString()}</span>
                  ${c.resolved ? html`<span>resolved</span>` : null}
                </div>
                <div>${c.text}</div>
              </div>`)}
        </div>
        <form id="comment-form" onSubmit=${submit}>
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
        setComments(comments);
      } catch {
        setComments([]);
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
            try { setDoc(await api(`/api/doc?path=${encodeURIComponent(cur)}`)); } catch { /* keep last */ }
          }
        } else if (msg.type === 'comment') {
          if (cur) loadComments(cur);
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

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    const openSection = useCallback((section, title) => setDrawer({ open: true, target: { section, title } }), []);
    const openComponent = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    const openText = useCallback((anchor) => setDrawer({ open: true, target: { anchor } }), []);
    const openComments = useCallback(() => setDrawer({ open: true, target: {} }), []);
    const closeDrawer = () => setDrawer((d) => ({ ...d, open: false }));

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
      const entries = draftText
        ? [entryFor(draftText)]
        : comments.filter((c) => !c.resolved);
      if (!entries.length) {
        setStatus({ msg: 'Nothing to copy — write feedback first.', tone: 'warn' });
        return;
      }
      const ok = await copyToClipboard(buildPrompt(cur, entries));
      setStatus({ msg: ok ? 'Prompt copied — paste it to your agent.' : 'Copy failed — select the text manually.', tone: ok ? 'ok' : 'warn' });
    };

    const openCount = comments.filter((c) => !c.resolved).length;

    let main;
    if (!doc) {
      main = html`<${EmptyContent} message="No document selected." detail="Pick a document from the sidebar, or write a markdown file into the served directory and it will appear here." />`;
    } else if (doc.error) {
      main = html`<${EmptyContent} message=${`Document not found: ${doc.path}`} />`;
    } else {
      main = html`<${DocView} doc=${doc} comments=${comments} theme=${theme}
        onOpenSection=${openSection} onOpenComponent=${openComponent}
        onOpenText=${openText} onViewComments=${openComments} />`;
    }

    return html`
      <${Sidebar} docs=${docs} current=${current} conn=${conn} onToggleTheme=${toggleTheme} />
      <main id="main">
        ${doc && !doc.error ? html`<${TitleBlock} doc=${doc} openCount=${openCount} onOpenComments=${openComments} />` : null}
        ${main}
      </main>
      <${CommentDrawer}
        open=${drawer.open} target=${drawer.target}
        comments=${comments} status=${status}
        onClose=${closeDrawer} onSubmit=${submitComment} onCopy=${copyPrompt} />`;
  }

  /* ---------- boot ---------- */

  document.documentElement.setAttribute('data-theme', initialTheme());
  render(html`<${App} />`, document.getElementById('app'));
})();
