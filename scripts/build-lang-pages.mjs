/**
 * Bake nl/en/de/fr/es HTML so each language has its own indexable URL.
 * Dutch stays at /over. Other languages live at /en/over, and /en/ for home.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { pathToFileURL } from 'url';

const SITE = path.resolve('G:/users/freek/Audiation/site');
const LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const FOREIGN = ['en', 'de', 'fr', 'es'];
const PAGES = ['/', '/over', '/privacy', ...Array.from({ length: 12 }, (_, i) => `/oefening-${i + 1}`)];

function get(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : ''), obj);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripLangPrefix(pathname) {
  const match = String(pathname || '/').match(/^\/(en|de|fr|es)(\/.*)?$/);
  if (!match) return pathname || '/';
  return match[2] || '/';
}

export function localizedPath(bare, lang) {
  let p = stripLangPrefix(bare || '/');
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (p.endsWith('.html')) p = p.slice(0, -5) || '/';
  if (p === '/index') p = '/';
  if (!p) p = '/';
  if (lang && lang !== 'nl') return p === '/' ? `/${lang}/` : `/${lang}${p}`;
  return p;
}

function absUrl(lang, page) {
  const p = localizedPath(page, lang);
  return p === '/' ? 'https://audiation.app/' : `https://audiation.app${p}`;
}

function sourceName(page) {
  return page === '/' ? 'index.html' : `${page.slice(1)}.html`;
}

function outPath(lang, page) {
  if (lang === 'nl') return path.join(SITE, sourceName(page));
  if (page === '/') return path.join(SITE, lang, 'index.html');
  return path.join(SITE, lang, `${page.slice(1)}.html`);
}

function loadPacks() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(SITE, 'i18n.js'), 'utf8'), sandbox);
  return sandbox.window.SITE_I18N;
}

function applyTexts(html, pack) {
  return html.replace(
    /<([a-z0-9]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([^<]*)<\/\1>/gi,
    (full, tag, before, key, after, _inner) => {
      const value = get(pack, key);
      if (!value) return full;
      return `<${tag}${before} data-i18n="${key}"${after}>${escapeHtml(value)}</${tag}>`;
    }
  );
}

function headFor(lang, page) {
  const links = [
    `  <link rel="canonical" href="${absUrl(lang, page)}">`,
    `  <link rel="alternate" hreflang="x-default" href="${absUrl('nl', page)}">`,
    ...LANGS.map((id) => `  <link rel="alternate" hreflang="${id}" href="${absUrl(id, page)}">`),
  ];
  return links.join('\n');
}

function replaceHead(html, lang, page) {
  const stripped = html
    .replace(/\r?\n[ \t]*<link rel="canonical"[^>]*>\r?/g, '')
    .replace(/\r?\n[ \t]*<link rel="alternate"[^>]*>\r?/g, '');
  return stripped.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n${headFor(lang, page)}`
  );
}

function pagerHtml(pack, n, lang) {
  const parts = [];
  if (n > 1) {
    const href = localizedPath(`/oefening-${n - 1}`, lang);
    parts.push(
      `<a href="${href}">${escapeHtml(pack.ui.prev)}: ${n - 1}. ${escapeHtml(pack.steps[n - 2].title)}</a>`
    );
  }
  if (n < pack.steps.length) {
    const href = localizedPath(`/oefening-${n + 1}`, lang);
    parts.push(
      `<a href="${href}">${escapeHtml(pack.ui.next)}: ${n + 1}. ${escapeHtml(pack.steps[n].title)}</a>`
    );
  }
  return `<p class="pager">${parts.join('')}</p>`;
}

function rewriteBodyLinks(html, lang) {
  const splitAt = html.indexOf('</head>');
  if (splitAt < 0) return html;
  const head = html.slice(0, splitAt);
  const body = html.slice(splitAt).replace(/href="(\/[^"]*)"/g, (full, href) => {
    const hashAt = href.indexOf('#');
    const beforeHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
    const hash = hashAt >= 0 ? href.slice(hashAt) : '';
    const pathOnly = beforeHash.split('?')[0];
    if (/\.(css|js|png|jpe?g|svg|webp|gif|ico|xml|txt|woff2?)$/i.test(pathOnly)) return full;
    return `href="${localizedPath(pathOnly || '/', lang)}${hash}"`;
  });
  return head + body;
}

function renderPage(source, pack, lang, page) {
  source = source.replace(/\r\n/g, '\n').replace(/\r/g, '');
  const exercise = Number((source.match(/data-exercise="(\d+)"/) || [])[1] || 0);
  let html = applyTexts(source, pack);
  html = replaceHead(html, lang, page);
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  let title = pack.ui.homeTitle;
  if (exercise && pack.steps[exercise - 1]) {
    title = `${exercise}. ${pack.steps[exercise - 1].title} — Audiation`;
    html = html.replace(
      /<h1>[^<]*<\/h1>/,
      `<h1>${exercise}. ${escapeHtml(pack.steps[exercise - 1].title)}</h1>`
    );
    html = html.replace(/<p class="pager">[\s\S]*?<\/p>/, pagerHtml(pack, exercise, lang));
  } else if (page === '/over') {
    title = `${pack.ui.aboutTitle} — Audiation`;
  } else if (page === '/privacy') {
    title = `${pack.ui.privacy} — Audiation`;
  }
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = rewriteBodyLinks(html, lang);
  if (lang !== 'nl' && !html.includes('generated by scripts/build-lang-pages.mjs')) {
    html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- generated by scripts/build-lang-pages.mjs -->');
  }
  return html;
}

function sitemap(today) {
  const blocks = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const alts = [
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl('nl', page)}"/>`,
        ...LANGS.map((id) => `    <xhtml:link rel="alternate" hreflang="${id}" href="${absUrl(id, page)}"/>`),
      ];
      blocks.push(`  <url>
    <loc>${absUrl(lang, page)}</loc>
    <lastmod>${today}</lastmod>
${alts.join('\n')}
  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join('\n')}
</urlset>
`;
}

export function rebuildLocalizedSite() {
  const packs = loadPacks();
  for (const lang of LANGS) {
    if (!packs[lang] || !packs[lang].steps || packs[lang].steps.length !== 12) {
      throw new Error(`Expected 12 steps for ${lang}`);
    }
    if (!packs[lang].homeSteps || packs[lang].homeSteps.length !== 12) {
      throw new Error(`Expected 12 home steps for ${lang}`);
    }
    if (!packs[lang].exercises || packs[lang].exercises.length !== 12) {
      throw new Error(`Expected 12 exercise texts for ${lang}`);
    }
  }
  const sources = new Map();
  for (const page of PAGES) {
    sources.set(page, fs.readFileSync(path.join(SITE, sourceName(page)), 'utf8'));
  }
  for (const lang of FOREIGN) fs.mkdirSync(path.join(SITE, lang), { recursive: true });
  for (const lang of LANGS) {
    for (const page of PAGES) {
      const html = renderPage(sources.get(page), packs[lang], lang, page);
      const dest = outPath(lang, page);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, html);
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), sitemap(today));
  console.log(`wrote ${LANGS.length * PAGES.length} pages and sitemap.xml`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) rebuildLocalizedSite();
