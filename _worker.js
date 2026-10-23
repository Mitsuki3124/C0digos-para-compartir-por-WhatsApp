// Cloudflare Pages (modo avanzado): redirect HTTP->HTTPS, CSP con nonces y headers de seguridad.
// IMPORTANTE: en Pages este archivo debe llamarse _worker.js y estar en la raíz del sitio.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Redirect HTTP a HTTPS
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // Pasar la petición a los archivos estáticos de Pages
    const response = await env.ASSETS.fetch(request);

    // Solo reescribir documentos HTML completos (200). 304/404/etc. pasan tal cual.
    const contentType = response.headers.get('content-type') || '';
    if (response.status !== 200 || !contentType.includes('text/html')) {
      return response;
    }

    // Nonces únicos por petición
    const nonce1 = generateNonce(); // AdSense / cookies / módulo principal / fuente de emojis
    const nonce2 = generateNonce(); // Detección de app Android
    const nonce3 = generateNonce(); // JSON-LD (no se ejecuta; solo se limpia el marcador)
    const nonce4 = generateNonce(); // Service Worker

    let html = await response.text();
    html = html.replace(/ _nonce="1"/g, ` nonce="${nonce1}"`);
    html = html.replace(/ _nonce="2"/g, ` nonce="${nonce2}"`);
    html = html.replace(/ _nonce="3"/g, ` nonce="${nonce3}"`);
    html = html.replace(/ _nonce="4"/g, ` nonce="${nonce4}"`);

    // CSP estricta basada en nonces + 'strict-dynamic' (los scripts que cargan los scripts
    // con nonce, como AdSense, Cloudflare Insights o confetti, quedan permitidos).
    const cspHeader = `
      default-src 'self';
      script-src 'nonce-${nonce1}' 'nonce-${nonce2}' 'nonce-${nonce4}' 'strict-dynamic' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https:;
      frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      object-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    // Copiar headers, quitando los que dejan de ser válidos al reescribir el cuerpo
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.delete('last-modified');
    // El HTML lleva nonces distintos en cada petición: no debe servirse desde caché
    headers.set('Cache-Control', 'no-cache');

    headers.set('Content-Security-Policy', cspHeader);
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
};

// Nonce seguro: 16 bytes aleatorios en base64url
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
