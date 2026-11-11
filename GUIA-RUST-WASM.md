# Rust + WebAssembly en tu sitio estático

Rust se suma como un módulo **opcional**: si el `.wasm` no carga, la web usa un respaldo en JavaScript y sigue igual. No se modificó ninguno de tus archivos JS/HTML existentes.

## 1. Dónde usar Rust y dónde no

**Sí conviene** (CPU intensivo, datos grandes, lógica repetida miles de veces):
- Procesar imágenes (filtros, redimensionar, recortar la foto/tarjeta que el usuario sube).
- Búsqueda/filtrado sobre miles de elementos, normalización de texto, ordenamiento.
- Compresión, hashing, parseo de formatos binarios, cifrado en el cliente.
- Simulaciones y juegos (tu skill RPG sandbox: colisiones, pathfinding, generación de mapas).
- Código que quieras compartir con un backend Rust.

**No conviene**:
- Manipular el DOM, eventos, estilos, `localStorage`, `fetch`: Rust debe pasar por JS igualmente y solo agrega peso.
- Tu búsqueda actual de ~21 plantillas (`search.js`): son pocas, JS ya responde al instante.
- Lógica trivial o poco frecuente: cruzar JS↔WASM tiene costo y el `.wasm` pesa más que el código JS equivalente.
- Los 21 códigos HTML descargables: son contenido, no cómputo.

Dato honesto: en la demo, la criba de primos en JS con `Uint8Array` ya es muy rápida; las ganancias grandes de Rust aparecen en cargas realmente pesadas (imágenes, millones de registros, estructuras complejas), no en cálculos simples.

## 2. Herramientas

| Herramienta | Para qué | Cuándo |
|---|---|---|
| `rustup` + target `wasm32-unknown-unknown` | compilador | siempre |
| `wasm-bindgen` (crate) | puente Rust↔JS | siempre |
| `wasm-pack` | compila, genera el `.js` de enlace y optimiza | **recomendado** para tu caso (JS/HTML estático) |
| `trunk` | empaqueta apps Rust completas (Yew/Leptos) | **no** lo necesitas: reemplaza tu web entera |

Integración con GitHub: el workflow `.github/workflows/main.yml` instala Rust y wasm-pack, compila y despliega a GitHub Pages. No instalas nada en GitHub manualmente.

## 3. Despliegue

**Automático (GitHub Actions)** – ya configurado. Haces `git push` a `main` y el workflow:
1. corre `cargo test`,
2. ejecuta `wasm-pack build rust --release --target web --out-dir ../wasm --out-name sitio_wasm`,
3. arma `_site/` con tu web + la carpeta `wasm/` (sin el código fuente Rust),
4. lo publica en Pages.

Requisito único: en GitHub → Settings → Pages → Source = **GitHub Actions** (ya lo usas).

**Manual** – local: `./build-wasm.sh` genera `wasm/`; prueba con `python3 -m http.server 8080` y abre `/wasm-demo.html`. Para subir manualmente sin Actions tendrías que quitar `wasm/` de `.gitignore` y hacer commit de la carpeta.

Archivos generados en `wasm/`:
- `sitio_wasm.js` (enlace JS, ~5–10 KB)
- `sitio_wasm_bg.wasm` (binario, normalmente 15–40 KB para este ejemplo)
- `sitio_wasm.d.ts` / `sitio_wasm_bg.wasm.d.ts` (tipos, opcionales)

## 4. Qué cambia en el repositorio

Archivos nuevos:
```
rust/Cargo.toml, rust/Cargo.lock, rust/src/lib.rs   ← código Rust
rust-wasm.js                                         ← cargador + respaldo JS
wasm-demo.html, wasm-demo.js                         ← demo (puedes borrarla)
build-wasm.sh                                        ← compilar en local
.gitignore                                           ← ignora rust/target y wasm/
GUIA-RUST-WASM.md
```
Modificados: `.github/workflows/main.yml` (paso de build), `_worker.js` (CSP + `'wasm-unsafe-eval'`, solo aplica si usas Cloudflare Pages), `_headers` (MIME `application/wasm`).

- **Tamaño del repo**: solo se suben las fuentes Rust (KB). `wasm/` y `rust/target/` (cientos de MB) NO se versionan.
- **Carga en el navegador**: el `.wasm` se descarga solo cuando una página hace `Rust.load()`; `index.html` no lo toca, así que tu LCP/FCP no cambia. GitHub Pages sirve `.wasm` con el MIME correcto y compresión.
- **CSP (importante)**: tu `_worker.js` tiene CSP estricta. Instanciar WebAssembly exige `'wasm-unsafe-eval'` en `script-src`; ya está añadido. Sin eso, el navegador bloquea el WASM (y tu respaldo JS lo cubriría).
- GitHub Pages **ignora** `_worker.js` y `_headers`; solo Cloudflare los usa.

## 5. Ejemplo mínimo

Rust (`rust/src/lib.rs`):
```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn saludar(nombre: &str) -> String {
    format!("Hola {nombre}, este saludo viene de Rust + WebAssembly 🦀")
}
```
JavaScript, en cualquier página de tu sitio:
```html
<script type="module">
  import { Rust } from './rust-wasm.js';
  const r = await Rust.load();
  console.log(r.saludar('Ana'));
</script>
```
(Si tu sitio corre con el Worker de Cloudflare, añade `_nonce="1"` a ese `<script>`, como en tus otros scripts.)

Prueba: abre `/wasm-demo.html` en tu sitio publicado. Debe decir "✅ WebAssembly (Rust) cargado".

Para añadir más funciones: escribe `#[wasm_bindgen] pub fn ...` en `lib.rs`, expónla en el objeto de `rust-wasm.js` (y su respaldo JS), y haz push.
