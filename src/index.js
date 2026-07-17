// Cloudflare Worker para manejar redirects HTTP->HTTPS, CSP con nonces y headers de seguridad
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Redirect HTTP a HTTPS
    if (url.protocol === 'http:') {
      return Response.redirect(
        `https://${url.hostname}${url.pathname}${url.search}`,
        301
      );
    }

    // Pasar request al origin (Cloudflare Pages)
    const response = await env.ASSETS.fetch(request);
    
    // Solo procesar documentos HTML
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }
    
    // Generar nonces únicos para esta request
    const nonce1 = generateNonce(); // AdSense/Cookies
    const nonce2 = generateNonce(); // Android detection
    const nonce3 = generateNonce(); // JSON-LD / Structured data
    const nonce4 = generateNonce(); // Service Worker
    
    // Leer el body del response
    let html = await response.text();
    
    // ✅ INYECTAR NONCES en los scripts inline usando marcadores de atributo _nonce
    html = html.replace(/ _nonce="1"/g, ` nonce="${nonce1}"`);
    html = html.replace(/ _nonce="2"/g, ` nonce="${nonce2}"`);
    html = html.replace(/ _nonce="3"/g, ` nonce="${nonce3}"`);
    html = html.replace(/ _nonce="4"/g, ` nonce="${nonce4}"`);
    
    // Clonar response para modificar headers
    const newResponse = new Response(html, response);
    
    // ✅ CSP FUERTE con 'strict-dynamic' y nonces
    // - 'strict-dynamic': Solo permite scripts con nonce válido o de fuentes confiables
    // - Elimina 'unsafe-inline' por completo
    // - Usa nonces para scripts inline
    // - Whitelista CDNs de confianza
    const cspHeader = `
      default-src 'self';
      script-src 'nonce-${nonce1}' 'nonce-${nonce2}' 'nonce-${nonce4}' 'strict-dynamic' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://static.cloudflareinsights.com;
      style-src 'self' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https:;
      frame-src https://pagead2.googlesyndication.com;
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
      object-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();
    
    newResponse.headers.set('Content-Security-Policy', cspHeader);
    
    // Headers de seguridad adicionales
    newResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)');
    newResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    newResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return newResponse;
  }
};

/**
 * ✅ Generar nonce seguro: cadena aleatoria de 16 bytes en base64
 * Los navegadores validan que el nonce en script coincida con el de CSP
 * @returns {string} Nonce en formato base64
 */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
