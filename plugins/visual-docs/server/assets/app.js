/* Visual Docs client: fetches raw markdown from the local server and renders
   it with marked + mermaid + highlight.js + diff2html, all client-side.
   Renderer libraries are vendored under /assets/vendor (see
   vendor/manifest.json); if one fails to load, blocks degrade to readable
   plain <pre> output. */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const state = {
    docs: [],
    current: null, // relative path of the open doc
    comments: [],
    pendingSection: '',
    mermaidSeq: 0,
  };

  /* ---------- theme ---------- */

  function syncHljsTheme(theme) {
    const light = document.getElementById('hljs-light');
    const dark = document.getElementById('hljs-dark');
    if (light) light.disabled = theme === 'dark';
    if (dark) dark.disabled = theme !== 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    syncHljsTheme(theme);
    localStorage.setItem('vd-theme', theme);
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
      });
    }
    // Re-render current doc so mermaid picks up the theme.
    if (state.current) loadDoc(state.current, { preserveScroll: true });
  }

  function initTheme() {
    const saved = localStorage.getItem('vd-theme');
    const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    syncHljsTheme(theme);
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
      });
    }
    $('#theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  /* ---------- helpers ---------- */

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Read back fence source stored inside <script type="text/plain"> nodes.
      Script content is raw text, so the entities escapeHTML() produced at
      insert time are NOT decoded by the parser and must be undone here. */
  function readFenceSource(el) {
    const ta = document.createElement('textarea');
    ta.innerHTML = el?.textContent || '';
    return ta.value;
  }

  function fmtTime(ms) {
    const d = new Date(ms);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      const id = `mermaid-src-${state.mermaidSeq++}`;
      return `<div class="mermaid-block" data-mermaid-id="${id}"><script type="text/plain" data-mermaid-source>${escapeHTML(code)}</script></div>`;
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
      return `<div class="nomnoml-block"><script type="text/plain" data-nomnoml-source>${escapeHTML(code)}</script></div>`;
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
    const payload = escapeHTML(code);
    return `<div class="diff-block" data-diff>
      <div class="diff-toolbar">
        <span class="tb-label">diff</span>
        <button type="button" data-mode="line-by-line" class="active">unified</button>
        <button type="button" data-mode="side-by-side">side by side</button>
      </div>
      <div class="diff-body"></div>
      <script type="text/plain" data-diff-source>${payload}</script>
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
    return `<div class="migration-block">
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
      each {startLine, headers[], body} or null. */
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
        // Not a header and not blank: treat as body from here on.
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
      // Unparseable: show as plain code so nothing is lost.
      return `<div class="codewrap"><span class="lang-tag">api</span><pre><code class="hljs">${escapeHTML(code)}</code></pre></div>`;
    }
    return `<div class="api-block">${renderApiHalf('request', request)}${renderApiHalf('response', response)}</div>`;
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

  function renderOpenApiOperation(path, method, op, spec) {
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
        ops.push(renderOpenApiOperation(path, method, op, spec));
      }
    }
    return `<div class="openapi-block">
      <div class="oa-head">
        <span class="mig-icon">⇄</span>
        <span class="mig-title">${escapeHTML(title)}${escapeHTML(version)}</span>
        <span class="mig-badge">openapi · read-only</span>
      </div>
      ${ops.join('')}
    </div>`;
  }

  /* ---------- nomnoml diagrams ---------- */

  function hydrateNomnoml(container) {
    for (const b of container.querySelectorAll('.nomnoml-block')) {
      const src = readFenceSource(b.querySelector('[data-nomnoml-source]'));
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

  /* ---------- markdown rendering ---------- */

  function renderMarkdown(md) {
    if (!window.marked) {
      return `<pre>${escapeHTML(md)}</pre>`;
    }
    const renderer = new window.marked.Renderer();
    renderer.code = (code, infostring) => {
      // marked v12 renderer.code(code, infostring); v13+ passes a token object.
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

  async function hydrateMermaid(container) {
    const blocks = container.querySelectorAll('.mermaid-block');
    if (!blocks.length) return;
    if (!window.mermaid) {
      for (const b of blocks) {
        const src = readFenceSource(b.querySelector('[data-mermaid-source]'));
        b.innerHTML = `<pre style="text-align:left">${escapeHTML(src)}</pre>`;
      }
      return;
    }
    for (const b of blocks) {
      const src = readFenceSource(b.querySelector('[data-mermaid-source]'));
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

  function hydrateDiffs(container) {
    for (const block of container.querySelectorAll('[data-diff]')) {
      const src = readFenceSource(block.querySelector('[data-diff-source]'));
      const body = block.querySelector('.diff-body');
      const render = (mode) => {
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
          render(btn.dataset.mode);
        });
      });
      render('line-by-line');
    }
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function hydrateSectionComments(container) {
    for (const h2 of container.querySelectorAll('h2')) {
      const section = h2.textContent.trim();
      h2.id = h2.id || slugify(section);
      const btn = document.createElement('button');
      btn.className = 'section-comment-btn';
      btn.type = 'button';
      const count = state.comments.filter((c) => c.section === section && !c.resolved).length;
      btn.textContent = count > 0 ? `✎ ${count}` : '✎ comment';
      if (count > 0) btn.classList.add('has-comments');
      btn.title = `Comment on “${section}”`;
      btn.addEventListener('click', () => openDrawer(section));
      h2.appendChild(btn);
    }
  }

  /* ---------- documents ---------- */

  async function refreshDocs() {
    const { docs } = await api('/api/docs');
    state.docs = docs;
    const list = $('#doc-list');
    list.innerHTML = '';
    for (const doc of docs) {
      const a = document.createElement('a');
      a.className = 'doc-link' + (doc.path === state.current ? ' active' : '');
      a.href = `#/${doc.path}`;
      a.innerHTML = `<span class="dl-title">${escapeHTML(doc.title)}</span><span class="dl-path mono">${escapeHTML(doc.path)} · ${fmtTime(doc.mtime)}</span>`;
      list.appendChild(a);
    }
    // Auto-open: single doc, or most recent when nothing selected.
    if (!state.current && docs.length) {
      location.hash = `#/${docs[0].path}`;
    }
  }

  async function refreshComments() {
    if (!state.current) return;
    try {
      const { comments } = await api(`/api/comments?path=${encodeURIComponent(state.current)}`);
      state.comments = comments;
    } catch {
      state.comments = [];
    }
    const open = state.comments.filter((c) => !c.resolved).length;
    $('#tb-comments-btn').textContent = `${open} open`;
    renderCommentList();
  }

  async function loadDoc(path, { preserveScroll = false } = {}) {
    const scrollY = window.scrollY;
    let doc;
    try {
      doc = await api(`/api/doc?path=${encodeURIComponent(path)}`);
    } catch {
      $('#content').innerHTML = `<div class="empty-state"><p class="mono">Document not found: ${escapeHTML(path)}</p></div>`;
      return;
    }
    state.current = path;
    await refreshComments();

    const content = $('#content');
    state.mermaidSeq = 0;
    content.innerHTML = renderMarkdown(doc.content);

    // Title block: use first h1 as title, strip it from the body to avoid dupes.
    const firstH1 = content.querySelector('h1');
    const title = firstH1 ? firstH1.textContent : path.split('/').pop();
    if (firstH1) firstH1.remove();
    $('#tb-doc-title').textContent = title;
    $('#tb-doc-path').textContent = path;
    $('#tb-doc-mtime').textContent = fmtTime(doc.mtime);
    $('#doc-header').hidden = false;
    document.title = `${title} — Visual Docs`;

    hydrateDiffs(content);
    hydrateSectionComments(content);
    hydrateNomnoml(content);
    await hydrateMermaid(content);

    document.querySelectorAll('.doc-link').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#/${path}`);
    });

    if (preserveScroll) window.scrollTo(0, scrollY);
    else window.scrollTo(0, 0);
  }

  /* ---------- comment drawer ---------- */

  function renderCommentList() {
    const list = $('#comment-list');
    if (!state.comments.length) {
      list.innerHTML = '<p class="mono" style="color:var(--ink-soft)">No comments yet. Anything you write here is saved locally and read back by the agent.</p>';
      return;
    }
    list.innerHTML = state.comments
      .slice()
      .reverse()
      .map(
        (c) => `<div class="comment-item${c.resolved ? ' resolved' : ''}">
          <div class="c-meta">
            ${c.section ? `<span class="c-section">§ ${escapeHTML(c.section)}</span>` : ''}
            <span>${escapeHTML(new Date(c.createdAt).toLocaleString())}</span>
            ${c.resolved ? '<span>resolved</span>' : ''}
          </div>
          <div>${escapeHTML(c.text)}</div>
        </div>`
      )
      .join('');
  }

  function openDrawer(section = '') {
    state.pendingSection = section;
    const ctx = $('#comment-context');
    if (section) {
      ctx.textContent = `commenting on § ${section}`;
      ctx.hidden = false;
    } else {
      ctx.hidden = true;
    }
    $('#comment-drawer').hidden = false;
    $('#comment-text').focus();
  }

  /** Build a paste-ready prompt from feedback, mirroring what the agent
      would read from the comments API. Used as the clipboard fallback. */
  function buildPrompt(entries) {
    const lines = [
      `Please revise the visual doc \`${state.current}\` based on this feedback:`,
      '',
    ];
    for (const e of entries) {
      lines.push(e.section ? `- [section: ${e.section}] ${e.text}` : `- ${e.text}`);
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

  function setCommentStatus(msg, tone = 'ok') {
    const el = $('#comment-status');
    el.textContent = msg;
    el.dataset.tone = tone;
    el.hidden = !msg;
    if (msg) setTimeout(() => { el.hidden = true; }, 5000);
  }

  function initDrawer() {
    $('#drawer-close').addEventListener('click', () => { $('#comment-drawer').hidden = true; });
    $('#tb-comments-btn').addEventListener('click', () => openDrawer(''));

    $('#copy-prompt-btn').addEventListener('click', async () => {
      const text = $('#comment-text').value.trim();
      // Copy the draft if present, otherwise all open comments.
      const entries = text
        ? [{ section: state.pendingSection, text }]
        : state.comments.filter((c) => !c.resolved);
      if (!entries.length) {
        setCommentStatus('Nothing to copy — write feedback first.', 'warn');
        return;
      }
      const ok = await copyToClipboard(buildPrompt(entries));
      setCommentStatus(ok ? 'Prompt copied — paste it to your agent.' : 'Copy failed — select the text manually.', ok ? 'ok' : 'warn');
    });

    $('#comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = $('#comment-text').value.trim();
      if (!text || !state.current) return;
      try {
        await api('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: state.current, section: state.pendingSection, text }),
        });
        $('#comment-text').value = '';
        setCommentStatus('Saved. The agent reads comments before its next revision.');
        await refreshComments();
        hydrateSectionComments($('#content'));
      } catch {
        // Server unreachable: fall back to the clipboard so feedback isn't lost.
        const ok = await copyToClipboard(buildPrompt([{ section: state.pendingSection, text }]));
        setCommentStatus(
          ok
            ? 'Saving failed, but the prompt was copied — paste it to your agent.'
            : 'Saving failed and clipboard is unavailable — copy the text manually.',
          'warn'
        );
      }
    });
  }

  /* ---------- live reload ---------- */

  function initEvents() {
    const dot = $('#conn-dot');
    const label = $('#conn-label');
    const es = new EventSource('/api/events');
    es.onopen = () => { dot.className = 'dot on'; label.textContent = 'live reload on'; };
    es.onerror = () => { dot.className = 'dot off'; label.textContent = 'reconnecting…'; };
    es.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === 'change') {
        await refreshDocs();
        if (state.current) await loadDoc(state.current, { preserveScroll: true });
      } else if (msg.type === 'comment') {
        await refreshComments();
        hydrateSectionComments($('#content'));
      }
    };
  }

  /* ---------- routing ---------- */

  function route() {
    const hash = location.hash.replace(/^#\//, '');
    if (hash) loadDoc(decodeURIComponent(hash));
  }

  /* ---------- boot ---------- */

  initTheme();
  initDrawer();
  initEvents();
  window.addEventListener('hashchange', route);
  refreshDocs().then(route).catch((err) => {
    $('#content').innerHTML = `<div class="empty-state"><p class="mono">Failed to load documents: ${escapeHTML(err.message)}</p></div>`;
  });
})();
