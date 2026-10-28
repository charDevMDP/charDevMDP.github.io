import type { APIRoute } from 'astro';
import { apps } from '../data/apps';
import { buildSitemap, sitePaths } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('astro.config.mjs: falta "site"');
  return new Response(buildSitemap(site.origin, sitePaths(apps)), {
    headers: { 'Content-Type': 'application/xml' },
  });
};
