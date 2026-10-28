# Sitio charDev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el `index.html` de `chardevmdp.github.io` por un hub Astro bilingüe (es/en) con las apps, su estado, versión en producción y el camino para sumarse o darse de baja como tester.

**Architecture:** Astro estático con CSS puro y tokens. Una sola fuente de datos (`src/data/apps.json`) más textos por idioma (`src/i18n/es.json`, `en.json`). La lógica pura (validación de apps, i18n, sitemap) vive en `src/lib/` con tests de vitest; las páginas son vistas finas que reciben `lang`. El build falla si faltan datos o claves de texto. Se despliega con GitHub Actions al hacer merge en `main`.

**Tech Stack:** Astro ^7.3.5, TypeScript, vitest, `@fontsource/inter`, `@fontsource/rajdhani`, GitHub Actions + Pages. npm (como ICBR).

**Spec:** [`docs/superpowers/specs/2026-10-27-sitio-chardev-design.md`](../specs/2026-10-27-sitio-chardev-design.md)

## Global Constraints

- Directorio de trabajo: `/Users/char/Documents/Projects/charDev/charDevMDP.github.io`. Los repos hermanos (`../SuguruNeon`, `../ReinaNeon`, `../GeLi`) son solo lectura: se **copian** archivos, no se modifican.
- Astro `^7.3.5`, `site: 'https://chardevmdp.github.io'`, `trailingSlash: 'always'`, salida estática. Node 24, npm.
- Un solo tema, **oscuro**, con tokens semánticos en `src/styles/tokens.css`. Paleta del logo, valores exactos: acento `#2CF4FC`, pizarra `#444C54`, gris borde `#848484`, fondo `#0C0C0C`, fondo profundo `#040404`. Texto principal `#F2F4F6`.
- **Sin `style=""` en el markup y sin `<script>` en línea con código** (CSP de Astro por hash). Sin Google Fonts: solo `@fontsource/*`.
- `lang`: `es-AR` para español, `en` para inglés. Español con voseo y ortografía cuidada (signos de apertura, tildes).
- Rutas: español en `/…`, inglés en `/en/…`. Rutas existentes que **no** se pueden pisar: `/suguruneon-legal/`, `/geli-legal/` (repos aparte) y `/app-ads.txt` (idéntico al actual: `google.com, pub-6526918428646723, DIRECT, f08c47fec0942fa0`).
- Enlaces con `target="_blank"` llevan `rel="noopener"` y un `<span class="sr-only">` con el aviso de pestaña nueva.
- WCAG 2.2 AA: foco visible, teclado, `alt`, una sola `h1` por página, `prefers-reduced-motion`.
- El build **falla** si: una app `production` no tiene `versionProduction`, `playUrl` o `privacyUrl`; una `testing` no tiene `versionTesting`, `optInUrl`, `groupUrl` o `privacyUrl`; `es.json` y `en.json` no tienen las mismas claves; falta una clave de texto usada.
- Commits en español, estilo convencional. Cada commit lleva como última línea el trailer que exige el `CLAUDE.md` raíz: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (en los comandos de este plan va como segundo `-m`).
- Flujo de ramas: todo el trabajo sale de `develop` en la rama `feat/sitio-astro`, vuelve por PR a `develop`, y `develop → main` lo hace Claude al final con los tests corridos. **El deploy solo corre en `main`**: hasta ese merge, el sitio publicado no cambia.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/lib/langs.ts` | `LANGS` y el tipo `Lang` |
| `src/lib/apps.ts` | Tipos de `App`, `validateApps`, `primaryAction`, `hasTesting` |
| `src/lib/i18n.ts` | Diccionarios, `t`, `translate`, `lookup`, `flatKeys`, `assertParity`, `localePath`, `otherLang`, `htmlLang` |
| `src/lib/sitemap.ts` | `sitePaths`, `buildSitemap` |
| `src/data/apps.json` | Datos de las apps (estado, versiones, enlaces, imágenes) |
| `src/data/apps.ts` | `apps` validado al cargar (rompe el build si hay errores) |
| `src/data/site.ts` | Constantes del sitio (`CONTACT_EMAIL`) |
| `src/i18n/es.json`, `en.json` | Textos por idioma |
| `src/styles/tokens.css`, `global.css` | Design tokens y estilos |
| `src/layouts/Base.astro` | `<head>`, hreflang, cabecera, pie |
| `src/components/*.astro` | `StatusBadge`, `AppCard`, `TesterSteps`, `Screenshots` |
| `src/views/*.astro` | `HomePage`, `AppPage`, `TesterPage` (reciben `lang`) |
| `src/pages/**` | Rutas finas es/en que montan las vistas, más `sitemap.xml.ts` |
| `scripts/check-dist.mjs`, `check-links.mjs` | Verificación del build y de los enlaces |
| `tests/*.test.ts` | vitest |
| `.github/workflows/site.yml` | CI + deploy |

---

### Task 1: Ramas y esqueleto Astro

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/pages/index.astro`, `public/app-ads.txt` (movido)
- Delete: `index.html`, `.nojekyll`

**Interfaces:**
- Produces: proyecto Astro que compila; scripts npm `dev`, `build`, `preview`, `test`, `check:dist`, `check:links`; `dist/app-ads.txt` idéntico al original.

- [ ] **Step 1: Subir la spec y el plan, y crear `develop`**

La spec y este plan están en `docs/sitio-chardev-spec` (desde `main`). Hay que dejarlos en `develop`:

```bash
cd /Users/char/Documents/Projects/charDev/charDevMDP.github.io
git add docs/superpowers/plans/2026-10-28-sitio-chardev.md
git commit -m "docs(sitio): plan de implementación del hub charDev" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin docs/sitio-chardev-spec
git checkout -b develop main
git push -u origin develop
gh pr create --base develop --head docs/sitio-chardev-spec --title "docs(sitio): spec y plan del hub charDev" --body "Spec y plan de implementación del sitio. Sin cambios de código.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: PR creado contra `develop`.

- [ ] **Step 2: Mergear el PR de docs y salir a la rama de trabajo**

```bash
gh pr merge --merge --delete-branch docs/sitio-chardev-spec
git checkout develop && git pull
git checkout -b feat/sitio-astro
git branch --show-current
```
Expected: `feat/sitio-astro`; `ls docs/superpowers/specs docs/superpowers/plans` muestra ambos archivos.

- [ ] **Step 3: Escribir `package.json`**

```json
{
  "name": "chardev-site",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "check:dist": "node scripts/check-dist.mjs",
    "check:links": "node scripts/check-links.mjs"
  }
}
```

- [ ] **Step 4: Instalar dependencias**

```bash
npm install astro@^7.3.5 @fontsource/inter @fontsource/rajdhani
npm install -D vitest typescript
```
Expected: se crea `package-lock.json` y `node_modules/`.

- [ ] **Step 5: Escribir `astro.config.mjs`, `tsconfig.json` y `.gitignore`**

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chardevmdp.github.io',
  trailingSlash: 'always',

  // Sin resaltado de código: Shiki usa estilos inline incompatibles con la CSP
  markdown: { syntaxHighlight: false },

  security: {
    // Astro agrega un <meta> CSP por página con los hashes de scripts y estilos que incrusta.
    // GitHub Pages no permite cabeceras propias: frame-ancestors, HSTS, etc. quedan fuera.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": { "resolveJsonModule": true }
}
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.DS_Store
.superpowers/
```

- [ ] **Step 6: Mover `app-ads.txt`, borrar lo viejo y crear una portada mínima**

```bash
mkdir -p public src/pages
git mv app-ads.txt public/app-ads.txt
git rm index.html .nojekyll
```

`src/pages/index.astro` (provisoria; la reemplaza la Task 5 y después la Task 6):
```astro
---
---
<!doctype html>
<html lang="es-AR">
  <head>
    <meta charset="utf-8" />
    <title>charDev</title>
  </head>
  <body>
    <h1>charDev</h1>
  </body>
</html>
```

- [ ] **Step 7: Compilar y comprobar `app-ads.txt`**

```bash
npm run build
git show main:app-ads.txt | diff - dist/app-ads.txt && echo "app-ads.txt idéntico"
```
Expected: build sin errores y `app-ads.txt idéntico`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(sitio): esqueleto Astro con CSP y app-ads.txt" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lógica de apps (validación)

**Files:**
- Create: `src/lib/langs.ts`, `src/lib/apps.ts`
- Test: `tests/apps.test.ts`

**Interfaces:**
- Produces:
  - `LANGS: readonly ['es','en']`, `type Lang = 'es' | 'en'` (`src/lib/langs.ts`)
  - `type Status = 'production' | 'testing' | 'soon'`
  - `interface App { id: string; name: string; status: Status; versionProduction: string | null; versionTesting: string | null; playUrl: string | null; optInUrl: string | null; groupUrl: string | null; privacyUrl: string | null; icon: string; screenshots: Record<Lang, string[]>; screenshotSize: { width: number; height: number } }`
  - `validateApps(input: unknown): App[]` (lanza `Error` con **todos** los problemas)
  - `type Action = 'play' | 'tester' | 'none'`, `primaryAction(app: App): Action`, `hasTesting(app: App): boolean`

- [ ] **Step 1: Escribir los tests que fallan**

`tests/apps.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hasTesting, primaryAction, validateApps, type App } from '../src/lib/apps';

const base = (over: Record<string, unknown> = {}) => ({
  id: 'demo',
  name: 'Demo',
  status: 'soon',
  versionProduction: null,
  versionTesting: null,
  playUrl: null,
  optInUrl: null,
  groupUrl: null,
  privacyUrl: null,
  icon: '/images/apps/demo/icon.png',
  screenshots: { es: [], en: [] },
  screenshotSize: { width: 1080, height: 2400 },
  ...over,
});

const production = (over: Record<string, unknown> = {}) =>
  base({
    status: 'production',
    versionProduction: '1.0.2',
    playUrl: 'https://play.google.com/store/apps/details?id=com.chardev.demo',
    privacyUrl: 'https://chardevmdp.github.io/demo-legal/',
    ...over,
  });

const testing = (over: Record<string, unknown> = {}) =>
  base({
    status: 'testing',
    versionTesting: '0.9.0',
    optInUrl: 'https://play.google.com/apps/testing/com.chardev.demo',
    groupUrl: 'https://groups.google.com/g/chardev-testers',
    privacyUrl: 'https://chardevmdp.github.io/demo-legal/',
    ...over,
  });

describe('validateApps', () => {
  it('acepta apps completas en cada estado', () => {
    expect(() => validateApps([base(), production({ id: 'a' }), testing({ id: 'b' })])).not.toThrow();
  });

  it('rechaza lo que no es una lista', () => {
    expect(() => validateApps({})).toThrow('lista');
  });

  it('exige versionProduction y playUrl en producción', () => {
    expect(() => validateApps([production({ versionProduction: null })])).toThrow('versionProduction');
    expect(() => validateApps([production({ playUrl: null })])).toThrow('playUrl');
  });

  it('exige versión, enlace de prueba y grupo en testing', () => {
    expect(() => validateApps([testing({ versionTesting: null })])).toThrow('versionTesting');
    expect(() => validateApps([testing({ optInUrl: null })])).toThrow('optInUrl');
    expect(() => validateApps([testing({ groupUrl: null })])).toThrow('groupUrl');
  });

  it('rechaza ids repetidos, reservados o con formato inválido', () => {
    expect(() => validateApps([base(), base()])).toThrow('repetido');
    expect(() => validateApps([base({ id: 'tester' })])).toThrow('reservado');
    expect(() => validateApps([base({ id: 'Mi App' })])).toThrow('id inválido');
  });

  it('rechaza URLs que no son https', () => {
    expect(() => validateApps([production({ playUrl: 'http://play.google.com/x' })])).toThrow('playUrl');
  });

  it('rechaza un status desconocido y un tamaño de captura inválido', () => {
    expect(() => validateApps([base({ status: 'beta' })])).toThrow('status');
    expect(() => validateApps([base({ screenshotSize: { width: 0, height: 10 } })])).toThrow('screenshotSize');
  });

  it('informa todos los problemas juntos', () => {
    try {
      validateApps([production({ versionProduction: null, playUrl: null })]);
      expect.unreachable();
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('versionProduction');
      expect(msg).toContain('playUrl');
    }
  });
});

describe('primaryAction y hasTesting', () => {
  const apps = validateApps([production({ id: 'a' }), testing({ id: 'b' }), base({ id: 'c' })]) as App[];

  it('elige el botón principal según el estado', () => {
    expect(primaryAction(apps[0])).toBe('play');
    expect(primaryAction(apps[1])).toBe('tester');
    expect(primaryAction(apps[2])).toBe('none');
  });

  it('hasTesting es verdadero solo con versión, enlace de prueba y grupo', () => {
    expect(hasTesting(apps[1])).toBe(true);
    expect(hasTesting(apps[0])).toBe(false);
    const prodWithTesting = validateApps([
      production({
        id: 'd',
        versionTesting: '1.1.0',
        optInUrl: 'https://play.google.com/apps/testing/x',
        groupUrl: 'https://groups.google.com/g/chardev-testers',
      }),
    ])[0];
    expect(hasTesting(prodWithTesting)).toBe(true);
  });
});
```

- [ ] **Step 2: Correr los tests y ver que fallan**

Run: `npx vitest run tests/apps.test.ts`
Expected: FAIL (no se puede resolver `../src/lib/apps`).

- [ ] **Step 3: Implementar**

`src/lib/langs.ts`:
```ts
export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
```

`src/lib/apps.ts`:
```ts
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
```

- [ ] **Step 4: Correr los tests y ver que pasan**

Run: `npx vitest run tests/apps.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add src/lib tests
git commit -m "feat(sitio): validación de apps y acción principal por estado" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: i18n (helpers y textos comunes)

**Files:**
- Create: `src/lib/i18n.ts`, `src/data/site.ts`, `src/i18n/es.json`, `src/i18n/en.json`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: `Lang`, `LANGS` de `src/lib/langs.ts`.
- Produces (`src/lib/i18n.ts`):
  - `type Dict = { [key: string]: string | Dict }`
  - `flatKeys(dict: Dict, prefix?: string): string[]`
  - `missingKeys(source: Dict, target: Dict): string[]` (claves de `source` que no están en `target`)
  - `assertParity(es: Dict, en: Dict): void` (lanza si difieren; se ejecuta al importar el módulo)
  - `lookup(dict: Dict, key: string): string | undefined`
  - `translate(dict: Dict, key: string, vars?: Record<string, string | number>): string` (lanza si falta la clave o una variable)
  - `t(lang: Lang, key: string, vars?: Record<string, string | number>): string`
  - `localePath(lang: Lang, path: string): string` (`path` empieza y termina con `/`)
  - `otherLang(lang: Lang): Lang`, `htmlLang: Record<Lang, string>`
- Produces (`src/data/site.ts`): `CONTACT_EMAIL = 'chardev.code@gmail.com'`
- Claves de texto que usan las Tasks 5–7 (todas definidas acá salvo `apps.<id>.*`, que agrega la Task 4): `meta.*`, `nav.*`, `home.*`, `status.*`, `app.*`, `tester.*`, `footer.contact`, `a11y.*`.

- [ ] **Step 1: Escribir los tests que fallan**

`tests/i18n.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  assertParity,
  flatKeys,
  localePath,
  lookup,
  missingKeys,
  otherLang,
  t,
  translate,
} from '../src/lib/i18n';

describe('claves', () => {
  const a = { x: { y: 'uno', z: 'dos' }, w: 'tres' };

  it('aplana las claves anidadas', () => {
    expect(flatKeys(a)).toEqual(['x.y', 'x.z', 'w']);
  });

  it('detecta claves que faltan', () => {
    expect(missingKeys(a, { x: { y: 'one' }, w: 'three' })).toEqual(['x.z']);
  });

  it('assertParity falla con las claves que difieren', () => {
    expect(() => assertParity(a, { x: { y: 'one' }, w: 'three' })).toThrow('x.z');
    expect(() => assertParity({ k: 'a' }, { k: 'a', extra: 'b' })).toThrow('extra');
    expect(() => assertParity(a, { x: { y: 'one', z: 'two' }, w: 'three' })).not.toThrow();
  });
});

describe('traducción', () => {
  const dict = { hi: 'Hola {name}', plain: 'Listo', nested: { k: 'Anidado' } };

  it('busca claves anidadas', () => {
    expect(lookup(dict, 'nested.k')).toBe('Anidado');
    expect(lookup(dict, 'nested.nope')).toBeUndefined();
    expect(lookup(dict, 'plain.deeper')).toBeUndefined();
  });

  it('reemplaza variables', () => {
    expect(translate(dict, 'hi', { name: 'Char' })).toBe('Hola Char');
  });

  it('falla si falta la clave o la variable', () => {
    expect(() => translate(dict, 'nada')).toThrow('nada');
    expect(() => translate(dict, 'hi')).toThrow('name');
  });

  it('t usa los diccionarios reales de cada idioma', () => {
    expect(t('es', 'status.production')).toBe('En producción');
    expect(t('en', 'status.production')).toBe('In production');
  });
});

describe('rutas por idioma', () => {
  it('español queda en la raíz e inglés bajo /en', () => {
    expect(localePath('es', '/')).toBe('/');
    expect(localePath('en', '/')).toBe('/en/');
    expect(localePath('es', '/tester/')).toBe('/tester/');
    expect(localePath('en', '/suguruneon/')).toBe('/en/suguruneon/');
  });

  it('otherLang alterna', () => {
    expect(otherLang('es')).toBe('en');
    expect(otherLang('en')).toBe('es');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run tests/i18n.test.ts`
Expected: FAIL (no se puede resolver `../src/lib/i18n`).

- [ ] **Step 3: Escribir los textos en español**

`src/i18n/es.json`:
```json
{
  "meta": {
    "homeTitle": "charDev · Apps",
    "homeDescription": "Apps de charDev: el estado de cada una, la versión en producción y cómo sumarte como tester.",
    "testerTitle": "Ser tester · charDev",
    "testerDescription": "Cómo probar las apps de charDev antes del lanzamiento y cómo darte de baja del testing."
  },
  "nav": {
    "label": "Principal",
    "apps": "Apps",
    "tester": "Ser tester",
    "otherLanguage": "English",
    "otherLanguageLabel": "Read this page in English"
  },
  "home": {
    "lead": "Apps hechas de a una.",
    "appsHeading": "Mis apps",
    "testerHeading": "Probá las apps antes que nadie",
    "testerBody": "Si querés ayudarme a probar una app antes del lanzamiento, sumarte lleva dos minutos y podés salir cuando quieras.",
    "testerCta": "Cómo ser tester"
  },
  "status": {
    "production": "En producción",
    "testing": "En testing",
    "soon": "Próximamente"
  },
  "app": {
    "back": "Volver a las apps",
    "play": "Ver en Google Play",
    "beTester": "Ser tester",
    "details": "Ver detalles",
    "privacy": "Política de privacidad",
    "screenshots": "Capturas",
    "versionProduction": "Versión en producción",
    "versionTesting": "Versión en testing",
    "notYet": "Todavía no está disponible. Pronto habrá novedades acá.",
    "iconAlt": "Ícono de {name}",
    "screenshotAlt": "Captura {n} de {name}",
    "testerHeading": "Ser tester",
    "testerIntro": "Probá {name} antes del lanzamiento y ayudame a encontrar problemas.",
    "leaveHeading": "Darte de baja del testing"
  },
  "tester": {
    "heading": "Ser tester",
    "intro": "Las apps de charDev se prueban en un testing cerrado de Google Play antes de lanzarlas. Sumarte lleva dos minutos y podés salir cuando quieras.",
    "joinHeading": "Cómo sumarte",
    "join": {
      "step1": "Unite al grupo de testers de Google (un clic).",
      "cta1": "Unirme al grupo",
      "step2": "Abrí el enlace de prueba de la app y tocá «Convertirme en tester».",
      "cta2": "Abrir enlace de prueba",
      "step3": "Instalá la app desde Google Play con la misma cuenta de Google."
    },
    "leaveHeading": "Cómo darte de baja",
    "leave": {
      "step1": "Abrí de nuevo el enlace de prueba de la app y tocá «Salir del programa».",
      "cta1": "Abrir enlace de prueba",
      "step2": "Desinstalá la versión de prueba. Si querés, después instalá la versión pública desde Google Play.",
      "step3": "Si no querés participar en ninguna otra prueba, salí del grupo de testers.",
      "cta3": "Ir al grupo"
    },
    "groupNote": "El grupo de testers es el mismo para todas las apps: si salís del grupo, dejás de recibir las pruebas de todas ellas.",
    "appsHeading": "Apps en testing",
    "noneTesting": "Ahora no hay ninguna app abierta a testers. Volvé pronto.",
    "faqHeading": "Preguntas frecuentes",
    "faq": {
      "q1": "¿Qué datos míos guarda charDev?",
      "a1": "Ninguno: este sitio no tiene formularios ni cuentas. La lista de testers la administra Google a través del grupo.",
      "q2": "¿Cómo reporto un problema?",
      "a2": "Escribime a {email} contando qué hiciste y qué modelo de teléfono usás.",
      "q3": "¿Puedo probar en iPhone?",
      "a3": "Por ahora las pruebas son solo para Android, a través de Google Play."
    }
  },
  "footer": {
    "contact": "Contacto"
  },
  "a11y": {
    "newTab": "(se abre en una pestaña nueva)",
    "skip": "Saltar al contenido"
  }
}
```

- [ ] **Step 4: Escribir los textos en inglés**

`src/i18n/en.json`:
```json
{
  "meta": {
    "homeTitle": "charDev · Apps",
    "homeDescription": "charDev apps: the status of each one, the production version, and how to join as a tester.",
    "testerTitle": "Become a tester · charDev",
    "testerDescription": "How to try charDev apps before launch and how to leave the testing program."
  },
  "nav": {
    "label": "Main",
    "apps": "Apps",
    "tester": "Become a tester",
    "otherLanguage": "Español",
    "otherLanguageLabel": "Leer esta página en español"
  },
  "home": {
    "lead": "Apps built one at a time.",
    "appsHeading": "Apps",
    "testerHeading": "Try the apps before anyone else",
    "testerBody": "If you want to help me test an app before launch, joining takes two minutes and you can leave whenever you like.",
    "testerCta": "How to become a tester"
  },
  "status": {
    "production": "In production",
    "testing": "In testing",
    "soon": "Coming soon"
  },
  "app": {
    "back": "Back to apps",
    "play": "Get it on Google Play",
    "beTester": "Become a tester",
    "details": "See details",
    "privacy": "Privacy policy",
    "screenshots": "Screenshots",
    "versionProduction": "Production version",
    "versionTesting": "Testing version",
    "notYet": "Not available yet. News coming soon.",
    "iconAlt": "{name} icon",
    "screenshotAlt": "Screenshot {n} of {name}",
    "testerHeading": "Become a tester",
    "testerIntro": "Try {name} before launch and help me find problems.",
    "leaveHeading": "Leave the testing program"
  },
  "tester": {
    "heading": "Become a tester",
    "intro": "charDev apps go through a closed test on Google Play before launch. Joining takes two minutes and you can leave whenever you like.",
    "joinHeading": "How to join",
    "join": {
      "step1": "Join the Google testers group (one click).",
      "cta1": "Join the group",
      "step2": "Open the app's test link and tap “Become a tester”.",
      "cta2": "Open test link",
      "step3": "Install the app from Google Play with the same Google account."
    },
    "leaveHeading": "How to leave",
    "leave": {
      "step1": "Open the app's test link again and tap “Leave the program”.",
      "cta1": "Open test link",
      "step2": "Uninstall the test version. If you like, install the public version from Google Play afterwards.",
      "step3": "If you don't want to take part in any other test, leave the testers group.",
      "cta3": "Go to the group"
    },
    "groupNote": "The testers group is the same for every app: if you leave the group, you stop receiving tests for all of them.",
    "appsHeading": "Apps in testing",
    "noneTesting": "No app is open to testers right now. Check back soon.",
    "faqHeading": "Frequently asked questions",
    "faq": {
      "q1": "What data does charDev keep about me?",
      "a1": "None: this site has no forms or accounts. Google manages the tester list through the group.",
      "q2": "How do I report a problem?",
      "a2": "Write to {email} and tell me what you did and which phone model you use.",
      "q3": "Can I test on iPhone?",
      "a3": "For now, tests are Android only, through Google Play."
    }
  },
  "footer": {
    "contact": "Contact"
  },
  "a11y": {
    "newTab": "(opens in a new tab)",
    "skip": "Skip to content"
  }
}
```

- [ ] **Step 5: Implementar `i18n.ts` y `site.ts`**

`src/lib/i18n.ts`:
```ts
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import type { Lang } from './langs';

export type Dict = { [key: string]: string | Dict };
type Vars = Record<string, string | number>;

const dicts: Record<Lang, Dict> = { es, en };

export const htmlLang: Record<Lang, string> = { es: 'es-AR', en: 'en' };

export function flatKeys(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatKeys(v, `${prefix}${k}.`),
  );
}

export function missingKeys(source: Dict, target: Dict): string[] {
  const have = new Set(flatKeys(target));
  return flatKeys(source).filter((k) => !have.has(k));
}

export function assertParity(esDict: Dict, enDict: Dict): void {
  const problems = [
    ...missingKeys(esDict, enDict).map((k) => `falta en en.json: ${k}`),
    ...missingKeys(enDict, esDict).map((k) => `falta en es.json: ${k}`),
  ];
  if (problems.length > 0) throw new Error(`es.json y en.json no coinciden:\n- ${problems.join('\n- ')}`);
}

// Si los diccionarios no coinciden, el build falla acá, antes de renderizar nada.
assertParity(dicts.es, dicts.en);

export function lookup(dict: Dict, key: string): string | undefined {
  let cur: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (cur === undefined || typeof cur === 'string') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function translate(dict: Dict, key: string, vars: Vars = {}): string {
  const raw = lookup(dict, key);
  if (raw === undefined) throw new Error(`Falta la clave de texto: ${key}`);
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`Falta la variable {${name}} en ${key}`);
    return String(vars[name]);
  });
}

export function t(lang: Lang, key: string, vars?: Vars): string {
  return translate(dicts[lang], key, vars);
}

export function localePath(lang: Lang, path: string): string {
  return lang === 'es' ? path : `/en${path}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}
```

`src/data/site.ts`:
```ts
export const CONTACT_EMAIL = 'chardev.code@gmail.com';
```

- [ ] **Step 6: Correr los tests y ver que pasan**

Run: `npx vitest run`
Expected: PASS (apps + i18n).

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat(sitio): helpers de i18n y textos comunes es/en con paridad de claves" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Imágenes y datos de las apps

**Files:**
- Create: `public/images/apps/**`, `src/data/apps.json`, `src/data/apps.ts`, `tests/content.test.ts`
- Modify: `src/i18n/es.json`, `src/i18n/en.json` (agregan el bloque `apps`)

**Interfaces:**
- Consumes: `validateApps`, `App` (Task 2); `assertParity`, `lookup` (Task 3).
- Produces: `apps: App[]` y `getApp(id: string): App | undefined` (`src/data/apps.ts`); claves `apps.<id>.tagline` y `apps.<id>.description` en ambos idiomas para `suguruneon`, `geli` y `reinaneon`.

Datos iniciales (los confirma Char en la Task 9, antes del merge a `main`): `suguruneon` en producción (versión leída de `apps/mobile/app.json`: `1.0.2`), `geli` y `reinaneon` como `soon`. ReinaNeon está en prueba **interna** de Play, que no es abierta a testers, y su política de privacidad todavía no existe; GeLi no tiene enlace público a Play. `AquiMascotas` y `SombraEnMovimiento` quedan fuera: no hay material para mostrar.

- [ ] **Step 1: Copiar íconos y capturas**

```bash
cd /Users/char/Documents/Projects/charDev/charDevMDP.github.io
A=public/images/apps
mkdir -p $A/suguruneon/es $A/suguruneon/en $A/reinaneon/es $A/reinaneon/en $A/geli

cp ../SuguruNeon/docs/tienda/icono-512.png $A/suguruneon/icon.png
i=1; for f in es-1-inicio es-2-partida es-3-pista es-4-desafio es-5-temas; do cp "../SuguruNeon/docs/tienda/$f.png" $A/suguruneon/es/$i.png; i=$((i+1)); done
i=1; for f in en-1-home en-2-game en-3-hint en-4-daily en-5-themes; do cp "../SuguruNeon/docs/tienda/$f.png" $A/suguruneon/en/$i.png; i=$((i+1)); done

cp ../ReinaNeon/docs/tienda/icono-512.png $A/reinaneon/icon.png
i=1; for f in es-1-inicio es-2-partida es-3-pista es-4-diario es-5-temas; do cp "../ReinaNeon/docs/tienda/$f.png" $A/reinaneon/es/$i.png; i=$((i+1)); done
i=1; for f in en-1-home en-2-game en-3-hint en-4-daily en-5-themes; do cp "../ReinaNeon/docs/tienda/$f.png" $A/reinaneon/en/$i.png; i=$((i+1)); done

cp ../GeLi/docs/play-store/icono-512.png $A/geli/icon.png
i=1; for f in 01-inicio 02-compartir 03-coleccion 04-detalle 05-busqueda 06-oscuro; do cp "../GeLi/docs/play-store/capturas/$f.png" $A/geli/$i.png; i=$((i+1)); done

find $A -type f | wc -l; du -sh $A; file $A/suguruneon/es/1.png $A/reinaneon/es/1.png $A/geli/1.png | sed 's/, 8-bit.*//'
```
Expected: 37 archivos; `file` confirma 1080 × 2400 para SuguruNeon y ReinaNeon y 1080 × 1920 para GeLi. Si ReinaNeon no mide 1080 × 2400, corregir `screenshotSize` en el Step 2.

- [ ] **Step 2: Escribir `apps.json`**

`src/data/apps.json`:
```json
[
  {
    "id": "suguruneon",
    "name": "SuguruNeon",
    "status": "production",
    "versionProduction": "1.0.2",
    "versionTesting": null,
    "playUrl": "https://play.google.com/store/apps/details?id=com.chardev.suguruneon",
    "optInUrl": null,
    "groupUrl": null,
    "privacyUrl": "https://chardevmdp.github.io/suguruneon-legal/",
    "icon": "/images/apps/suguruneon/icon.png",
    "screenshots": {
      "es": [
        "/images/apps/suguruneon/es/1.png",
        "/images/apps/suguruneon/es/2.png",
        "/images/apps/suguruneon/es/3.png",
        "/images/apps/suguruneon/es/4.png",
        "/images/apps/suguruneon/es/5.png"
      ],
      "en": [
        "/images/apps/suguruneon/en/1.png",
        "/images/apps/suguruneon/en/2.png",
        "/images/apps/suguruneon/en/3.png",
        "/images/apps/suguruneon/en/4.png",
        "/images/apps/suguruneon/en/5.png"
      ]
    },
    "screenshotSize": { "width": 1080, "height": 2400 }
  },
  {
    "id": "geli",
    "name": "GeLi",
    "status": "soon",
    "versionProduction": null,
    "versionTesting": null,
    "playUrl": null,
    "optInUrl": null,
    "groupUrl": null,
    "privacyUrl": "https://chardevmdp.github.io/geli-legal/",
    "icon": "/images/apps/geli/icon.png",
    "screenshots": {
      "es": [
        "/images/apps/geli/1.png",
        "/images/apps/geli/2.png",
        "/images/apps/geli/3.png",
        "/images/apps/geli/4.png",
        "/images/apps/geli/5.png",
        "/images/apps/geli/6.png"
      ],
      "en": [
        "/images/apps/geli/1.png",
        "/images/apps/geli/2.png",
        "/images/apps/geli/3.png",
        "/images/apps/geli/4.png",
        "/images/apps/geli/5.png",
        "/images/apps/geli/6.png"
      ]
    },
    "screenshotSize": { "width": 1080, "height": 1920 }
  },
  {
    "id": "reinaneon",
    "name": "ReinaNeon",
    "status": "soon",
    "versionProduction": null,
    "versionTesting": null,
    "playUrl": null,
    "optInUrl": null,
    "groupUrl": null,
    "privacyUrl": null,
    "icon": "/images/apps/reinaneon/icon.png",
    "screenshots": {
      "es": [
        "/images/apps/reinaneon/es/1.png",
        "/images/apps/reinaneon/es/2.png",
        "/images/apps/reinaneon/es/3.png",
        "/images/apps/reinaneon/es/4.png",
        "/images/apps/reinaneon/es/5.png"
      ],
      "en": [
        "/images/apps/reinaneon/en/1.png",
        "/images/apps/reinaneon/en/2.png",
        "/images/apps/reinaneon/en/3.png",
        "/images/apps/reinaneon/en/4.png",
        "/images/apps/reinaneon/en/5.png"
      ]
    },
    "screenshotSize": { "width": 1080, "height": 2400 }
  }
]
```

- [ ] **Step 3: Agregar los textos de las apps**

En `src/i18n/es.json`, agregar el bloque `apps` como hermano de `meta` (por ejemplo antes de `"footer"`):
```json
  "apps": {
    "suguruneon": {
      "tagline": "Rompecabezas de lógica con estilo neón. Sin conexión y sin registro.",
      "description": "Suguru con estilo neón: completá cada región con números sin que se repitan entre celdas vecinas. Tiene pistas, un desafío diario y varios temas. Funciona sin conexión y sin registro."
    },
    "geli": {
      "tagline": "Guardá links desde cualquier app y ordenalos en colecciones. Sin cuentas.",
      "description": "GeLi guarda los links que compartís desde cualquier app y los ordena en colecciones. Con búsqueda, vista de detalle, modo oscuro y sin cuentas."
    },
    "reinaneon": {
      "tagline": "Rompecabezas de reinas con estilo neón.",
      "description": "Colocá una reina por fila, columna y región sin que se toquen. Hermana de SuguruNeon, con pistas, un desafío diario y varios temas."
    }
  },
```
En `src/i18n/en.json`, en el mismo lugar:
```json
  "apps": {
    "suguruneon": {
      "tagline": "Neon logic puzzles. Fully offline, no sign-up.",
      "description": "Suguru with a neon look: fill each region with numbers so none repeat between neighboring cells. It has hints, a daily challenge, and several themes. Works offline with no sign-up."
    },
    "geli": {
      "tagline": "Save links from any app and organize them into collections. No accounts.",
      "description": "GeLi saves the links you share from any app and organizes them into collections. With search, a detail view, dark mode, and no accounts."
    },
    "reinaneon": {
      "tagline": "Neon queens puzzles.",
      "description": "Place one queen per row, column, and region so none touch. A sister app to SuguruNeon, with hints, a daily challenge, and several themes."
    }
  },
```

- [ ] **Step 4: Escribir el test de contenido y `apps.ts`**

`tests/content.test.ts`:
```ts
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
```

`src/data/apps.ts`:
```ts
import raw from './apps.json';
import { validateApps, type App } from '../lib/apps';

// Se valida al cargar el módulo: si apps.json tiene un problema, el build falla acá.
export const apps: App[] = validateApps(raw);

export function getApp(id: string): App | undefined {
  return apps.find((a) => a.id === id);
}
```

- [ ] **Step 5: Correr todo y compilar**

```bash
npx vitest run
npm run build
```
Expected: tests PASS y build sin errores.

- [ ] **Step 6: Commit**

```bash
git add public src tests
git commit -m "feat(sitio): datos, textos e imágenes de SuguruNeon, GeLi y ReinaNeon" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Marca, tokens y layout base

**Files:**
- Create: `docs/marca/logo-original.png`, `docs/marca/logo-square.png`, `public/images/logo.png`, `public/images/logo-128.png`, `public/images/logo-512.png`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `t`, `localePath`, `otherLang`, `htmlLang` (Task 3); `LANGS`, `Lang`.
- Produces: `Base.astro` con props `{ lang: Lang; title: string; description: string; path: string }` y `<slot />`; `path` es la ruta lógica en español (`'/'`, `'/tester/'`, `'/suguruneon/'`). Clases CSS que usa la Task 6: `container`, `sr-only`, `btn`, `btn-primary`, `btn-ghost`, `card`, `badge`, `badge-production|testing|soon`, `app-icon`, `grid`, `steps`, `facts`, `shots`, `faq`, `cta-band`, `hero`, `lead`, `actions`.

- [ ] **Step 1: Copiar el logo y generar tamaños**

El logo original está en la sesión de Char (`/private/tmp/claude-501/-Users-char-Documents-Projects/e78c412c-5dae-4b09-b1ef-d5480ac79c89/images/1.png`). Si el archivo ya no existe, pedírselo a Char de nuevo antes de seguir.

```bash
cd /Users/char/Documents/Projects/charDev/charDevMDP.github.io
mkdir -p docs/marca public/images
cp /private/tmp/claude-501/-Users-char-Documents-Projects/e78c412c-5dae-4b09-b1ef-d5480ac79c89/images/1.png docs/marca/logo-original.png
cp docs/marca/logo-original.png public/images/logo.png
sips -Z 128 docs/marca/logo-original.png --out public/images/logo-128.png
sips -Z 512 docs/marca/logo-original.png --out public/images/logo-512.png
sips --padToHeightWidth 1103 1103 --padColor 0C0C0C docs/marca/logo-original.png --out docs/marca/logo-square.png
sips -Z 32 docs/marca/logo-square.png --out public/favicon-32.png
sips -Z 180 docs/marca/logo-square.png --out public/apple-touch-icon.png
file public/images/logo-128.png public/images/logo-512.png public/favicon-32.png public/apple-touch-icon.png | sed 's/, 8-bit.*//'
```
Expected: `logo-128` de 128 × 100, `logo-512` de 512 × 402, `favicon-32` de 32 × 32, `apple-touch-icon` de 180 × 180. (Si Char pasa un SVG, se reemplazan estos archivos y se ajusta `width`/`height` en `Base.astro`.)

- [ ] **Step 2: Escribir los tokens**

`src/styles/tokens.css`:
```css
:root {
  /* Paleta medida sobre el logo */
  --bg: #0c0c0c;
  --bg-deep: #040404;
  --surface: #171b1f;
  --surface-2: #444c54;
  --border: #444c54;
  --text: #f2f4f6;
  --text-muted: #a9b0b8;
  --text-dim: #848484;
  --accent: #2cf4fc;
  --accent-hover: #7ff8fd;
  --on-accent: #0c0c0c;
  --focus: #2cf4fc;

  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Rajdhani', 'Inter', system-ui, sans-serif;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;

  --radius: 14px;
  --radius-sm: 8px;
}
```

- [ ] **Step 3: Escribir los estilos globales**

`src/styles/global.css`:
```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
html { color-scheme: dark; }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.6;
}
main { flex: 1; padding-block: var(--space-6) var(--space-7); }
h1, h2, h3 { font-family: var(--font-display); font-weight: 700; line-height: 1.15; margin: 0 0 var(--space-3); }
h1 { font-size: clamp(2.25rem, 6vw, 3.5rem); }
h2 { font-size: 1.75rem; margin-top: var(--space-6); }
h3 { font-size: 1.35rem; }
p { margin: 0 0 var(--space-4); }
a { color: var(--accent); }
img { max-width: 100%; height: auto; }
a:focus-visible, summary:focus-visible, .shots:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
  border-radius: 4px;
}

.container { width: min(100% - 2rem, 62rem); margin-inline: auto; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.skip {
  position: absolute; left: -999px; top: var(--space-3);
  background: var(--accent); color: var(--on-accent);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); z-index: 10;
}
.skip:focus { left: var(--space-3); }

/* Cabecera y pie */
.site-header { background: var(--bg-deep); border-bottom: 1px solid var(--border); }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; padding-block: var(--space-3); }
.brand { display: inline-flex; align-items: center; gap: var(--space-3); color: var(--text); text-decoration: none; font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; }
.brand img { width: 44px; height: auto; }
.nav-list { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-5); margin: 0; padding: 0; list-style: none; }
.nav-list a { display: inline-block; padding: var(--space-3) 0; color: var(--text-muted); text-decoration: none; font-weight: 600; }
.nav-list a:hover, .nav-list a[aria-current='page'] { color: var(--accent); }
.site-footer { background: var(--bg-deep); border-top: 1px solid var(--border); padding-block: var(--space-5); color: var(--text-dim); font-size: 0.95rem; }
.site-footer p { margin: 0; }

/* Botones */
.btn {
  display: inline-flex; align-items: center; min-height: 44px;
  padding: 0 var(--space-4); border-radius: var(--radius-sm);
  border: 2px solid var(--accent); font-weight: 600; text-decoration: none;
}
.btn-primary { background: var(--accent); color: var(--on-accent); }
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn-ghost { background: transparent; color: var(--accent); }
.btn-ghost:hover { background: var(--surface); }

/* Insignias de estado */
.badge {
  display: inline-block; padding: 2px var(--space-3); border-radius: 999px;
  font-size: 0.85rem; font-weight: 600; border: 1px solid var(--border);
}
.badge-production { color: var(--accent); border-color: var(--accent); }
.badge-testing { color: var(--text); background: var(--surface-2); }
.badge-soon { color: var(--text-muted); }

/* Portada */
.hero { text-align: center; padding-block: var(--space-5); }
.hero img { width: 220px; height: auto; margin-inline: auto; }
.lead { color: var(--text-muted); font-size: 1.15rem; }
.grid { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); margin: 0; padding: 0; list-style: none; }
.card { display: flex; flex-direction: column; gap: var(--space-2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-5); }
.card-head { display: flex; align-items: center; gap: var(--space-4); }
.card-title { margin: 0 0 var(--space-1); }
.card-title a { color: var(--text); text-decoration: none; }
.card-title a:hover { color: var(--accent); }
.card-text { color: var(--text-muted); margin: 0; }
.card-meta { margin: 0; font-size: 0.95rem; color: var(--text-muted); }
.card-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: auto; padding-top: var(--space-3); }
.app-icon { width: 64px; height: 64px; border-radius: 16px; flex: none; }
.app-icon-lg { width: 128px; height: 128px; border-radius: 28px; }
.cta-band { margin-top: var(--space-7); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-5); }

/* Página de app y de testers */
.back { margin-bottom: var(--space-5); }
.app-hero { display: flex; align-items: center; gap: var(--space-5); flex-wrap: wrap; margin-bottom: var(--space-5); }
.facts { display: grid; grid-template-columns: max-content 1fr; gap: var(--space-2) var(--space-5); margin: 0 0 var(--space-5); }
.facts dt { color: var(--text-muted); }
.facts dd { margin: 0; font-weight: 600; }
.actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: 0 0 var(--space-5); padding: 0; list-style: none; }
.steps { display: grid; gap: var(--space-4); padding-left: var(--space-5); }
.steps li p { margin-bottom: var(--space-2); }
.shots { overflow-x: auto; padding-bottom: var(--space-3); }
.shots ul { display: flex; gap: var(--space-4); margin: 0; padding: 0; list-style: none; width: max-content; }
.shots img { height: 360px; width: auto; max-width: none; border-radius: var(--radius-sm); border: 1px solid var(--border); }
.faq details { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-3); background: var(--surface); }
.faq summary { cursor: pointer; font-weight: 600; }
.faq details p { margin: var(--space-3) 0 0; color: var(--text-muted); }

@media (prefers-reduced-motion: no-preference) {
  .btn, .card-title a, .nav-list a { transition: background-color 0.15s, color 0.15s, border-color 0.15s; }
}
```

- [ ] **Step 4: Escribir el layout**

`src/layouts/Base.astro`:
```astro
---
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/rajdhani/700.css';
import '../styles/global.css';
import { CONTACT_EMAIL } from '../data/site';
import { htmlLang, localePath, otherLang, t } from '../lib/i18n';
import { LANGS, type Lang } from '../lib/langs';

interface Props {
  lang: Lang;
  title: string;
  description: string;
  path: string;
}

const { lang, title, description, path } = Astro.props;
const origin = Astro.site!.origin;
const canonical = `${origin}${localePath(lang, path)}`;
const other = otherLang(lang);
---
<!doctype html>
<html lang={htmlLang[lang]}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="theme-color" content="#0c0c0c" />
    <link rel="canonical" href={canonical} />
    {LANGS.map((l) => <link rel="alternate" hreflang={htmlLang[l]} href={`${origin}${localePath(l, path)}`} />)}
    <link rel="alternate" hreflang="x-default" href={`${origin}${localePath('es', path)}`} />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={`${origin}/images/logo.png`} />
    <meta property="og:locale" content={htmlLang[lang].replace('-', '_')} />
  </head>
  <body>
    <a class="skip" href="#main">{t(lang, 'a11y.skip')}</a>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href={localePath(lang, '/')}>
          <img src="/images/logo-128.png" alt="" width="128" height="100" />
          <span>charDev</span>
        </a>
        <nav aria-label={t(lang, 'nav.label')}>
          <ul class="nav-list">
            <li><a href={localePath(lang, '/')} aria-current={path === '/' ? 'page' : undefined}>{t(lang, 'nav.apps')}</a></li>
            <li><a href={localePath(lang, '/tester/')} aria-current={path === '/tester/' ? 'page' : undefined}>{t(lang, 'nav.tester')}</a></li>
            <li>
              <a
                href={localePath(other, path)}
                lang={htmlLang[other]}
                hreflang={htmlLang[other]}
                aria-label={t(lang, 'nav.otherLanguageLabel')}
              >{t(lang, 'nav.otherLanguage')}</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
    <main id="main"><slot /></main>
    <footer class="site-footer">
      <div class="container">
        <p>{t(lang, 'footer.contact')}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 5: Probar el layout con una página provisoria**

Reemplazar `src/pages/index.astro` por (provisoria; la reemplaza la Task 6):
```astro
---
import Base from '../layouts/Base.astro';
---
<Base lang="es" path="/" title="charDev · Apps" description="Prueba del layout">
  <div class="container"><h1>charDev</h1></div>
</Base>
```
Run:
```bash
npm run build
grep -o 'hreflang="[^"]*"' dist/index.html | sort -u
grep -c 'style="' dist/index.html
ls dist/_astro | head
```
Expected: build OK; hreflang `es-AR`, `en` y `x-default`; **0** coincidencias de `style="`; fuentes y CSS en `dist/_astro/`.

- [ ] **Step 6: Commit**

```bash
git add docs public src
git commit -m "feat(sitio): marca, tokens de diseño y layout base con hreflang" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Componentes, vistas y rutas

**Files:**
- Create: `src/components/StatusBadge.astro`, `AppCard.astro`, `TesterSteps.astro`, `Screenshots.astro`; `src/views/HomePage.astro`, `AppPage.astro`, `TesterPage.astro`; `src/pages/en/index.astro`, `src/pages/tester/index.astro`, `src/pages/en/tester/index.astro`, `src/pages/[app]/index.astro`, `src/pages/en/[app]/index.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Base` (Task 5), `apps` (Task 4), `primaryAction`/`hasTesting`/`App`/`Status` (Task 2), `t`/`localePath` (Task 3), `CONTACT_EMAIL`.
- Produces: rutas `/`, `/en/`, `/tester/`, `/en/tester/`, `/<id>/`, `/en/<id>/` para cada app.

- [ ] **Step 1: Escribir los componentes**

`src/components/StatusBadge.astro`:
```astro
---
import { t } from '../lib/i18n';
import type { Status } from '../lib/apps';
import type { Lang } from '../lib/langs';

interface Props { lang: Lang; status: Status }
const { lang, status } = Astro.props;
---
<span class={`badge badge-${status}`}>{t(lang, `status.${status}`)}</span>
```

`src/components/AppCard.astro`:
```astro
---
import StatusBadge from './StatusBadge.astro';
import { localePath, t } from '../lib/i18n';
import { primaryAction, type App } from '../lib/apps';
import type { Lang } from '../lib/langs';

interface Props { app: App; lang: Lang }
const { app, lang } = Astro.props;
const action = primaryAction(app);
const detailsHref = localePath(lang, `/${app.id}/`);
---
<li class="card">
  <div class="card-head">
    <img class="app-icon" src={app.icon} alt="" width="64" height="64" loading="lazy" />
    <div>
      <h3 class="card-title"><a href={detailsHref}>{app.name}</a></h3>
      <StatusBadge lang={lang} status={app.status} />
    </div>
  </div>
  <p class="card-text">{t(lang, `apps.${app.id}.tagline`)}</p>
  {app.versionProduction && (
    <p class="card-meta">{t(lang, 'app.versionProduction')}: <strong>{app.versionProduction}</strong></p>
  )}
  <div class="card-actions">
    {action === 'play' && app.playUrl && (
      <a class="btn btn-primary" href={app.playUrl} target="_blank" rel="noopener">
        {t(lang, 'app.play')}<span class="sr-only"> {t(lang, 'a11y.newTab')}</span>
      </a>
    )}
    {action === 'tester' && (
      <a class="btn btn-primary" href={`${detailsHref}#tester`}>{t(lang, 'app.beTester')}</a>
    )}
    <a class="btn btn-ghost" href={detailsHref}>
      {t(lang, 'app.details')}<span class="sr-only"> — {app.name}</span>
    </a>
  </div>
</li>
```

`src/components/TesterSteps.astro`:
```astro
---
import { t } from '../lib/i18n';
import type { Lang } from '../lib/langs';

interface Props {
  lang: Lang;
  kind: 'join' | 'leave';
  groupUrl?: string | null;
  optInUrl?: string | null;
}
const { lang, kind, groupUrl = null, optInUrl = null } = Astro.props;

const steps =
  kind === 'join'
    ? [
        { text: t(lang, 'tester.join.step1'), href: groupUrl, cta: t(lang, 'tester.join.cta1') },
        { text: t(lang, 'tester.join.step2'), href: optInUrl, cta: t(lang, 'tester.join.cta2') },
        { text: t(lang, 'tester.join.step3'), href: null, cta: '' },
      ]
    : [
        { text: t(lang, 'tester.leave.step1'), href: optInUrl, cta: t(lang, 'tester.leave.cta1') },
        { text: t(lang, 'tester.leave.step2'), href: null, cta: '' },
        { text: t(lang, 'tester.leave.step3'), href: groupUrl, cta: t(lang, 'tester.leave.cta3') },
      ];
---
<ol class="steps">
  {steps.map((s) => (
    <li>
      <p>{s.text}</p>
      {s.href && (
        <a class="btn btn-ghost" href={s.href} target="_blank" rel="noopener">
          {s.cta}<span class="sr-only"> {t(lang, 'a11y.newTab')}</span>
        </a>
      )}
    </li>
  ))}
</ol>
```

`src/components/Screenshots.astro`:
```astro
---
import { t } from '../lib/i18n';
import type { App } from '../lib/apps';
import type { Lang } from '../lib/langs';

interface Props { app: App; lang: Lang }
const { app, lang } = Astro.props;
const shots = app.screenshots[lang];
const { width, height } = app.screenshotSize;
---
{shots.length > 0 && (
  <section aria-labelledby="shots-heading">
    <h2 id="shots-heading">{t(lang, 'app.screenshots')}</h2>
    <div class="shots" tabindex="0" role="group" aria-labelledby="shots-heading">
      <ul>
        {shots.map((src, i) => (
          <li>
            <img
              src={src}
              alt={t(lang, 'app.screenshotAlt', { n: i + 1, name: app.name })}
              width={width}
              height={height}
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </div>
  </section>
)}
```

- [ ] **Step 2: Escribir las vistas**

`src/views/HomePage.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import AppCard from '../components/AppCard.astro';
import { apps } from '../data/apps';
import { localePath, t } from '../lib/i18n';
import type { Lang } from '../lib/langs';

interface Props { lang: Lang }
const { lang } = Astro.props;
---
<Base lang={lang} path="/" title={t(lang, 'meta.homeTitle')} description={t(lang, 'meta.homeDescription')}>
  <section class="container hero">
    <img src="/images/logo-512.png" alt="" width="512" height="402" />
    <h1>charDev</h1>
    <p class="lead">{t(lang, 'home.lead')}</p>
  </section>
  <section class="container" aria-labelledby="apps-heading">
    <h2 id="apps-heading">{t(lang, 'home.appsHeading')}</h2>
    <ul class="grid">
      {apps.map((app) => <AppCard app={app} lang={lang} />)}
    </ul>
  </section>
  <section class="container cta-band" aria-labelledby="tester-heading">
    <h2 id="tester-heading">{t(lang, 'home.testerHeading')}</h2>
    <p>{t(lang, 'home.testerBody')}</p>
    <a class="btn btn-primary" href={localePath(lang, '/tester/')}>{t(lang, 'home.testerCta')}</a>
  </section>
</Base>
```

`src/views/AppPage.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Screenshots from '../components/Screenshots.astro';
import StatusBadge from '../components/StatusBadge.astro';
import TesterSteps from '../components/TesterSteps.astro';
import { hasTesting, primaryAction, type App } from '../lib/apps';
import { localePath, t } from '../lib/i18n';
import type { Lang } from '../lib/langs';

interface Props { lang: Lang; app: App }
const { lang, app } = Astro.props;
const action = primaryAction(app);
const testingOpen = hasTesting(app);
---
<Base
  lang={lang}
  path={`/${app.id}/`}
  title={`${app.name} · charDev`}
  description={t(lang, `apps.${app.id}.tagline`)}
>
  <article class="container">
    <p class="back"><a href={localePath(lang, '/')}>← {t(lang, 'app.back')}</a></p>

    <header class="app-hero">
      <img
        class="app-icon app-icon-lg"
        src={app.icon}
        alt={t(lang, 'app.iconAlt', { name: app.name })}
        width="128"
        height="128"
      />
      <div>
        <h1>{app.name}</h1>
        <StatusBadge lang={lang} status={app.status} />
        <p class="lead">{t(lang, `apps.${app.id}.tagline`)}</p>
      </div>
    </header>

    <p>{t(lang, `apps.${app.id}.description`)}</p>

    {app.status === 'soon' && <p>{t(lang, 'app.notYet')}</p>}

    {(app.versionProduction || app.versionTesting) && (
      <dl class="facts">
        {app.versionProduction && (<><dt>{t(lang, 'app.versionProduction')}</dt><dd>{app.versionProduction}</dd></>)}
        {app.versionTesting && (<><dt>{t(lang, 'app.versionTesting')}</dt><dd>{app.versionTesting}</dd></>)}
      </dl>
    )}

    <div class="actions">
      {action === 'play' && app.playUrl && (
        <a class="btn btn-primary" href={app.playUrl} target="_blank" rel="noopener">
          {t(lang, 'app.play')}<span class="sr-only"> {t(lang, 'a11y.newTab')}</span>
        </a>
      )}
      {testingOpen && <a class="btn btn-ghost" href="#tester">{t(lang, 'app.beTester')}</a>}
    </div>

    <Screenshots app={app} lang={lang} />

    {testingOpen && (
      <section id="tester" aria-labelledby="tester-heading">
        <h2 id="tester-heading">{t(lang, 'app.testerHeading')}</h2>
        <p>{t(lang, 'app.testerIntro', { name: app.name })}</p>
        <TesterSteps lang={lang} kind="join" groupUrl={app.groupUrl} optInUrl={app.optInUrl} />
        <h2>{t(lang, 'app.leaveHeading')}</h2>
        <TesterSteps lang={lang} kind="leave" groupUrl={app.groupUrl} optInUrl={app.optInUrl} />
        <p>{t(lang, 'tester.groupNote')}</p>
      </section>
    )}

    {app.privacyUrl && (
      <p><a href={app.privacyUrl}>{t(lang, 'app.privacy')}</a></p>
    )}
  </article>
</Base>
```

`src/views/TesterPage.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import TesterSteps from '../components/TesterSteps.astro';
import { apps } from '../data/apps';
import { CONTACT_EMAIL } from '../data/site';
import { hasTesting } from '../lib/apps';
import { localePath, t } from '../lib/i18n';
import type { Lang } from '../lib/langs';

interface Props { lang: Lang }
const { lang } = Astro.props;
const testingApps = apps.filter(hasTesting);
const faq = ['1', '2', '3'] as const;
---
<Base lang={lang} path="/tester/" title={t(lang, 'meta.testerTitle')} description={t(lang, 'meta.testerDescription')}>
  <div class="container">
    <h1>{t(lang, 'tester.heading')}</h1>
    <p class="lead">{t(lang, 'tester.intro')}</p>

    <h2>{t(lang, 'tester.appsHeading')}</h2>
    {testingApps.length === 0 ? (
      <p>{t(lang, 'tester.noneTesting')}</p>
    ) : (
      <ul class="actions">
        {testingApps.map((app) => (
          <li><a class="btn btn-primary" href={`${localePath(lang, `/${app.id}/`)}#tester`}>{app.name}</a></li>
        ))}
      </ul>
    )}

    <h2>{t(lang, 'tester.joinHeading')}</h2>
    <TesterSteps lang={lang} kind="join" />

    <h2>{t(lang, 'tester.leaveHeading')}</h2>
    <TesterSteps lang={lang} kind="leave" />
    <p>{t(lang, 'tester.groupNote')}</p>

    <section class="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">{t(lang, 'tester.faqHeading')}</h2>
      {faq.map((n) => (
        <details>
          <summary>{t(lang, `tester.faq.q${n}`)}</summary>
          <p>{t(lang, `tester.faq.a${n}`, { email: CONTACT_EMAIL })}</p>
        </details>
      ))}
    </section>
  </div>
</Base>
```
(`t()` ignora las variables que sobran, así que pasar `email` a las tres respuestas es seguro.)

- [ ] **Step 3: Escribir las rutas**

`src/pages/index.astro` (reemplaza la provisoria):
```astro
---
import HomePage from '../views/HomePage.astro';
---
<HomePage lang="es" />
```
`src/pages/en/index.astro`:
```astro
---
import HomePage from '../../views/HomePage.astro';
---
<HomePage lang="en" />
```
`src/pages/tester/index.astro`:
```astro
---
import TesterPage from '../../views/TesterPage.astro';
---
<TesterPage lang="es" />
```
`src/pages/en/tester/index.astro`:
```astro
---
import TesterPage from '../../../views/TesterPage.astro';
---
<TesterPage lang="en" />
```
`src/pages/[app]/index.astro`:
```astro
---
import AppPage from '../../views/AppPage.astro';
import { apps } from '../../data/apps';

export function getStaticPaths() {
  return apps.map((app) => ({ params: { app: app.id }, props: { app } }));
}
const { app } = Astro.props;
---
<AppPage lang="es" app={app} />
```
`src/pages/en/[app]/index.astro`:
```astro
---
import AppPage from '../../../views/AppPage.astro';
import { apps } from '../../../data/apps';

export function getStaticPaths() {
  return apps.map((app) => ({ params: { app: app.id }, props: { app } }));
}
const { app } = Astro.props;
---
<AppPage lang="en" app={app} />
```

- [ ] **Step 4: Compilar y comprobar las rutas**

```bash
npm run build
find dist -name index.html | sort
grep -rl 'style="' dist --include=*.html || echo "sin style en línea"
```
Expected: `dist/index.html`, `dist/en/index.html`, `dist/tester/index.html`, `dist/en/tester/index.html` y `dist/{suguruneon,geli,reinaneon}/index.html` más sus versiones en `dist/en/…` (10 en total); `sin style en línea`.

- [ ] **Step 5: Mirar el resultado en un navegador**

```bash
npm run preview -- --port 4321
```
Abrir `http://localhost:4321/`, `/suguruneon/`, `/geli/`, `/tester/` y `/en/` en el navegador del panel, a 375 px y a escritorio. Revisar: logo, insignias, tarjetas, botón de Google Play de SuguruNeon, captura horizontal navegable con el teclado, selector de idioma. Anotar lo que se vea mal y corregir en `global.css` antes del commit. Frenar el servidor al terminar.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(sitio): portada, páginas de app y de testers en español e inglés" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: SEO, verificaciones de build y falla provocada

**Files:**
- Create: `src/lib/sitemap.ts`, `src/pages/sitemap.xml.ts`, `public/robots.txt`, `scripts/check-dist.mjs`, `scripts/check-links.mjs`
- Test: `tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `LANGS`, `htmlLang`, `localePath`, `apps`.
- Produces: `sitePaths(apps: { id: string }[]): string[]`, `buildSitemap(origin: string, paths: string[]): string`; `npm run check:dist` y `npm run check:links`.

- [ ] **Step 1: Escribir el test del sitemap (falla)**

`tests/sitemap.test.ts`:
```ts
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
```
Run: `npx vitest run tests/sitemap.test.ts`. Expected: FAIL (módulo inexistente).

- [ ] **Step 2: Implementar el sitemap, el endpoint y robots**

`src/lib/sitemap.ts`:
```ts
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
```

`src/pages/sitemap.xml.ts`:
```ts
import type { APIRoute } from 'astro';
import { apps } from '../data/apps';
import { buildSitemap, sitePaths } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) =>
  new Response(buildSitemap(site!.origin, sitePaths(apps)), {
    headers: { 'Content-Type': 'application/xml' },
  });
```

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://chardevmdp.github.io/sitemap.xml
```

Run: `npx vitest run`. Expected: PASS (todos).

- [ ] **Step 3: Escribir `check-dist.mjs`**

`scripts/check-dist.mjs`:
```js
// Verifica el resultado de `npm run build` antes de publicar.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const EXPECTED_APP_ADS = 'google.com, pub-6526918428646723, DIRECT, f08c47fec0942fa0\n';
const SHADOWED = ['suguruneon-legal', 'geli-legal']; // viven en repos aparte: el build no puede crearlas
const problems = [];
const fail = (msg) => problems.push(msg);

if (!existsSync(DIST)) {
  console.error('No existe dist/: corré `npm run build` primero.');
  process.exit(1);
}

const apps = JSON.parse(readFileSync('src/data/apps.json', 'utf8'));
const pages = ['', 'tester/', ...apps.map((a) => `${a.id}/`)].flatMap((p) => [p, `en/${p}`]);

// 1. app-ads.txt idéntico y archivos esperados presentes
if (!existsSync(join(DIST, 'app-ads.txt')) || readFileSync(join(DIST, 'app-ads.txt'), 'utf8') !== EXPECTED_APP_ADS) {
  fail('app-ads.txt falta o cambió');
}
for (const f of ['sitemap.xml', 'robots.txt', 'favicon-32.png', 'apple-touch-icon.png']) {
  if (!existsSync(join(DIST, f))) fail(`falta dist/${f}`);
}
for (const p of pages) {
  if (!existsSync(join(DIST, p, 'index.html'))) fail(`falta la página /${p}`);
}

// 2. No pisar las políticas de privacidad
for (const dir of SHADOWED) {
  if (existsSync(join(DIST, dir))) fail(`el build crea /${dir}/ y pisaría el repo de la política`);
}

// 3. Cada página: lang, hreflang, una sola h1, sin style en línea, CSP, activos locales existentes
const exists = (urlPath) => {
  const target = join(DIST, urlPath);
  return existsSync(target) && (!statSync(target).isDirectory() || existsSync(join(target, 'index.html')));
};
for (const p of pages) {
  const file = join(DIST, p, 'index.html');
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const lang = p.startsWith('en/') ? 'en' : 'es-AR';
  if (!html.includes(`<html lang="${lang}"`)) fail(`/${p}: lang incorrecto (esperado ${lang})`);
  for (const h of ['es-AR', 'en', 'x-default']) {
    if (!html.includes(`hreflang="${h}"`)) fail(`/${p}: falta hreflang ${h}`);
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`/${p}: debe tener exactamente una h1`);
  if (/\sstyle="/.test(html)) fail(`/${p}: tiene style en línea (la CSP lo bloquea)`);
  if (!/http-equiv="content-security-policy"/i.test(html)) fail(`/${p}: falta la CSP`);
  for (const m of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
    if (!exists(m[1])) fail(`/${p}: enlace local roto ${m[1]}`);
  }
}

if (problems.length > 0) {
  console.error(`check-dist: ${problems.length} problema(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`check-dist: OK (${pages.length} páginas)`);
```

- [ ] **Step 4: Escribir `check-links.mjs`**

`scripts/check-links.mjs`:
```js
// Comprueba que respondan los enlaces externos de apps.json. Necesita red; no corre en CI.
import { readFileSync } from 'node:fs';

const apps = JSON.parse(readFileSync('src/data/apps.json', 'utf8'));
let broken = 0;

for (const app of apps) {
  for (const key of ['playUrl', 'optInUrl', 'groupUrl', 'privacyUrl']) {
    const url = app[key];
    if (!url) continue;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const bad = res.status === 404 || res.status >= 500;
      if (bad) broken++;
      console.log(`${bad ? 'ROTO' : 'ok  '} ${res.status} ${app.id}.${key} ${url}`);
    } catch (e) {
      broken++;
      console.log(`ROTO --- ${app.id}.${key} ${url} (${e.message})`);
    }
  }
}
// Google Groups y los enlaces de prueba pueden mandar a un login (200/302): eso no cuenta como roto.
process.exit(broken > 0 ? 1 : 0);
```

- [ ] **Step 5: Correr las verificaciones**

```bash
npm run build && npm run check:dist
npm run check:links
```
Expected: `check-dist: OK (10 páginas)`; `check:links` muestra `ok 200` para la política de SuguruNeon, la de GeLi y el enlace de Google Play de SuguruNeon.

- [ ] **Step 6: Provocar las fallas que el build tiene que cortar**

Cada una se prueba y se revierte:
```bash
# a) producción sin versión
sed -i '' 's/"versionProduction": "1.0.2"/"versionProduction": null/' src/data/apps.json
npm run build; echo "exit=$?"; git checkout src/data/apps.json

# b) clave de texto que falta en inglés
node -e "const fs=require('fs');const f='src/i18n/en.json';const j=JSON.parse(fs.readFileSync(f));delete j.footer.contact;fs.writeFileSync(f,JSON.stringify(j,null,2))"
npm run build; echo "exit=$?"; git checkout src/i18n/en.json

# c) una política pisada
mkdir -p public/suguruneon-legal && touch public/suguruneon-legal/index.html
npm run build && npm run check:dist; echo "exit=$?"; rm -r public/suguruneon-legal
```
Expected: (a) `exit=1` con `en producción falta versionProduction`; (b) `exit=1` con `falta en en.json: footer.contact`; (c) `exit=1` con `el build crea /suguruneon-legal/`. Si alguna **no** corta, corregir el código antes de seguir. Al final, `git status` debe mostrar solo los archivos nuevos de esta tarea.

(Nota: `git checkout src/data/apps.json` solo funciona si `apps.json` ya está commiteado, cosa que ocurre en la Task 4. Lo mismo para `en.json`.)

- [ ] **Step 7: Commit**

```bash
git add scripts src tests public
git commit -m "feat(sitio): sitemap, robots y verificaciones de build y de enlaces" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CI/deploy y documentación

**Files:**
- Create: `.github/workflows/site.yml`, `docs/sistema-diseno-web.md`, `docs/memoria.html`
- Modify: `README.md`, `../_estandares/mobile/publicar-android.md` (repo hermano: solo se agrega una sección)

**Interfaces:**
- Consumes: scripts `test`, `build`, `check:dist`.
- Produces: workflow que corre tests y build en PR y push, y despliega solo en `main`.

- [ ] **Step 1: Escribir el workflow**

`.github/workflows/site.yml`:
```yaml
name: Sitio

on:
  push:
    branches: [main]
  pull_request:
    branches: [develop, main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run check:dist
      - uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Documentar el sistema de diseño**

`docs/sistema-diseno-web.md`: escribir con estas secciones, tomando los valores reales de `src/styles/tokens.css`:
1. **Colores**: tabla con cada token (`--bg`, `--bg-deep`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--accent`, `--on-accent`), su hex y para qué se usa. Aclarar cuáles vienen del logo (acento, pizarra, gris, fondo, fondo profundo) y cuáles se derivaron (`--surface`, `--text-muted`, `--accent-hover`).
2. **Contraste**: calcular con la fórmula WCAG el ratio de cada par usado (`--text` sobre `--bg` y `--surface`, `--text-muted` sobre `--surface`, `--accent` sobre `--bg` y `--surface`, `--on-accent` sobre `--accent`, `--text-dim` sobre `--bg-deep`) y escribir los números **medidos**; todo texto tiene que llegar a 4,5:1.
3. **Tipografía**: Rajdhani 700 para títulos, Inter 400/600 para texto, servidas con `@fontsource`.
4. **Espaciado, radios y breakpoints**: los tokens `--space-*`, `--radius*`; el único breakpoint es el ancho de la grilla (`minmax(18rem, 1fr)`).
5. **Componentes**: `StatusBadge`, `AppCard`, `TesterSteps`, `Screenshots`, botones `.btn-primary`/`.btn-ghost` (un solo botón primario por bloque).
6. **Notas para Claude**: tema único oscuro; nada de `style=""` ni scripts en línea (CSP); textos siempre por `t()`, en ambos idiomas; los datos de apps solo en `apps.json`; sumar un idioma = agregar `xx.json`, `LANGS` y rutas.

- [ ] **Step 3: Escribir el log de decisiones**

`docs/memoria.html`:
```html
<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>charDev · Sitio — decisiones</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 52rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: .5rem; text-align: left; vertical-align: top; }
  .sw { display: inline-block; width: 1.2rem; height: 1.2rem; border: 1px solid #888; vertical-align: middle; margin-right: .4rem; }
</style>
</head>
<body>
<h1>Sitio charDev — log de decisiones</h1>
<p>✅ cerrada · ❓ abierta</p>
<table>
  <tr><th>#</th><th>Decisión</th><th>Estado</th></tr>
  <tr><td>D1</td><td>Alta de testers: Google Group abierto + enlace de prueba de Play. El sitio no recolecta mails.</td><td>✅ 2026-10-27</td></tr>
  <tr><td>D2</td><td>Se muestran todas las apps con estado (en producción, en testing, próximamente).</td><td>✅ 2026-10-27</td></tr>
  <tr><td>D3</td><td>Español en <code>/</code> e inglés en <code>/en/</code>.</td><td>✅ 2026-10-27</td></tr>
  <tr><td>D4</td><td>Astro estático con <code>apps.json</code> como fuente de datos; deploy con GitHub Actions desde <code>main</code>.</td><td>✅ 2026-10-27</td></tr>
  <tr><td>D5</td><td>Tema oscuro único con la paleta del logo
    <span class="sw" style="background:#2cf4fc"></span>#2CF4FC
    <span class="sw" style="background:#444c54"></span>#444C54
    <span class="sw" style="background:#848484"></span>#848484
    <span class="sw" style="background:#0c0c0c"></span>#0C0C0C
    <span class="sw" style="background:#040404"></span>#040404</td><td>✅ 2026-10-27</td></tr>
  <tr><td>D6</td><td>Un solo Google Group (<code>chardev-testers</code>) para todas las apps.</td><td>✅ 2026-10-28</td></tr>
  <tr><td>D7</td><td>Apps iniciales: SuguruNeon (producción), GeLi y ReinaNeon (próximamente). AquiMascotas y Sombra quedan fuera hasta tener material.</td><td>❓ Char confirma antes del merge a main</td></tr>
  <tr><td>D8</td><td>Textos del camino de testers (unirse y salir) a verificar con la cuenta de Char.</td><td>❓ pendiente</td></tr>
</table>
</body>
</html>
```
(Este archivo no se publica en el sitio: está en `docs/`, no en `public/`, así que el `style` en línea no afecta la CSP.)

- [ ] **Step 4: Reescribir el README**

`README.md` (reemplaza el actual):
```markdown
# charDev — sitio

Hub de apps: https://chardevmdp.github.io/ (español) y https://chardevmdp.github.io/en/ (inglés).
Astro estático, CSS con tokens, tema oscuro con la paleta del logo.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en http://localhost:4321 |
| `npm test` | Tests de la lógica (vitest) |
| `npm run build` | Compila a `dist/` (falla si faltan datos o textos) |
| `npm run check:dist` | Verifica `dist/`: páginas, hreflang, `app-ads.txt`, políticas sin pisar |
| `npm run check:links` | Comprueba que respondan los enlaces externos de `apps.json` (necesita red) |

## Sumar o actualizar una app

1. Copiar el ícono y las capturas a `public/images/apps/<id>/` (`icon.png`, `es/1.png…`, `en/1.png…`).
2. Agregar la entrada en `src/data/apps.json` (estado, versiones, enlaces).
3. Agregar `apps.<id>.tagline` y `apps.<id>.description` en `src/i18n/es.json` **y** `en.json`.
4. `npm test && npm run build && npm run check:dist`.

Al publicar una versión en Play: actualizar `versionProduction` o `versionTesting` (y `status` si cambia) y mergear a `main`.

## Ramas y deploy

Se trabaja en `feat/…` / `docs/…` → PR a `develop` → `develop` a `main`. El deploy corre solo en `main`
(`.github/workflows/site.yml`). Pages usa la fuente **GitHub Actions**.

## Lo que no se toca desde acá

- `public/app-ads.txt`: lo lee AdMob; el ID de editor es de la cuenta y sirve para todas las apps.
- Las políticas de privacidad viven en repos propios (`geli-legal`, `suguruneon-legal`, …) bajo este mismo dominio.
  Sus URLs están registradas en Play y AdMob: no se mueven, y `check:dist` falla si el build las pisa.

## Más

Spec y plan en `docs/superpowers/`. Sistema de diseño en `docs/sistema-diseno-web.md`. Decisiones en `docs/memoria.html`.
```

- [ ] **Step 5: Sumar el paso a la guía de publicar en Play**

Leer el final de `../_estandares/mobile/publicar-android.md` y agregar al cierre una sección:
```markdown
## Después de publicar: actualizar el sitio

Cada vez que una versión llega a producción o a una prueba abierta, actualizar el sitio de charDev
(`charDevMDP.github.io`): en `src/data/apps.json` cambiar `versionProduction` o `versionTesting` y, si cambió,
`status`; mergear a `main` (ver el README de ese repo).
```
Si esa guía no existe con ese nombre, buscar la de publicación en `../_estandares/mobile/` y usar esa. Este cambio es del repo `_estandares` (no del sitio): se commitea por separado si ese repo es git; si no, queda como cambio de archivo para que Char lo vea.

- [ ] **Step 6: Verificar y commitear**

```bash
npm test && npm run build && npm run check:dist
git add .github docs README.md
git commit -m "chore(sitio): workflow de CI y deploy, README y documentación del sistema de diseño" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: todo en verde.

---

### Task 9: Verificación final, revisión y salida a producción

**Files:**
- Create: `docs/auditoria-accesibilidad-seguridad.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: PR a `develop`, merge `develop → main`, sitio publicado.

- [ ] **Step 1: Auditoría con Lighthouse**

Servir el build (`npm run build && npm run preview -- --port 4321`) y auditar con el MCP de chrome-devtools (`lighthouse_audit`) o con `npx lighthouse`, en móvil y escritorio, estas páginas: `/`, `/en/`, `/suguruneon/`, `/tester/`. Categorías: accesibilidad, SEO, mejores prácticas. Objetivo: accesibilidad ≥ 95 y SEO ≥ 95; cualquier hallazgo de contraste o de región con scroll sin foco se corrige antes de seguir.

- [ ] **Step 2: Revisión visual**

En el navegador del panel, con tamaño `mobile` (375) y `desktop`, mirar las 4 páginas anteriores más `/geli/` y `/en/reinaneon/`: sin scroll horizontal de la página (las capturas scrollean dentro de su carrusel), botones de al menos 44 px, selector de idioma visible, navegación completa con el teclado (Tab recorre saltar-al-contenido → cabecera → contenido → pie; foco siempre visible).

- [ ] **Step 3: Escribir la auditoría**

`docs/auditoria-accesibilidad-seguridad.md`, con estas secciones y los resultados **medidos** en los pasos anteriores (modelo: la auditoría de ICBR): (1) puntajes de Lighthouse por página y dispositivo; (2) revisión de teclado y lector de pantalla (qué se probó y qué no); (3) CSP: la política generada por Astro y la limitación de GitHub Pages (sin cabeceras `frame-ancestors`, `X-Content-Type-Options`, HSTS propias); (4) hallazgos corregidos y los que quedan abiertos, con motivo.

- [ ] **Step 4: Revisión de código con los agentes de ECC**

Revisar el diff completo de `feat/sitio-astro` contra `develop` con `ecc:typescript-reviewer`, `ecc:a11y-architect` y `ecc:security-reviewer` (los demás agentes de la lista de CLAUDE.md no aplican: no hay React ni flujos asíncronos). Juntar los hallazgos y hacer **una sola ronda** de arreglos; volver a correr `npm test && npm run build && npm run check:dist`.

- [ ] **Step 5: Abrir el PR a `develop`**

```bash
git push -u origin feat/sitio-astro
gh pr create --base develop --head feat/sitio-astro --title "feat(sitio): hub charDev con Astro, bilingüe, con estado de apps y testers" --body "Implementa la spec docs/superpowers/specs/2026-10-27-sitio-chardev-design.md.

- Portada, páginas por app y página de testers en español e inglés
- Datos en apps.json; el build falla si faltan datos o textos
- CI en PR y deploy solo desde main

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh pr checks --watch
```
Expected: el check `build` pasa. Mergear a `develop` y borrar la rama: `gh pr merge --merge --delete-branch`.

- [ ] **Step 6: Gate: confirmaciones de Char antes de publicar**

**Parar y pedirle a Char**, con una sola pregunta numerada, que confirme:
1. Los estados y versiones iniciales de `apps.json` (SuguruNeon en producción con 1.0.2; GeLi y ReinaNeon como "Próximamente"; AquiMascotas y Sombra fuera).
2. Los textos de descripción de las tres apps (`apps.*` en `es.json` y `en.json`).
3. Que probó el camino de tester con su cuenta (paso 4 de la spec) o que acepta publicar `/tester/` con los textos actuales y corregirlos después; en ese caso, la decisión D8 de `docs/memoria.html` queda abierta.
4. Si ya tiene el Google Group y el enlace de prueba de alguna app, pasarlos: se cargan en `apps.json` (`groupUrl`, `optInUrl`, `versionTesting`, `status: "testing"`) antes del merge.

No seguir hasta tener la respuesta.

- [ ] **Step 7: Publicar**

Con las confirmaciones aplicadas en `develop` (en una rama `fix/…` o `feat/…` por PR si hubo cambios):
```bash
git checkout develop && git pull
npm ci && npm test && npm run build && npm run check:dist
git checkout main && git pull
git merge --no-ff develop -m "Merge develop: hub charDev con Astro"
git push origin main
gh run watch
```
Expected: el workflow `Sitio` termina con `build` y `deploy` en verde.

- [ ] **Step 8: Comprobar el sitio publicado**

```bash
for u in / /en/ /tester/ /en/tester/ /suguruneon/ /en/suguruneon/ /geli/ /reinaneon/ /sitemap.xml /robots.txt /app-ads.txt /suguruneon-legal/ /geli-legal/; do
  printf '%s ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' "https://chardevmdp.github.io$u"
done
curl -s https://chardevmdp.github.io/app-ads.txt
```
Expected: todos `200` y `app-ads.txt` con `google.com, pub-6526918428646723, DIRECT, f08c47fec0942fa0`. Si una política (`/suguruneon-legal/` o `/geli-legal/`) da 404, revertir el merge de inmediato (`git revert -m 1 <merge>` y push) y avisar a Char.

- [ ] **Step 9: Cerrar**

Actualizar `docs/memoria.html` (D7 y D8 según lo que respondió Char), la memoria de estado del proyecto de Claude (etapa, rama, último commit, próximo paso, pendientes de Char: Google Groups, logo en SVG, capturas de AquiMascotas y Sombra) y avisarle a Char que el sitio está publicado, con las URLs.

---

## Self-Review

**Cobertura de la spec**
- Páginas (portada, app, testers) → Task 6. Estados y versiones → Tasks 2, 4, 6. Flujo de unirse y salir → texto en Task 3, render en Task 6. Datos `apps.json` → Tasks 2 y 4. Textos por idioma → Task 3.
- `app-ads.txt` y políticas sin pisar → Tasks 1 y 7 (`check-dist`, con la falla provocada). Deploy con Actions → Task 8; flujo de ramas y `develop` → Task 1.
- El build falla ante datos o claves faltantes → Tasks 2, 3 y 7 (se provoca cada falla). Pruebas previas a publicar: build y paridad (Task 7), enlaces (Task 7), Lighthouse y revisión visual (Task 9), hreflang y sitemap (Tasks 5 y 7).
- Convenciones web: tokens y sistema de diseño (Tasks 5 y 8), fuentes locales (Task 5), CSP (Tasks 1 y 7), accesibilidad (Tasks 5, 6 y 9), auditoría documentada (Task 9).
- Pendientes de la spec: logo SVG (Task 5, con PNG de respaldo), capturas (Task 4, con lo que existe), Google Groups y Pages (gate de Task 9; Pages ya está activado).

**Tipos consistentes:** `App`, `Status`, `Action`, `Lang` y los nombres `validateApps`, `primaryAction`, `hasTesting`, `t`, `localePath`, `otherLang`, `htmlLang`, `buildSitemap`, `sitePaths` son los mismos en todas las tareas.

**Puntos a vigilar al ejecutar**
- La Task 4 asume `screenshotSize` 1080 × 2400 para ReinaNeon; el Step 1 lo verifica con `file`.
- Los textos «Convertirme en tester» y «Salir del programa» reflejan lo que Play suele mostrar, pero no están verificados: son el motivo del gate (Task 9, Step 6).
- Los tamaños de ancho de las capturas (360 px de alto) y los valores de contraste se ajustan mirando el resultado en la Task 6 (Step 5) y la Task 9.
