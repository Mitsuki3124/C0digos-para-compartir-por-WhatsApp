# C0digos-para-compartir-por-WhatsApp
## Notas de optimización
- `dev/share.source.js` es el código legible de `share.js` (el de la raíz está minificado).
- El CSS crítico va en línea en `index.html` (`<style _nonce="5">`); `styles.css` y la fuente Noto Color Emoji cargan sin bloquear el render.
- El Worker (`src/index.js`) genera un nonce adicional (`nonce5`) para ese `<style>`.
