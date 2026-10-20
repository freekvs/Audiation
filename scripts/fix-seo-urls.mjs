/**
 * Rewrite site SEO URLs to Cloudflare extensionless form.
 * /oefening-1.html -> /oefening-1 (because .html 307-redirects).
 */
import fs from 'fs';
import path from 'path';
import { rebuildLocalizedSite } from './build-lang-pages.mjs';

const SITE = path.resolve('G:/users/freek/Audiation/site');

function stripHtmlExt(s) {
  return s
    .replace(/https:\/\/audiation\.app\/index\.html/g, 'https://audiation.app/')
    .replace(/https:\/\/audiation\.app\/([^"'?\s]+)\.html/g, 'https://audiation.app/$1')
    .replace(/href="\/([^"#?]+)\.html/g, 'href="/$1')
    .replace(/href='\/([^'#?]+)\.html/g, "href='/$1");
}

const htmlFiles = fs.readdirSync(SITE).filter((f) => f.endsWith('.html'));
for (const f of htmlFiles) {
  const p = path.join(SITE, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = stripHtmlExt(before);
  if (after !== before) {
    fs.writeFileSync(p, after);
    console.log('updated', f);
  }
}

rebuildLocalizedSite();

// robots.txt — clear allow + sitemap (live CF file currently lacks both)
const robots = `User-agent: *
Allow: /

Sitemap: https://audiation.app/sitemap.xml
`;
fs.writeFileSync(path.join(SITE, 'robots.txt'), robots);
console.log('wrote robots.txt');
