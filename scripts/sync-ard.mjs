#!/usr/bin/env node
// Fuente unica de verdad: ai-catalog.json (raiz).
// Este script lo valida contra las reglas ARD y lo sincroniza en:
//   - .well-known/ard.json          (ruta primaria ARD)
//   - ard.json                      (alias sin carpeta oculta; funciona en cualquier hosting)
//   - .well-known/ai-catalog.json   (ruta legacy)
//   - _worker.js                    (copia embebida entre marcadores ARD-CATALOG)
// Uso:  node scripts/sync-ard.mjs           -> valida y escribe
//       node scripts/sync-ard.mjs --check   -> solo verifica (falla si algo esta desincronizado)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'ai-catalog.json');
const check = process.argv.includes('--check');

const raw = readFileSync(SRC, 'utf8');
let catalog;
try { catalog = JSON.parse(raw); } catch (e) { fail(`ai-catalog.json no es JSON valido: ${e.message}`); }

// ---------- Validacion (reglas del esquema ARD / Lighthouse) ----------
const errors = [];
const URN = /^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/;
if (!catalog || typeof catalog !== 'object') errors.push('La raiz debe ser un objeto');
if (!Array.isArray(catalog.entries) || catalog.entries.length === 0) errors.push('Falta el arreglo "entries"');
if (!catalog.host || !catalog.host.displayName) errors.push('host.displayName es obligatorio');
const seen = new Set();
(catalog.entries || []).forEach((e, i) => {
  const n = `entries[${i}]`;
  for (const k of ['identifier', 'displayName', 'type']) if (!e[k]) errors.push(`${n}: falta "${k}"`);
  if (e.identifier && !URN.test(e.identifier)) errors.push(`${n}: identifier no cumple urn:air:<publisher>:<namespace>:<nombre>`);
  if (seen.has(e.identifier)) errors.push(`${n}: identifier duplicado`);
  seen.add(e.identifier);
  if (!!e.url === !!e.data) errors.push(`${n}: debe tener exactamente uno de "url" o "data"`);
  if (e.url) { try { new URL(e.url); } catch { errors.push(`${n}: url invalida`); } }
  const rq = e.representativeQueries;
  if (!Array.isArray(rq) || rq.length < 2 || rq.length > 5) errors.push(`${n}: representativeQueries debe tener entre 2 y 5 elementos`);
  for (const k of ['tags', 'capabilities']) if (e[k] !== undefined && !Array.isArray(e[k])) errors.push(`${n}: "${k}" debe ser arreglo`);
  if (e.metadata) for (const [k, v] of Object.entries(e.metadata)) {
    if (v !== null && !['string', 'number', 'boolean'].includes(typeof v)) errors.push(`${n}: metadata.${k} debe ser escalar`);
  }
});
if (errors.length) fail('Catalogo invalido:\n - ' + errors.join('\n - '));

// ---------- Sincronizacion ----------
const pretty = JSON.stringify(catalog, null, 2) + '\n';
const targets = ['ai-catalog.json', '.well-known/ard.json', 'ard.json', '.well-known/ai-catalog.json'];
const stale = [];

for (const t of targets) {
  const p = join(root, t);
  const current = existsSync(p) ? readFileSync(p, 'utf8') : null;
  if (current === pretty) continue;
  if (check) { stale.push(t); continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, pretty);
  console.log('actualizado:', t);
}

const workerPath = join(root, '_worker.js');
const BEGIN = '// ARD-CATALOG:BEGIN';
const END = '// ARD-CATALOG:END';
const worker = readFileSync(workerPath, 'utf8');
const a = worker.indexOf(BEGIN), b = worker.indexOf(END);
if (a === -1 || b === -1) fail('_worker.js no tiene los marcadores ARD-CATALOG:BEGIN / END');
const block = `${BEGIN} (generado por scripts/sync-ard.mjs - no editar a mano)\nconst ARD_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
const nextWorker = worker.slice(0, a) + block + worker.slice(b);
if (nextWorker !== worker) {
  if (check) stale.push('_worker.js');
  else { writeFileSync(workerPath, nextWorker); console.log('actualizado: _worker.js'); }
}

if (check && stale.length) fail('Desincronizado (corre: node scripts/sync-ard.mjs):\n - ' + stale.join('\n - '));
console.log(check ? 'OK: todo sincronizado' : 'Listo: catalogo valido y sincronizado');

function fail(msg) { console.error(msg); process.exit(1); }
