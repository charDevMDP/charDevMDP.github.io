import { describe, expect, it } from 'vitest';
import { buildSitemap, sitePaths } from '../src/lib/sitemap';

describe('sitemap', () => {
  it('lista portada, testers y una página por app', () => {
    expect(sitePaths([{ id: 'a' }, { id: 'b' }])).toEqual(['/', '/tester/', '/a/', '/b/']);
  });

  it('incluye cada ruta en los dos idiomas con sus alternativas', () => {
    const xml = buildSitemap('https://example.org', ['/', '/a/']);
    expect(xml).toContain('<loc>https://example.org/</loc>');
    expect(xml).toContain('<loc>https://example.org/en/</loc>');
    expect(xml).toContain('<loc>https://example.org/a/</loc>');
    expect(xml).toContain('<loc>https://example.org/en/a/</loc>');
    expect(xml).toContain('hreflang="es-AR"');
    expect(xml).toContain('hreflang="x-default"');
    expect((xml.match(/<url>/g) ?? []).length).toBe(4);
  });
});
