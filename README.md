# charDev — sitio

Hub de apps: https://chardevmdp.github.io/ (español) y https://chardevmdp.github.io/en/ (inglés).
Astro estático, CSS con tokens, tema oscuro (paleta del logo) y tema claro: automático según el dispositivo, con botón manual en la cabecera.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en http://localhost:4321 |
| `npm run typecheck` | Chequeo de tipos (`astro check`, incluye los `.astro`) |
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
- Las políticas de privacidad viven en repos propios (`geli-legal`, `suguruneon-legal`, `reinaneon-legal`, …) bajo este mismo dominio. Por eso `validateApps` rechaza cualquier id de app que termine en `-legal`, y `check:dist` falla si el build genera esas rutas.
  Sus URLs están registradas en Play y AdMob: no se mueven, y `check:dist` falla si el build las pisa.

## Más

Spec y plan en `docs/superpowers/`. Sistema de diseño en `docs/sistema-diseno-web.md`. Decisiones en `docs/memoria.html`.
