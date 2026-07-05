// Vercel Edge Middleware: domain-based i18n routing.
// bebke.com    -> serves /en/* content
// bebke.co.il  -> serves /he/* content
// Mirrors the previous WPML setup (separate domains, one per language)
// while keeping a single static build with path-based Astro i18n routing.

import { rewrite, next } from '@vercel/edge';

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  const isHebrewDomain = host.includes('bebke.co.il');
  const isEnglishDomain = host.includes('bebke.com');

  const path = url.pathname;
  const alreadyPrefixed = path.startsWith('/en/') || path.startsWith('/he/') || path === '/en' || path === '/he';
  const isAsset = /\.[a-zA-Z0-9]+$/.test(path); // has a file extension, e.g. .css, .js, .png

  if (!alreadyPrefixed && !isAsset) {
    if (isHebrewDomain) {
      url.pathname = `/he${path}`;
      return rewrite(url);
    }
    if (isEnglishDomain || host.includes('vercel.app') || host.includes('localhost')) {
      // Default to English for the Vercel preview domain and localhost too.
      url.pathname = `/en${path}`;
      return rewrite(url);
    }
  }

  return next();
}

export const config = {
  matcher: '/((?!_astro|api).*)',
};
