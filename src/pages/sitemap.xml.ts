import type { APIRoute } from 'astro';
import { apps } from '../data/apps';
import { buildSitemap, sitePaths } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) =>
  new Response(buildSitemap(site!.origin, sitePaths(apps)), {
    headers: { 'Content-Type': 'application/xml' },
  });
