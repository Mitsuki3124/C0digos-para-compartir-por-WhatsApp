// Cloudflare Pages (modo avanzado): redirect HTTP->HTTPS, CSP con nonces y headers de seguridad.
// IMPORTANTE: en Pages este archivo debe llamarse _worker.js y estar en la raíz del sitio.
// Trusted Types (mitiga XSS basado en DOM): ACTIVO. El Worker envia la directiva
// "require-trusted-types-for 'script'" en el header Content-Security-Policy.
// El codigo propio ya es compatible: no usa innerHTML/eval/document.write y toda URL de script
// (AdSense, Cloudflare Insights, confetti, sw.js) pasa por la politica 'app-scripts' de index.html.
// Si algun dia hay que volver a solo-reportar, cambia esto a false.
const ENFORCE_TRUSTED_TYPES = true;
const TRUSTED_TYPES_DIRECTIVE = "require-trusted-types-for 'script'";

// ---------- Catalogo ARD (descubrimiento para agentes de IA) ----------
// El Worker sirve el catalogo directamente, sin depender de los archivos estaticos: asi nunca
// devuelve el index.html (fallback de Pages) en lugar del JSON. Fuente: ai-catalog.json.
// Para actualizar: edita ai-catalog.json y corre  node scripts/sync-ard.mjs
// ARD-CATALOG:BEGIN (generado por scripts/sync-ard.mjs - no editar a mano)
const ARD_CATALOG = {
  "specVersion": "1.0",
  "host": {
    "displayName": "Códigos HTML de Amor",
    "documentationUrl": "https://c0digos-para-compartir-por-whatsapp.pages.dev/"
  },
  "entries": [
    {
      "identifier": "urn:air:c0digos-para-compartir-por-whatsapp.pages.dev:site:romantic-html-library",
      "displayName": "Biblioteca de plantillas HTML románticas",
      "type": "text/html",
      "url": "https://c0digos-para-compartir-por-whatsapp.pages.dev/",
      "description": "Biblioteca web de plantillas HTML románticas, mensajes animados y tarjetas interactivas para compartir y personalizar.",
      "tags": [
        "html",
        "plantillas",
        "romántico",
        "whatsapp",
        "tarjetas",
        "mensajes",
        "frontend"
      ],
      "capabilities": [
        "DiscoverTemplates",
        "BrowseRomanticHTML",
        "FindInteractiveMessages",
        "FindShareableCards"
      ],
      "representativeQueries": [
        "buscar plantillas HTML románticas para WhatsApp",
        "encontrar tarjetas de amor interactivas",
        "buscar mensajes HTML animados para compartir"
      ],
      "version": "1.0.0",
      "metadata": {
        "language": "es",
        "mobileFriendly": true,
        "resourceKind": "static-website"
      },
      "updatedAt": "2026-11-12T00:00:00Z"
    },
    {
      "identifier": "urn:air:c0digos-para-compartir-por-whatsapp.pages.dev:docs:llms-guide",
      "displayName": "Guía para agentes y modelos",
      "type": "text/plain",
      "url": "https://c0digos-para-compartir-por-whatsapp.pages.dev/llms.txt",
      "description": "Documento de orientación para agentes de IA y sistemas automatizados que necesiten descubrir y comprender los recursos públicos del sitio.",
      "tags": [
        "llms.txt",
        "ai",
        "agents",
        "discovery",
        "documentation"
      ],
      "capabilities": [
        "ReadSiteDocumentation",
        "UnderstandSiteResources",
        "DiscoverPublicResources"
      ],
      "representativeQueries": [
        "qué recursos públicos ofrece este sitio",
        "cómo descubrir las plantillas disponibles en este sitio"
      ],
      "version": "1.0.0",
      "metadata": {
        "language": "es",
        "resourceKind": "llm-guidance"
      },
      "updatedAt": "2026-11-12T00:00:00Z"
    }
  ]
};
// ARD-CATALOG:END

const ARD_PATHS = {
  '/.well-known/ard.json': 'application/json; charset=utf-8',
  '/ard.json': 'application/json; charset=utf-8',
  '/.well-known/ai-catalog.json': 'application/ai-catalog+json; charset=utf-8',
  '/ai-catalog.json': 'application/ai-catalog+json; charset=utf-8'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Redirect HTTP a HTTPS
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // Catalogo ARD: respuesta JSON propia (con CORS abierto para registros y agentes)
    const ardType = ARD_PATHS[url.pathname];
    if (ardType) return ardResponse(request, ardType);

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
      script-src 'nonce-${nonce1}' 'nonce-${nonce2}' 'nonce-${nonce4}' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://static.cloudflareinsights.com;
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

    if (ENFORCE_TRUSTED_TYPES) {
      headers.set('Content-Security-Policy', cspHeader + '; ' + TRUSTED_TYPES_DIRECTIVE);
    } else {
      headers.set('Content-Security-Policy', cspHeader);
      // upgrade-insecure-requests se ignora (y el navegador avisa en consola) en Report-Only: se quita ahi.
      const cspReportOnly = cspHeader.replace(/\s*upgrade-insecure-requests;?/, '').replace(/;\s*$/, '');
      headers.set('Content-Security-Policy-Report-Only', cspReportOnly + '; ' + TRUSTED_TYPES_DIRECTIVE);
    }
    // Descubrimiento ARD por cabecera HTTP
    headers.append('Link', '</ard.json>; rel="ard"; type="application/json"');
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

// Respuesta del catalogo ARD (GET/HEAD/OPTIONS)
function ardResponse(request, contentType) {
  const base = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'X-Content-Type-Options': 'nosniff'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: base });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { ...base, Allow: 'GET, HEAD, OPTIONS' } });
  }
  const body = JSON.stringify(ARD_CATALOG, null, 2) + '\n';
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: { ...base, 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600, must-revalidate' }
  });
}

// Nonce seguro: 16 bytes aleatorios en base64url
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
