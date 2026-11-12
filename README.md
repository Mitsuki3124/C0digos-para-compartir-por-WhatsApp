# C0digos-para-compartir-por-WhatsApp
## Notas de optimización
- `dev/share.source.js` es el código legible de `share.js` (el de la raíz está minificado).
- `_worker.js` (Cloudflare Pages, modo avanzado) añade la CSP con nonces y los headers de seguridad. En Pages el Worker **debe** llamarse `_worker.js` y estar en la raíz; un `src/index.js` no se ejecuta.
- Todo `<script>` ejecutable de `index.html` debe llevar el marcador `_nonce="1"`, `"2"` o `"4"`; el Worker lo convierte en un nonce real. Sin marcador, la CSP lo bloquea.
- La fuente Noto Color Emoji (emojis estilo Android) solo se descarga en PC, después de la carga.

## Catálogo para agentes de IA (ARD)
- **Fuente única:** `ai-catalog.json`. No edites las copias a mano.
- Tras editarlo corre `npm run sync:ard`: valida el esquema ARD y sincroniza `.well-known/ard.json`, `ard.json`, `.well-known/ai-catalog.json` y la copia embebida en `_worker.js`. `npm run check:ard` solo verifica (lo usa el workflow).
- El Worker sirve el catálogo como JSON en las 4 rutas (con CORS abierto), así nunca se devuelve el `index.html` por error. Se anuncia con `<link rel="ard">` y la cabecera `Link`.
- `404.html` existe para que un archivo faltante dé 404 real y no el `index.html` (fallback SPA de Pages).

## Trusted Types
- `_worker.js` envía `require-trusted-types-for 'script'` en el header `Content-Security-Policy` (`ENFORCE_TRUSTED_TYPES = true`).
- No uses `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` ni `eval`: usa `textContent`, `replaceChildren()` o DOM. Toda URL de script nueva debe pasar por `window.trustedScriptURL(...)` y agregarse a su lista `allowed` en `index.html`.
