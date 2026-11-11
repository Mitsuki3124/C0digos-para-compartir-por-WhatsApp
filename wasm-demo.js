import { Rust } from './rust-wasm.js';

const $ = (id) => document.getElementById(id);
const r = await Rust.load();

$('estado').textContent = r.usingWasm
  ? '✅ WebAssembly (Rust) cargado'
  : '⚠️ WASM no disponible: usando respaldo JavaScript';

// 1) Funcion minima
$('btnSaludo').addEventListener('click', () => {
  $('saludo').textContent = r.saludar($('nombre').value.trim() || 'mundo');
});

// 2) Busqueda sin acentos sobre las tarjetas reales de index.html
const plantillas = [
  'Carta de amor', 'Jardín romántico', 'Canción dedicada', 'Pocoyo bailarín',
  'Esfera de cristal', 'Tarjeta FIFA', 'Perdón con gatitos', 'Ramo de flores',
];
$('busqueda').addEventListener('input', (e) => {
  const puntos = r.puntuar(e.target.value, plantillas);
  const lista = $('resultados');
  lista.textContent = '';
  plantillas
    .map((t, i) => ({ t, p: puntos[i] }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)
    .forEach((x) => {
      const li = document.createElement('li');
      li.textContent = `${x.t} (${x.p})`;
      lista.appendChild(li);
    });
});

// 3) Comparativa de rendimiento: calculo pesado JS vs Rust
$('btnBench').addEventListener('click', async () => {
  const n = 20_000_000;
  $('bench').textContent = 'Calculando…';
  await new Promise((res) => setTimeout(res, 30));

  const t0 = performance.now();
  const a = jsPrimos(n);
  const tJS = performance.now() - t0;

  const t1 = performance.now();
  const b = r.contar_primos(n);
  const tR = performance.now() - t1;

  $('bench').textContent =
    `Primos <= ${n.toLocaleString()}\n` +
    `JavaScript: ${a} en ${tJS.toFixed(0)} ms\n` +
    `${r.usingWasm ? 'Rust/WASM' : 'Respaldo JS'}: ${b} en ${tR.toFixed(0)} ms`;
});

function jsPrimos(n) {
  const c = new Uint8Array(n + 1).fill(1);
  c[0] = c[1] = 0;
  for (let i = 2; i * i <= n; i++) if (c[i]) for (let j = i * i; j <= n; j += i) c[j] = 0;
  let k = 0;
  for (let i = 0; i <= n; i++) k += c[i];
  return k;
}
