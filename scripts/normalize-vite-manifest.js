'use strict';

const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || 'build';
const manifestPath = path.join(process.cwd(), outDir, 'asset-manifest.json');
const viteManifestPath = path.join(process.cwd(), outDir, 'vite-manifest.json');

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Vite manifest not found: ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest && manifest.files && typeof manifest.files === 'object') {
  console.log(`Manifest already release-compatible: ${manifestPath}`);
  process.exit(0);
}

const emittedFiles = [];
for (const entry of Object.values(manifest || {})) {
  if (!entry || typeof entry !== 'object') continue;
  if (typeof entry.file === 'string') emittedFiles.push(entry.file);
  if (Array.isArray(entry.css)) emittedFiles.push(...entry.css.filter((value) => typeof value === 'string'));
  if (Array.isArray(entry.assets)) emittedFiles.push(...entry.assets.filter((value) => typeof value === 'string'));
}

const uniqueFiles = [...new Set(emittedFiles)];
if (!uniqueFiles.some((file) => file.endsWith('.js'))) {
  throw new Error('Vite manifest does not contain a JavaScript bundle.');
}

fs.writeFileSync(viteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const files = Object.fromEntries(uniqueFiles.map((file, index) => [`asset-${index}`, `/${file.replace(/^\//, '')}`]));
fs.writeFileSync(manifestPath, `${JSON.stringify({ files }, null, 2)}\n`, 'utf8');

console.log(`Vite manifest normalized for release verification: ${uniqueFiles.length} assets`);
