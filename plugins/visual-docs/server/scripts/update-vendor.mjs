#!/usr/bin/env node
/* Downloads the pinned browser renderer libraries into assets/vendor/ and
   writes assets/vendor/manifest.json — an SBOM-style record of every vendored
   asset (version, source URL, license, size, SHA-384).

   Run with --verify to check the on-disk files against the hashes pinned in
   this script's ASSETS array (the trusted, code-reviewed anchor) instead of
   re-downloading. */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VENDOR_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vendor');
const MANIFEST = join(VENDOR_DIR, 'manifest.json');

const ASSETS = [
  {
    name: 'marked',
    version: '12.0.2',
    license: 'MIT',
    homepage: 'https://github.com/markedjs/marked',
    url: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
    file: 'marked.min.js',
    integrity: 'sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi',
  },
  {
    name: 'dompurify',
    version: '3.1.6',
    license: '(MPL-2.0 OR Apache-2.0)',
    homepage: 'https://github.com/cure53/DOMPurify',
    url: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
    file: 'purify.min.js',
    integrity: 'sha384-+VfUPEb0PdtChMwmBcBmykRMDd+v6D/oFmB3rZM/puCMDYcIvF968OimRh4KQY9a',
  },
  {
    name: 'highlight.js',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
    file: 'highlight.min.js',
    integrity: 'sha384-F/bZzf7p3Joyp5psL90p/p89AZJsndkSoGwRpXcZhleCWhd8SnRuoYo4d0yirjJp',
  },
  {
    name: 'highlight.js-theme-github',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css',
    file: 'hljs-github.min.css',
    integrity: 'sha384-eFTL69TLRZTkNfYZOLM+G04821K1qZao/4QLJbet1pP4tcF+fdXq/9CdqAbWRl/L',
  },
  {
    name: 'highlight.js-theme-github-dark',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css',
    file: 'hljs-github-dark.min.css',
    integrity: 'sha384-wH75j6z1lH97ZOpMOInqhgKzFkAInZPPSPlZpYKYTOqsaizPvhQZmAtLcPKXpLyH',
  },
  {
    name: 'mermaid',
    version: '10.9.1',
    license: 'MIT',
    homepage: 'https://github.com/mermaid-js/mermaid',
    url: 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js',
    file: 'mermaid.min.js',
    integrity: 'sha384-WmdflGW9aGfoBdHc4rRyWzYuAjEmDwMdGdiPNacbwfGKxBW/SO6guzuQ76qjnSlr',
  },
  {
    name: 'diff2html',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/js/diff2html.min.js',
    file: 'diff2html.min.js',
    integrity: 'sha384-1tVmtFdzvhqVP3vQWJmKYvD0uTtR0r+FhlLWw+vG6F/vNDS7yegNMNNHRS12fSyR',
  },
  {
    name: 'diff2html-css',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/css/diff2html.min.css',
    file: 'diff2html.min.css',
    integrity: 'sha384-iBvSlI3tNrrSIy7s6mvLg+5B2Z/QXbR4L0Pzg1nRf8zkXrz5JF316MLm2igMIpi2',
  },
  {
    name: 'js-yaml',
    version: '4.1.0',
    license: 'MIT',
    homepage: 'https://github.com/nodeca/js-yaml',
    url: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
    file: 'js-yaml.min.js',
    integrity: 'sha384-+pxiN6T7yvpryuJmE1gM9PX7yQit15auDb+ZwwvJOd/4be2Cie5/IuVXgQb/S9du',
  },
  {
    name: 'graphre',
    version: '0.1.3',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/graphre',
    url: 'https://cdn.jsdelivr.net/npm/graphre@0.1.3/dist/graphre.js',
    file: 'graphre.js',
    integrity: 'sha384-+DSRvfJ8fTBtLU9W0M1kWQnn4Ck9VxqJPN5qYz2dFSrn7XP0yyFs/9my1a5vgCbq',
  },
  {
    name: 'nomnoml',
    version: '1.6.2',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/nomnoml',
    url: 'https://cdn.jsdelivr.net/npm/nomnoml@1.6.2/dist/nomnoml.js',
    file: 'nomnoml.js',
    integrity: 'sha384-cQ6kIxrqYsimUdVijvas+DqrYHmHBewKrXNwm/CZzhk3MNRQ1GdsDDt4ZWo5ltIK',
  },
];

function sha384(buf) {
  return `sha384-${createHash('sha384').update(buf).digest('base64')}`;
}

async function verify() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  const pinned = new Map(ASSETS.map((a) => [a.file, a.integrity]));
  let failed = 0;
  for (const a of manifest.assets) {
    // Anchor to the hash pinned in THIS script's source when present — that
    // value is code-reviewed independently of the generated manifest, so a
    // tampered download + regenerated manifest can't pass silently.
    const anchor = pinned.get(a.file) || a.integrity;
    const anchoredToSource = pinned.has(a.file);
    try {
      const buf = await fs.readFile(join(VENDOR_DIR, a.file));
      const ok = sha384(buf) === anchor;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${a.file}${anchoredToSource ? '' : ' (manifest-only; add a source-pinned integrity)'}`);
      if (!ok) failed++;
    } catch {
      console.log(`MISS ${a.file}`);
      failed++;
    }
  }
  if (failed) {
    console.error(`${failed} asset(s) missing or mismatched against the pinned hash — re-run without --verify to fetch, or investigate tampering.`);
    process.exit(1);
  }
  console.log('All vendored assets match the source-pinned hashes.');
}

async function update() {
  await fs.mkdir(VENDOR_DIR, { recursive: true });
  const entries = [];
  for (const a of ASSETS) {
    const res = await fetch(a.url);
    if (!res.ok) {
      console.error(`FAIL ${a.url}: ${res.status}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = sha384(buf);
    // If a hash is pinned in source for this version, a mismatched download
    // means the upstream payload changed under a fixed version — refuse it.
    if (a.integrity && a.integrity !== hash) {
      console.error(`FAIL ${a.file}: downloaded payload does not match the source-pinned integrity for ${a.name}@${a.version}`);
      console.error(`  pinned:   ${a.integrity}`);
      console.error(`  received: ${hash}`);
      process.exit(1);
    }
    await fs.writeFile(join(VENDOR_DIR, a.file), buf);
    const entry = {
      name: a.name,
      version: a.version,
      license: a.license,
      homepage: a.homepage,
      source: a.url,
      file: a.file,
      sizeBytes: buf.length,
      integrity: hash,
    };
    entries.push(entry);
    console.log(`ok   ${a.file} (${(buf.length / 1024).toFixed(0)} KiB)`);
  }
  const manifest = {
    $schema: 'SBOM-style manifest of browser libraries vendored into assets/vendor/',
    generatedWith: 'scripts/update-vendor.mjs',
    generatedAt: new Date().toISOString(),
    assets: entries,
  };
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${MANIFEST}`);
}

if (process.argv.includes('--verify')) await verify();
else await update();
