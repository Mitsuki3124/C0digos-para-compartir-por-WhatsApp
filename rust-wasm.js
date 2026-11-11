// Puente JS <-> Rust (WebAssembly). Modulo ES opcional: si el .wasm no carga,
// todo sigue funcionando con versiones JS equivalentes (la web nunca se rompe).
//
// Uso:
//   import { Rust } from './rust-wasm.js';
//   const r = await Rust.load();          // r.usingWasm === true si cargo el .wasm
//   r.saludar('Ana');  r.normalizar('Canción');  r.puntuar('amor', ['Carta de amor', ...]);

const WASM_JS = './wasm/sitio_wasm.js';

// ---- Respaldo en JS puro (misma API) ----
const normalizarJS = (t) =>
  t.toLowerCase().replace(/\u00f1/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, '\u00f1');

const fallback = {
  usingWasm: false,
  saludar: (n) => `Hola ${n}, este saludo viene de JavaScript (respaldo)`,
  normalizar: normalizarJS,
  puntuar(consulta, textos) {
    const palabras = normalizarJS(consulta).split(/\s+/).filter(Boolean);
    return Uint32Array.from(textos, (t) => {
      if (!palabras.length) return 1;
      const n = normalizarJS(t);
      let total = 0;
      for (const p of palabras) {
        const pos = n.indexOf(p);
        if (pos === -1) return 0;
        total += pos === 0 || !/[\p{L}\p{N}]/u.test(n[pos - 1]) ? 10 : 3;
      }
      return total;
    });
  },
  contar_primos(n) {
    if (n < 2) return 0;
    const criba = new Uint8Array(n + 1).fill(1);
    criba[0] = criba[1] = 0;
    for (let i = 2; i * i <= n; i++) {
      if (criba[i]) for (let j = i * i; j <= n; j += i) criba[j] = 0;
    }
    let c = 0;
    for (let i = 0; i <= n; i++) c += criba[i];
    return c;
  },
};

let cache = null;

export const Rust = {
  /** Carga el WASM una sola vez. Nunca lanza: ante error devuelve el respaldo JS. */
  load() {
    if (cache) return cache;
    cache = (async () => {
      try {
        if (typeof WebAssembly !== 'object') throw new Error('Sin soporte WebAssembly');
        const mod = await import(WASM_JS);
        await mod.default(); // descarga e instancia sitio_wasm_bg.wasm
        return {
          usingWasm: true,
          saludar: mod.saludar,
          normalizar: mod.normalizar,
          puntuar: mod.puntuar,
          contar_primos: mod.contar_primos,
        };
      } catch (err) {
        console.warn('[Rust/WASM] no disponible, usando respaldo JS:', err);
        return fallback;
      }
    })();
    return cache;
  },
};
