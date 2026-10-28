import { htmlLang, localePath } from './i18n';
import { LANGS } from './langs';

export function sitePaths(apps: { id: string }[]): string[] {
  return ['/', '/tester/', ...apps.map((a) => `/${a.id}/`)];
}

export function buildSitemap(origin: string, paths: string[]): string {
  const urls = paths.flatMap((path) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${origin}${localePath(l, path)}"/>`),
        `<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localePath('es', path)}"/>`,
      ].join('');
      return `<url><loc>${origin}${localePath(lang, path)}</loc>${alternates}</url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
}
