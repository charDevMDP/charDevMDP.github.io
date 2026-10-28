import { LANGS, type Lang } from './langs';

export type Status = 'production' | 'testing' | 'soon';
export type Action = 'play' | 'tester' | 'none';

export interface App {
  id: string;
  name: string;
  status: Status;
  versionProduction: string | null;
  versionTesting: string | null;
  playUrl: string | null;
  optInUrl: string | null;
  groupUrl: string | null;
  privacyUrl: string | null;
  icon: string;
  screenshots: Record<Lang, string[]>;
  screenshotSize: { width: number; height: number };
}

const STATUSES = ['production', 'testing', 'soon'];
const RESERVED_IDS = ['en', 'tester', '_astro', 'images', 'sitemap'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const URL_KEYS = ['playUrl', 'optInUrl', 'groupUrl', 'privacyUrl'] as const;

const isHttps = (v: unknown): boolean => typeof v === 'string' && /^https:\/\/\S+$/.test(v);
const positive = (n: unknown): boolean => Number.isInteger(n) && (n as number) > 0;

export function validateApps(input: unknown): App[] {
  if (!Array.isArray(input)) throw new Error('apps.json debe ser una lista');

  const problems: string[] = [];
  const seen = new Set<string>();

  input.forEach((raw, i) => {
    const a = (raw ?? {}) as Record<string, unknown>;
    const label = typeof a.id === 'string' ? a.id : `#${i}`;
    const need = (ok: boolean, msg: string) => {
      if (!ok) problems.push(`${label}: ${msg}`);
    };

    need(typeof a.id === 'string' && ID_RE.test(a.id), 'id inválido (minúsculas, números y guiones)');
    if (typeof a.id === 'string') {
      need(!RESERVED_IDS.includes(a.id), 'id reservado por una ruta del sitio');
      need(!seen.has(a.id), 'id repetido');
      seen.add(a.id);
    }
    need(typeof a.name === 'string' && a.name.length > 0, 'falta name');
    need(STATUSES.includes(a.status as string), 'status debe ser production, testing o soon');
    need(typeof a.icon === 'string' && a.icon.startsWith('/'), 'icon debe ser una ruta que empiece con /');

    const shots = a.screenshots as Record<string, unknown> | undefined;
    for (const lang of LANGS) {
      need(Array.isArray(shots?.[lang]), `screenshots.${lang} debe ser una lista`);
    }
    const size = a.screenshotSize as { width?: unknown; height?: unknown } | undefined;
    need(positive(size?.width) && positive(size?.height), 'screenshotSize necesita width y height enteros positivos');

    for (const key of URL_KEYS) {
      need(a[key] === null || isHttps(a[key]), `${key} debe ser null o una URL https`);
    }
    for (const key of ['versionProduction', 'versionTesting'] as const) {
      need(a[key] === null || (typeof a[key] === 'string' && a[key] !== ''), `${key} debe ser null o un texto`);
    }

    if (a.status === 'production') {
      need(!!a.versionProduction, 'en producción falta versionProduction');
      need(!!a.playUrl, 'en producción falta playUrl');
      need(!!a.privacyUrl, 'en producción falta privacyUrl');
    }
    if (a.status === 'testing') {
      need(!!a.versionTesting, 'en testing falta versionTesting');
      need(!!a.optInUrl, 'en testing falta optInUrl');
      need(!!a.groupUrl, 'en testing falta groupUrl');
      need(!!a.privacyUrl, 'en testing falta privacyUrl');
    }
  });

  if (problems.length > 0) throw new Error(`apps.json inválido:\n- ${problems.join('\n- ')}`);
  return input as App[];
}

export function primaryAction(app: App): Action {
  if (app.status === 'production') return 'play';
  if (app.status === 'testing') return 'tester';
  return 'none';
}

export function hasTesting(app: App): boolean {
  return Boolean(app.versionTesting && app.optInUrl && app.groupUrl);
}
