// Cloudflare Pages Function: domain-based i18n routing.
// bebke.com  -> serves /en/* content
// bebke.co.il -> serves /he/* content
// Mirrors the previous WPML setup (separate domains, one per language)
// while keeping a single static build with path-based Astro i18n routing.

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  const isHebrewDomain = host.includes('bebke.co.il');
  const isEnglishDomain = host.includes('bebke.com');

  // Skip rewriting for already-prefixed paths, static assets, and the functions themselves.
  const path = url.pathname;
  const alreadyPrefixed = path.startsWith('/en/') || path.startsWith('/he/') || path === '/en' || path === '/he';
  const isAsset = /\.[a-zA-Z0-9]+$/.test(path); // has a file extension, e.g. .css, .js, .png

  if (!alreadyPrefixed && !isAsset) {
    if (isHebrewDomain) {
      url.pathname = `/he${path}`;
      return next(new Request(url, request));
    }
    if (isEnglishDomain) {
      url.pathname = `/en${path}`;
      return next(new Request(url, request));
    }
  }

  return next();
}
