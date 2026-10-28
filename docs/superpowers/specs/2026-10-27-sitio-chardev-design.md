# Sitio charDev — diseño

Fecha: 2026-10-27 · Estado: borrador para revisión de Char

## Objetivo

Convertir `https://chardevmdp.github.io/` (hoy un `index.html` de 2,7 KB con tarjetas de SuguruNeon y GeLi) en el hub de
charDev: ver las apps y su estado, qué versión está en producción, cómo sumarse como tester y cómo darse de baja.
Español e inglés. Sin backend ni formularios.

## Decisiones cerradas

| # | Decisión | Elegido |
|---|----------|---------|
| 1 | Alta de testers | Enlace de opt-in de Play. Quien quiere probar entra antes a un **Google Group abierto** asociado al track de testing; el enlace de opt-in solo funciona para miembros de la lista. La web no recolecta mails. |
| 2 | Qué apps se ven | **Todas**, cada una con estado: En producción, En testing, Próximamente. |
| 3 | Idioma | Español (`/`) e inglés (`/en/`), con selector de idioma. |
| 4 | Tecnología | **Astro** estático, rutas por idioma, deploy con GitHub Actions. |
| 5 | Marca | Modo oscuro fijo con la paleta del logo; el cian solo como acento. |

## Paleta (medida sobre el PNG del logo, ±4 por canal)

| Rol | Color |
|-----|-------|
| Acento (botones, estado "En producción", enlaces) | `#2CF4FC` |
| Superficies / tarjetas | `#444C54` |
| Bordes / texto secundario | `#848484` |
| Fondo de página | `#0C0C0C` |
| Fondo profundo (pie) | `#040404` |

El texto principal es casi blanco (`#F2F4F6`, a confirmar con la auditoría de contraste).

## Páginas

Cada una existe en español (`/…`) y en inglés (`/en/…`), con `hreflang` cruzado.

1. **Portada**: logo, frase corta, grilla de apps. Cada tarjeta: ícono, nombre, insignia de estado, versión y botón
   principal según estado (Google Play si está en producción, "Ser tester" si está en testing, ninguno si es
   Próximamente).
2. **Página de app** (`/<app>/`): descripción, capturas, versión en producción y versión en testing, botón a Play,
   sección "Ser tester", sección "Darte de baja", enlace a la política de privacidad, contacto.
3. **`/tester/`**: cómo funciona el testing cerrado, pasos para unirse y para salir, cómo reportar un problema.

## Flujo de tester (texto de las páginas)

Unirse:
1. Unirte al Google Group (un clic).
2. Abrir el enlace de opt-in de la app y tocar "Convertirme en tester".
3. Instalar desde Google Play.

Salir:
1. Abrir de nuevo el enlace de opt-in y tocar "Salir del programa".
2. Desinstalar la versión de prueba (opcional: dejar el Google Group).

**Antes de publicar estos textos, Char prueba el camino completo con su propia cuenta** y se ajustan los pasos a lo que
Play muestra realmente.

## Datos

`src/data/apps.json`, una entrada por app:

- `id`, `name`, `status` (`production` | `testing` | `soon`)
- `versionProduction`, `versionTesting` (pueden ser nulos según el estado)
- `playUrl`, `optInUrl`, `groupUrl`, `privacyUrl`
- `icon`, `screenshots[]`

Los textos viven en `src/i18n/es.json` y `src/i18n/en.json`. Cambiar una versión es editar una línea de `apps.json`.
El paso "actualizar versión en el sitio" se suma a la guía de publicar en Play de `_estandares/`.

## Convenciones web (según `_estandares/web/stack-astro.md`)

- Base: la web de ICBR. Astro estático, **CSS puro con tokens semánticos** en `src/styles/tokens.css`; sin Tailwind; React
  solo como isla si hiciera falta (no se prevé).
- **Desvío deliberado del estándar**: un solo tema (oscuro), sin toggle claro/oscuro. Los tokens siguen siendo semánticos
  (`--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`), así que sumar un tema claro después es agregar
  valores, no rehacer estilos.
- Antes de estilar: `docs/sistema-diseno-web.md` con colores (contraste verificado), tipografía, espaciado, radios,
  breakpoints y una sección "Notas para Claude".
- Fuentes con `@fontsource/*`, servidas desde el sitio. Sin Google Fonts.
- Seguridad: `security.csp` de Astro; GitHub Pages no admite cabeceras propias, así que el resto de las cabeceras
  (`frame-ancestors`, `X-Content-Type-Options`, etc.) queda fuera y se documenta como limitación.
- Accesibilidad WCAG 2.2 AA: foco visible, teclado, `lang` correcto en cada idioma, `alt`, `prefers-reduced-motion`.
  Auditoría en `docs/auditoria-accesibilidad-seguridad.md`.
- Enlaces `target="_blank"` con aviso `sr-only` y `rel="noopener"`.

## Estructura del repo

- Astro en la raíz de `charDevMDP.github.io`.
- El repo hoy solo tiene `main`. Se crea `develop` y las ramas de trabajo salen de ahí; esta spec va por
  `docs/sitio-chardev-spec`.
- `public/app-ads.txt` se sirve idéntico en la raíz del dominio.
- Las políticas siguen en sus repos (`geli-legal`, `suguruneon-legal`, …) bajo el mismo dominio; sus URLs **no cambian**.
- Despliegue: GitHub Actions al hacer merge en `main`. Flujo `develop` + `main` de siempre.
- Paso de Char: Settings → Pages → Source → "GitHub Actions".

## Errores

El build **falla** si:
- una app `production` no tiene `versionProduction` o `playUrl`;
- una app `testing` no tiene `versionTesting`, `optInUrl` o `groupUrl`;
- una clave existe en `es.json` y no en `en.json` (o al revés).

## Pruebas antes de publicar

- Build limpio; paridad de claves es/en.
- Los enlaces a Play, a las políticas y a los Google Groups responden; `app-ads.txt` es idéntico al actual.
- Lighthouse de accesibilidad y SEO, con el contraste del cian sobre fondo oscuro.
- Revisión visual en celular y escritorio; `hreflang` y sitemap presentes.

## Fuera de alcance

Formularios, recolección de mails, estadísticas, lectura automática de la versión desde Play, modo claro.

## Pendientes de Char

- Logo en SVG o PNG transparente (si no, se usa el PNG actual).
- Capturas por app (o se sacan del simulador); hasta entonces, bloque con nombre e ícono.
- Crear los Google Groups y asociarlos al track de testing de cada app en Play Console.
- Activar GitHub Pages con Source "GitHub Actions".
