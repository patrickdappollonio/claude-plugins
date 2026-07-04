#!/usr/bin/env node
/* Downloads the pinned browser renderer libraries into assets/vendor/ and
   writes assets/vendor/manifest.json — an SBOM-style record of every vendored
   asset (version, source URL, license, size, SHA-384).

   Run with --verify to check the on-disk files against the existing manifest
   instead of re-downloading. */

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
  },
  {
    name: 'highlight.js',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
    file: 'highlight.min.js',
  },
  {
    name: 'highlight.js-theme-github',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css',
    file: 'hljs-github.min.css',
  },
  {
    name: 'highlight.js-theme-github-dark',
    version: '11.9.0',
    license: 'BSD-3-Clause',
    homepage: 'https://github.com/highlightjs/highlight.js',
    url: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css',
    file: 'hljs-github-dark.min.css',
  },
  {
    name: 'mermaid',
    version: '10.9.1',
    license: 'MIT',
    homepage: 'https://github.com/mermaid-js/mermaid',
    url: 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js',
    file: 'mermaid.min.js',
  },
  {
    name: 'diff2html',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/js/diff2html.min.js',
    file: 'diff2html.min.js',
  },
  {
    name: 'diff2html-css',
    version: '3.4.48',
    license: 'MIT',
    homepage: 'https://github.com/rtfpessoa/diff2html',
    url: 'https://cdn.jsdelivr.net/npm/diff2html@3.4.48/bundles/css/diff2html.min.css',
    file: 'diff2html.min.css',
  },
  {
    name: 'js-yaml',
    version: '4.1.0',
    license: 'MIT',
    homepage: 'https://github.com/nodeca/js-yaml',
    url: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
    file: 'js-yaml.min.js',
  },
  {
    name: 'graphre',
    version: '0.1.3',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/graphre',
    url: 'https://cdn.jsdelivr.net/npm/graphre@0.1.3/dist/graphre.js',
    file: 'graphre.js',
  },
  {
    name: 'nomnoml',
    version: '1.6.2',
    license: 'MIT',
    homepage: 'https://github.com/skanaar/nomnoml',
    url: 'https://cdn.jsdelivr.net/npm/nomnoml@1.6.2/dist/nomnoml.js',
    file: 'nomnoml.js',
  },
];

function sha384(buf) {
  return `sha384-${createHash('sha384').update(buf).digest('base64')}`;
}

async function verify() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  let failed = 0;
  for (const a of manifest.assets) {
    try {
      const buf = await fs.readFile(join(VENDOR_DIR, a.file));
      const ok = sha384(buf) === a.integrity;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${a.file}`);
      if (!ok) failed++;
    } catch {
      console.log(`MISS ${a.file}`);
      failed++;
    }
  }
  if (failed) {
    console.error(`${failed} asset(s) missing or corrupted — re-run without --verify to fetch.`);
    process.exit(1);
  }
  console.log('All vendored assets match the manifest.');
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
    await fs.writeFile(join(VENDOR_DIR, a.file), buf);
    const entry = {
      name: a.name,
      version: a.version,
      license: a.license,
      homepage: a.homepage,
      source: a.url,
      file: a.file,
      sizeBytes: buf.length,
      integrity: sha384(buf),
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
