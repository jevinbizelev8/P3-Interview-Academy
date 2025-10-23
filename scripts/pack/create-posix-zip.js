#!/usr/bin/env node
// Creates a POSIX-compliant ZIP (forward-slash entry names) from deployment-bundle/
// Usage: node scripts/pack/create-posix-zip.js [sourceDir=deployment-bundle]

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('deployment-bundle');

function walk(dir) {
  const entries = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === '.git' || name.name === '.DS_Store') continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      entries.push(...walk(full));
    } else if (name.isFile()) {
      entries.push(full);
    }
  }
  return entries;
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source folder not found: ${SRC}`);
    process.exit(1);
  }

  const zip = new JSZip();
  const files = walk(SRC);
  const baseLen = SRC.endsWith(path.sep) ? SRC.length : SRC.length + 1;

  for (const file of files) {
    const rel = file.slice(baseLen);
    const posixName = rel.split(path.sep).join('/');
    const data = fs.readFileSync(file);
    zip.file(posixName, data, { binary: true, date: new Date(fs.statSync(file).mtimeMs) });
  }

  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15); // YYYYMMDD-HHMMSS
  const outName = `deployment-${ts}.zip`;

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  fs.writeFileSync(outName, buffer);

  const kb = (buffer.length / 1024).toFixed(1);
  console.log(outName);
  console.log(`Wrote ${kb} KB (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error('Failed to create zip:', err);
  process.exit(1);
});
