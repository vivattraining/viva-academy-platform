#!/usr/bin/env node
/**
 * Generates reports/viva_links.html — a clean clickable index of all
 * audited pages, grouped Public / Internal. Each link opens in a new tab.
 *
 * Run via:  node scripts/generate-links-html.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.VIVA_BASE_URL || 'https://www.vivacareeracademy.com';

const PUBLIC_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/apply', name: 'Apply' },
  { path: '/login', name: 'Login' },
];

const INTERNAL_PAGES = [
  { path: '/internal/login', name: 'Internal Login' },
  { path: '/admin', name: 'Admin' },
  { path: '/admissions', name: 'Admissions' },
  { path: '/operations', name: 'Operations' },
  { path: '/roster', name: 'Roster' },
  { path: '/messages', name: 'Messages' },
  { path: '/trainer', name: 'Trainer' },
  { path: '/student', name: 'Student' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/white-label', name: 'White Label' },
];

function row(p) {
  const url = `${BASE_URL}${p.path}`;
  return `      <li><a href="${url}" target="_blank" rel="noopener noreferrer"><span class="name">${p.name}</span><span class="path">${p.path}</span></a></li>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Viva Career Academy — QA Links</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .meta { color: #666; margin-bottom: 24px; font-size: 13px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 24px 0 8px; }
  ul { list-style: none; padding: 0; margin: 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
  li + li { border-top: 1px solid #eee; }
  a { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; text-decoration: none; color: inherit; }
  a:hover { background: #f7f7f9; }
  .name { font-weight: 500; }
  .path { color: #888; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
  @media (prefers-color-scheme: dark) {
    body { background: #111; color: #eee; }
    ul { border-color: #2a2a2a; }
    li + li { border-top-color: #1f1f1f; }
    a:hover { background: #1a1a1a; }
    .meta, h2, .path { color: #888; }
  }
</style>
</head>
<body>
  <h1>Viva Career Academy — QA Links</h1>
  <div class="meta">Base URL: <code>${BASE_URL}</code> · Generated ${new Date().toISOString()}</div>

  <h2>Public pages</h2>
  <ul>
${PUBLIC_PAGES.map(row).join('\n')}
  </ul>

  <h2>Internal pages</h2>
  <ul>
${INTERNAL_PAGES.map(row).join('\n')}
  </ul>
</body>
</html>
`;

const outDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'viva_links.html');
fs.writeFileSync(outPath, html);
console.log(`Wrote ${outPath}`);
