#!/usr/bin/env node
// Fuente: styles.css. Se incrusta (inline) en index.html entre <!--CSS:BEGIN--> y <!--CSS:END-->
// para que no haya una solicitud CSS que bloquee el render (mejora FCP/LCP).
// Uso:  node scripts/sync-css.mjs          -> escribe
//       node scripts/sync-css.mjs --check  -> solo verifica
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const css = readFileSync(join(root, 'styles.css'), 'utf8').trim();
if (/<\/style/i.test(css)) { console.error('styles.css contiene </style'); process.exit(1); }

const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const BEGIN = '<!--CSS:BEGIN-->', END = '<!--CSS:END-->';
const a = html.indexOf(BEGIN), b = html.indexOf(END);
if (a === -1 || b === -1) { console.error('index.html no tiene los marcadores CSS:BEGIN / CSS:END'); process.exit(1); }

const next = html.slice(0, a) + BEGIN + '<style>' + css + '</style>' + html.slice(b);
if (next === html) { console.log('OK: CSS sincronizado'); process.exit(0); }
if (check) { console.error('CSS desincronizado (corre: node scripts/sync-css.mjs)'); process.exit(1); }
writeFileSync(htmlPath, next);
console.log('actualizado: index.html (CSS incrustado)');
