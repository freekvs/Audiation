const LANGS = new Set(['en', 'de', 'fr', 'es']);
const PAGES = new Set([
  '/',
  '/over',
  '/privacy',
  ...Array.from({ length: 12 }, (_, i) => `/oefening-${i + 1}`),
]);

function isStaticAsset(pathname) {
  return /\.[a-z0-9]{1,8}$/i.test(pathname) && !pathname.endsWith('.html');
}

/**
 * Canonical public URL for a request.
 * Language homes are directories (`/en/`). Other pages have no trailing slash.
 * `?lang=` and `.html` fold into that URL in one step.
 */
export function canonicalUrl(requestUrl, scheme) {
  const url = new URL(requestUrl);
  const prod = url.hostname === 'audiation.app' || url.hostname === 'www.audiation.app';
  if (prod) {
    url.hostname = 'audiation.app';
    if (scheme === 'http' || url.protocol === 'http:') url.protocol = 'https:';
  }

  if (isStaticAsset(url.pathname)) return url;

  let path = url.pathname;
  if (path.endsWith('/index.html')) path = path.slice(0, -'/index.html'.length) || '/';
  else if (path.endsWith('.html')) path = path.slice(0, -'.html'.length) || '/';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (path === '/index' || path.endsWith('/index')) {
    path = path.slice(0, -'/index'.length) || '/';
  }

  const langParam = (url.searchParams.get('lang') || '').toLowerCase();
  if (langParam === 'nl' || LANGS.has(langParam)) {
    url.searchParams.delete('lang');
    const prefixed = path.match(/^\/(en|de|fr|es)(\/.*)?$/);
    const bare = prefixed ? prefixed[2] || '/' : path;
    if (!PAGES.has(bare) && bare !== '/') {
      path = bare;
    } else if (langParam === 'nl') {
      path = bare;
    } else {
      path = bare === '/' ? `/${langParam}` : `/${langParam}${bare}`;
    }
  }

  if (LANGS.has(path.slice(1))) path += '/';

  url.pathname = path || '/';
  return url;
}

export function redirectTarget(requestUrl, scheme) {
  const incoming = new URL(requestUrl);
  if (scheme === 'http') incoming.protocol = 'http:';
  const target = canonicalUrl(requestUrl, scheme);
  const inKey = `${incoming.protocol}//${incoming.host}${incoming.pathname}${incoming.search}`;
  const outKey = `${target.protocol}//${target.host}${target.pathname}${target.search}`;
  if (inKey === outKey) return null;
  return target.toString();
}

function clientScheme(request) {
  const cf = request.headers.get('CF-Visitor');
  if (cf) {
    try {
      const parsed = JSON.parse(cf);
      if (parsed && parsed.scheme) return parsed.scheme;
    } catch (e) {}
  }
  const forwarded = request.headers.get('X-Forwarded-Proto');
  if (forwarded) return forwarded.split(',')[0].trim();
  return new URL(request.url).protocol.replace(':', '');
}

export default {
  async fetch(request, env) {
    const target = redirectTarget(request.url, clientScheme(request));
    if (target) return Response.redirect(target, 301);
    return env.ASSETS.fetch(request);
  },
};
