# Auditoría de accesibilidad y seguridad del sitio

Fecha: 2026-10-28. Rama `feat/sitio-astro` (HEAD c650b75 al auditar; las correcciones de la revisión final están al commit 27bd7e9, y esta actualización del documento va en el commit siguiente). Build de producción servido con `npm run preview -- --port 4321`.
Solo se anotan resultados medidos; lo que no se probó figura como tal.

## 1. Lighthouse

Herramienta: Lighthouse 13.6.0 por línea de comandos (`npx lighthouse`, Chrome headless), móvil (emulación por defecto) y escritorio (`--preset=desktop`). Categorías: accesibilidad, SEO y mejores prácticas (rendimiento no auditado).

| Página | Dispositivo | Accesibilidad | SEO | Mejores prácticas |
|---|---|---|---|---|
| `/` | móvil | 100 | 100 | 100 |
| `/` | escritorio | 100 | 100 | 100 |
| `/en/` | móvil | 100 | 100 | 100 |
| `/en/` | escritorio | 100 | 100 | 100 |
| `/suguruneon/` | móvil | 100 | 100 | 100 |
| `/suguruneon/` | escritorio | 100 | 100 | 100 |
| `/tester/` | móvil | 100 | 100 | 100 |
| `/tester/` | escritorio | 100 | 100 | 100 |

Auditorías fallidas (score < 1, sin contar las no aplicables ni las informativas): ninguna en las 8 corridas. Objetivo (accesibilidad ≥ 95, SEO ≥ 95): cumplido. Limitación: las corridas son contra `localhost` sin HTTPS real; Lighthouse trata `localhost` como origen seguro.

## 2. Revisión visual y de teclado

Con el navegador del panel (emulación móvil 375 × 812 y escritorio):

Se comprobó:
- Sin scroll horizontal de la página (`scrollWidth == clientWidth`) en `/`, `/en/`, `/suguruneon/`, `/geli/`, `/en/reinaneon/`, `/tester/` y `/en/tester/`, tanto a 375 px como en escritorio. La tira de capturas (`.shots`) sí desborda y scrollea dentro de sí misma (p. ej. 879 px de contenido en 339 px visibles en `/suguruneon/`).
- Selector de idioma (enlace "English" / "Español") presente en la cabecera de las 7 páginas; visible en captura en `/suguruneon/` (móvil) y `/en/reinaneon/` (escritorio).
- Un solo `h1` por página en las 7 páginas.
- Orden de Tab en `/suguruneon/` (móvil): Saltar al contenido → charDev → Apps → Ser tester → English → Volver a las apps → Ver en Google Play → capturas → Política de privacidad → correo del pie → vuelve al inicio. Es decir, saltar-al-contenido → cabecera → contenido → pie. Todos los elementos enfocados muestran contorno sólido de 3 px (cian).
- La tira `.shots` tiene `tabindex="0"`, recibe foco con Tab y se desplaza con la flecha derecha (5 pulsaciones: `scrollLeft` de 0 a 200).

No se comprobó:
- Orden de Tab en las demás páginas (solo en `/suguruneon/`; el marcado de cabecera y pie es compartido).
- Lector de pantalla (VoiceOver/TalkBack/NVDA): ninguno probado.
- Safari, Firefox y dispositivos reales; zoom del 200 % / reflow; modo claro (el panel mostró el tema oscuro); `prefers-reduced-motion`.
- Tamaño de objetivos táctiles de 44 px elemento por elemento: se midieron enlaces y botones con alto de bloque; los botones (`.btn`) y el enlace "Saltar al contenido" cumplen (42 px el último, visible solo con foco); el enlace de marca `charDev` de la cabecera mide 38 px de alto (ver hallazgos abiertos). Los enlaces en línea dentro de párrafos no se midieron.

## 3. CSP y limitaciones de GitHub Pages

La política la genera Astro (hashes de los scripts y estilos en línea) como `<meta http-equiv>`; contenido en `dist/index.html`:

```
default-src 'self';img-src 'self' data:;font-src 'self';connect-src 'self';object-src 'none';base-uri 'self';form-action 'none';upgrade-insecure-requests; script-src 'self' 'sha256-xIb/Pa7FUshAu4ihwjchYcQpyCI8eS8kt40GpOAYCz8=' 'sha256-1BvDVWLr3QCC20uHhUDi27eDFVJpk1uMQJGIWKUks2I=' 'sha256-kmZE/W8I1iuTnl1b3yqzv9/DQZenPngd3NjSKMQl7y0=' 'sha256-Y8t0ntteBwH+PqGKUyjWW3CAk+BNJKSoQc0xZ68FjhM=' 'sha256-0O7iB6zr9x0r6X6eWYITC9V5q+yWCGAoFvcysBGbY9Q='; style-src 'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
```

Limitaciones: GitHub Pages no permite cabeceras HTTP propias. Por eso no se pueden fijar `frame-ancestors` (la directiva se ignora en un `<meta>`, así que el sitio puede embeberse en un iframe ajeno), `X-Content-Type-Options: nosniff` ni `Strict-Transport-Security` propia (HTTPS lo impone GitHub Pages, pero sin la cabecera del sitio). Esto no se mitiga desde el repo; tampoco se verificó en producción qué cabeceras envía GitHub Pages por su cuenta (el sitio aún no está publicado).
La CSP en `<meta>` se comprobó leyendo el HTML generado; no se auditó con un evaluador de CSP externo.

## 4. Sección de testers con datos de prueba

Hasta ahora ninguna app estaba en testing, así que la sección nunca se había renderizado. Se cambió temporalmente `geli` a `status: "testing"`, `versionTesting: "0.9.0"`, con `optInUrl` y `groupUrl` de ejemplo, y luego se revirtió (`git checkout src/data/apps.json`).

Con ese dato de prueba: `npm run build`, `npm run check:dist` (OK, 10 páginas) y `npx vitest run` (26 de 26) pasaron. Resultados sobre el HTML generado:
- `/geli/` y `/en/geli/`: existe `<section id="tester" aria-labelledby="tester-heading">` con los pasos para unirse (botón "Unirme al grupo" al grupo y botón "Abrir enlace de prueba" al opt-in, ambos `target="_blank" rel="noopener"` con aviso `sr-only` "(se abre en una pestaña nueva)" / "(opens in a new tab)"), los pasos para salir (opt-in de nuevo, desinstalar, salir del grupo con botón "Ir al grupo") y la nota del grupo compartido.
- Un solo `h1` y ningún id duplicado en `/geli/`, `/en/geli/`, `/tester/`, `/en/tester/`, `/` y `/en/`.
- La tarjeta de GeLi en la portada (es y en) muestra la insignia "En testing" / "In testing", la versión en testing y el botón "Ser tester" / "Become a tester" (enlace a `/geli/#tester`).
- `/tester/` y `/en/tester/` listan GeLi bajo "Apps en testing" / "Apps in testing" y ya no muestran el texto de "ninguna en testing".
- En el navegador (escritorio) se miró `/geli/`: insignia, versión en testing y botón "Ser tester" en la cabecera de la app; la sección `#tester` con botones visibles y legibles. No se miró en móvil.
- Lighthouse sobre `/geli/` con el dato de prueba: accesibilidad 100, SEO 100, mejores prácticas 100 (móvil y escritorio).

No verificado: que los textos «Convertirme en tester» y «Salir del programa» coincidan con lo que muestra Google Play (es el motivo del gate con el dueño del sitio), ni que los enlaces reales funcionen (los usados eran ficticios).

## 5. Hallazgos

Corregidos: ninguno; no apareció ningún fallo de Lighthouse ni de marcado que corregir.

Abiertos (menores, sin corregir):
1. Cerrado: el enlace de marca `charDev` mide 38 px de alto, y eso cumple el tamaño de objetivo de WCAG 2.2 AA (criterio 2.5.8 exige 24 px). Los 44 px son la guía propia del proyecto y quedan como preferencia de diseño, no como incumplimiento.
2. Cerrado (era un error de la auditoría): `.shots` sí tiene nombre accesible, vía `aria-labelledby="shots-heading"` apuntando al `h2` de la sección.
3. Cabeceras de seguridad no configurables en GitHub Pages (sección 3).
4. Pendientes de prueba manual listados en la sección 2 (lector de pantalla, otros navegadores, zoom 200 %, tema claro).

## 6. Revisión final (2026-10-28)

Tres revisiones de toda la rama (código, accesibilidad, seguridad) y lo que se arregló en esta ronda:

- Cualquier URL `*-legal` pisada: `reinaneon-legal` se suma a las protegidas en `check:dist` y `validateApps` rechaza ids que terminen en `-legal`.
- Tipos: se agregó `npm run typecheck` (`astro check`, con `@astrojs/check` y `@types/node`) y corre en CI. Sin errores. TypeScript baja a la serie 6 porque `@astrojs/check` 0.9 todavía no soporta TypeScript 7.
- Workflow: permisos de nivel flujo solo `contents: read`; `pages: write` e `id-token: write` únicamente en el job `deploy`; los deploys en `main` ya no se cancelan entre sí.
- `check:dist` ahora verifica los `<link rel="alternate" hreflang>` reales (es-AR, en, x-default) y que la CSP no tenga `unsafe-inline`, `unsafe-eval` ni hosts externos; se probó que ambas comprobaciones fallan al introducir la falla.
- `apps.json`: los tres datos de testing van juntos, capturas e ícono deben ser rutas locales, y `site` tiene una guarda explícita en lugar de `!`.
- Accesibilidad: el enlace actual y el hover de la navegación se subrayan (no dependen solo del color); `role="list"` en las cuatro listas sin viñetas; `/tester/` no muestra los pasos de alta y baja cuando no hay ninguna app en testing (verificado también con una app de prueba en testing).

Riesgo aceptado: bajo. GitHub Pages no permite `frame-ancestors` ni `X-Content-Type-Options`. Es un sitio estático sin autenticación, formularios ni acciones que cambien estado, así que el clickjacking o el sniffing de tipos no tienen qué explotar.

Diferido a propósito:
- El texto alternativo de las capturas es un ordinal ("Captura 1").
- Redundancia del `alt` de los íconos junto al nombre de la app.
- Textos de enlace duplicados ("Ver detalles").
- Ícono visual de "se abre en una pestaña nueva" (hoy solo hay texto para lectores de pantalla).
- `tabindex` en `main`.
- Las acciones de GitHub quedan fijadas a etiquetas `@v4`/`@v3`, no a SHA.

## 7. Tema claro (2026-10-28)

- Contraste del tema claro medido con la fórmula WCAG: todos los pares de texto pasan 4,5:1. Mínimo: `--accent` sobre `--bg-deep` 4,80:1 (navegación activa); resto entre 5,04:1 y 17,84:1 (tabla en `docs/sistema-diseno-web.md`). `tests/theme.test.ts` lo verifica en ambos temas.
- CSP sin cambios: `theme.js` es un script externo de `'self'`; no hay scripts ni estilos en línea nuevos (`check:dist` lo comprueba).
- Botón de tema: `<button>` real, 44x44px, nombre accesible que dice la acción siguiente, foco visible, íconos `aria-hidden`; oculto hasta que corre el script.
- Lighthouse (accesibilidad / SEO / buenas prácticas), `/` y `/geli/` en oscuro y en claro (copia de `dist` con `data-theme`): 100 / 100 / 100 en las cuatro mediciones.

## 8. Tipeo de la frase de la portada (2026-10-28)

- WCAG 2.2.2 (Pausar, detener, ocultar): **desviación aceptada (D12)**. Desde el bucle de la portada el cursor parpadea sin parar y la frase se reescribe cada ~8 s, así que supera los 5 s sin un control de pausa en pantalla. Mitigaciones: con `prefers-reduced-motion: reduce` no hay animación (la frase queda completa y quieta), el bucle se detiene con la pestaña oculta y, sin JS, el texto es estático. Antes (hasta D11) el efecto era finito (< 5 s) y cumplía.
- Sin salto de layout: el alto del párrafo se midió durante todo el tipeo y no cambió (1 línea: 29,44 px en escritorio y 25,59 px a 375 px y 320 px; 2 líneas a 230 px: 51,19 px, constante).
- Lectores de pantalla: la frase completa está en un `.sr-only` desde el primer pintado; el fantasma y el tramo que se escribe son `aria-hidden`; no hay `aria-live`.
- `prefers-reduced-motion: reduce` (simulado con `matchMedia`): sin tipeo ni cursor, texto completo al instante. Una vez por sesión: la segunda carga no escribe.
- CSP sin cambios (script externo `'self'`, sin scripts ni estilos en línea); consola sin errores. Lighthouse móvil en `/`: accesibilidad 100, SEO 100, buenas prácticas 100.
- Menú móvil con `space-around`: a 375 px el margen al primer y último ítem es 31,7 px (es) y 25,3 px (en); a 320 px, 24,8 px (es) y 18,4 px (en); una sola fila, sin scroll horizontal.
- Sin verificar: dispositivos reales, otros navegadores (Safari/Firefox), lectores de pantalla.
