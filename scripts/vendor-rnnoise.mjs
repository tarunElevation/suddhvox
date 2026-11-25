// Copies the RNNoise AI package from node_modules into www/vendor/rnnoise so the app can load it offline.
// If anything goes wrong the build still succeeds, and the app uses its basic noise filter instead.
import fs from 'node:fs';
import path from 'node:path';

const pkgDir = 'node_modules/@shiguredo/rnnoise-wasm';
const outDir = 'www/vendor/rnnoise';

function pickEntry(e) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    for (const k of ['import', 'browser', 'module', 'default']) {
      if (e[k]) { const r = pickEntry(e[k]); if (r) return r; }
    }
    for (const [k, v] of Object.entries(e)) {
      if (k === 'types' || k === 'require') continue;
      const r = pickEntry(v); if (r) return r;
    }
  }
  return null;
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, f.name), b = path.join(to, f.name);
    if (f.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  let entry = pickEntry(pkg.exports && (pkg.exports['.'] || pkg.exports)) || pkg.module || pkg.main || 'dist/index.js';
  entry = entry.replace(/^\.\//, '');
  if (!fs.existsSync(path.join(pkgDir, entry))) throw new Error('entry file not found: ' + entry);

  fs.rmSync(outDir, { recursive: true, force: true });
  const top = entry.split('/')[0];
  if (entry.includes('/')) copyDir(path.join(pkgDir, top), path.join(outDir, top));
  else fs.mkdirSync(outDir, { recursive: true }), fs.copyFileSync(path.join(pkgDir, entry), path.join(outDir, entry));
  for (const f of fs.readdirSync(pkgDir)) {
    if (/^(LICENSE|NOTICE|COPYING)/i.test(f)) fs.copyFileSync(path.join(pkgDir, f), path.join(outDir, f));
  }
  fs.writeFileSync(path.join(outDir, 'entry.json'), JSON.stringify({ entry, version: pkg.version }));
  console.log('RNNoise added:', entry, 'version', pkg.version);
  console.log('Files:', fs.readdirSync(outDir).join(', '));
} catch (e) {
  console.warn('RNNoise could not be added, the app will use the basic filter:', e.message);
}
