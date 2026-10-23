# C0digos-para-compartir-por-WhatsApp
## Notas de optimización
- `dev/share.source.js` es el código legible de `share.js` (el de la raíz está minificado).
- `_worker.js` (Cloudflare Pages, modo avanzado) añade la CSP con nonces y los headers de seguridad. En Pages el Worker **debe** llamarse `_worker.js` y estar en la raíz; un `src/index.js` no se ejecuta.
- Todo `<script>` ejecutable de `index.html` debe llevar el marcador `_nonce="1"`, `"2"` o `"4"`; el Worker lo convierte en un nonce real. Sin marcador, la CSP lo bloquea.
- La fuente Noto Color Emoji (emojis estilo Android) solo se descarga en PC, después de la carga.
