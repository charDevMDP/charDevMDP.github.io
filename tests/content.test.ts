import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from '../src/data/apps.json';
import en from '../src/i18n/en.json';
import es from '../src/i18n/es.json';
import { validateApps } from '../src/lib/apps';
import { assertParity, lookup } from '../src/lib/i18n';
import { LANGS } from '../src/lib/langs';

const apps = validateApps(raw);

describe('contenido real del sitio', () => {
  it('apps.json cumple las reglas', () => {
    expect(apps.length).toBeGreaterThan(0);
  });

  it('es.json y en.json tienen las mismas claves', () => {
    expect(() => assertParity(es, en)).not.toThrow();
  });

  it('cada app tiene tagline y description en ambos idiomas', () => {
    for (const app of apps) {
      for (const dict of [es, en]) {
        for (const key of ['tagline', 'description']) {
          expect(lookup(dict, `apps.${app.id}.${key}`), `${app.id}.${key}`).toBeTypeOf('string');
        }
      }
    }
  });

  it('cada ícono y cada captura existe en public/', () => {
    for (const app of apps) {
      const files = [app.icon, ...LANGS.flatMap((l) => app.screenshots[l])];
      for (const f of files) expect(existsSync(join('public', f)), f).toBe(true);
    }
  });
});
