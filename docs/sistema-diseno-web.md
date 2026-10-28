# Sistema de diseño web — charDev

Fuente de verdad: `src/styles/tokens.css` (valores) y `src/styles/global.css` (uso). Dos temas: oscuro (por defecto) y claro.

## 1. Colores

### Tema oscuro (por defecto, `:root`)

| Token | Hex | Uso | Origen |
|---|---|---|---|
| `--bg` | `#0c0c0c` | Fondo de página | Logo (fondo) |
| `--bg-deep` | `#040404` | Cabecera y pie | Logo (fondo profundo) |
| `--surface` | `#171b1f` | Tarjetas y paneles | Derivado |
| `--surface-2` | `#444c54` | Insignia "en testing" | Logo (pizarra) |
| `--border` | `#444c54` | Bordes y separadores | Logo (pizarra) |
| `--text` | `#f2f4f6` | Texto principal | Derivado de claros del logo |
| `--text-muted` | `#a9b0b8` | Texto secundario, navegación | Derivado |
| `--text-dim` | `#848484` | Pie de página (solo sobre `--bg-deep`) | Logo (gris) |
| `--accent` | `#2cf4fc` | Enlaces, botón primario, foco | Logo (acento) |
| `--accent-hover` | `#7ff8fd` | Hover del botón primario | Derivado |
| `--on-accent` | `#0c0c0c` | Texto sobre `--accent` | Logo (fondo) |
| `--focus` | `#2cf4fc` | Anillo de foco | Igual al acento |

### Tema claro

Mismos nombres de token; solo cambian los valores. Fuentes, espaciado y radios se comparten.

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#f3f5f7` | Fondo de página |
| `--bg-deep` | `#e6ebef` | Cabecera y pie |
| `--surface` | `#ffffff` | Tarjetas y paneles |
| `--surface-2` | `#dde4ea` | Insignia "en testing" |
| `--border` | `#c3ccd4` | Bordes y separadores |
| `--text` | `#14181c` | Texto principal |
| `--text-muted` | `#4a5560` | Texto secundario, navegación |
| `--text-dim` | `#586470` | Pie de página (solo sobre `--bg-deep`) |
| `--accent` | `#00717a` | Enlaces, botón primario, foco |
| `--accent-hover` | `#005a62` | Hover del botón primario (más oscuro, al revés que en oscuro) |
| `--on-accent` | `#ffffff` | Texto sobre `--accent` |
| `--focus` | `#00717a` | Anillo de foco |

En claro el botón primario es relleno verde azulado oscuro con texto blanco; en oscuro sigue siendo el cian neón con texto casi negro.

### Cómo se elige el tema

Hay dos interruptores y ambos viven en `tokens.css`:

1. `prefers-color-scheme`: sin elección manual, el sitio sigue al dispositivo (`@media (prefers-color-scheme: light) { :root:not([data-theme='dark']) { … } }`).
2. `[data-theme]` en `<html>`: la elección manual gana siempre (`:root[data-theme='light']` para claro; `data-theme='dark'` usa los valores por defecto y bloquea la media query).

Los dos bloques claros tienen que ser idénticos (lo verifica `tests/theme.test.ts`, que también mide el contraste de ambos temas). Cada bloque declara su `color-scheme`; no hay `color-scheme` en `global.css`.

Vienen del logo: acento, pizarra, gris, fondo y fondo profundo. Se derivaron: `--surface`, `--text-muted` y `--accent-hover` (además de `--text`).

## 2. Contraste

### Tema oscuro

Ratios WCAG medidos con la fórmula de luminancia relativa. Todo texto tiene que llegar a 4,5:1 (AA). `tests/theme.test.ts` verifica en ambos temas doce pares: text/bg, text/surface, text/surface-2, text-muted/bg, text-muted/surface, text-muted/bg-deep, text-dim/bg-deep, accent/bg, accent/surface, accent/bg-deep, on-accent/accent y on-accent/accent-hover.

| Par | Ratio |
|---|---|
| `--text` sobre `--bg` | 17,74:1 |
| `--text` sobre `--surface` | 15,70:1 |
| `--text` sobre `--surface-2` | 7,91:1 |
| `--text-muted` sobre `--bg` | 8,93:1 |
| `--text-muted` sobre `--surface` | 7,91:1 |
| `--text-dim` sobre `--bg-deep` | 5,48:1 |
| `--accent` sobre `--bg` | 14,39:1 |
| `--accent` sobre `--surface` | 12,74:1 |
| `--accent` sobre `--bg-deep` | 15,09:1 |
| `--on-accent` sobre `--accent` | 14,39:1 |
| `--on-accent` sobre `--accent-hover` | 15,60:1 |
| `--text-muted` sobre `--surface-2` | 3,98:1 (**no pasa AA**) |

Regla (tema oscuro): nunca poner `--text-muted` sobre `--surface-2`. Si se agrega un par nuevo, medirlo antes y sumarlo acá.

### Tema claro

Medidos con la misma fórmula.

| Par | Ratio |
|---|---|
| `--text` sobre `--bg` | 16,32:1 |
| `--text` sobre `--surface` | 17,84:1 |
| `--text` sobre `--surface-2` | 13,90:1 |
| `--text-muted` sobre `--bg` | 6,96:1 |
| `--text-muted` sobre `--surface` | 7,61:1 |
| `--text-muted` sobre `--surface-2` | 5,93:1 |
| `--text-muted` sobre `--bg-deep` | 6,34:1 |
| `--text-dim` sobre `--bg-deep` | 5,04:1 |
| `--accent` sobre `--bg` | 5,27:1 |
| `--accent` sobre `--surface` | 5,76:1 |
| `--accent` sobre `--bg-deep` | 4,80:1 |
| `--on-accent` sobre `--accent` | 5,76:1 |
| `--on-accent` sobre `--accent-hover` | 7,96:1 |

En claro todos los pares de texto pasan AA (incluso `--text-muted` sobre `--surface-2`), pero la regla del tema oscuro sigue vigente: no usar ese par.

## 3. Tipografía

- Títulos: Rajdhani 700 (`--font-display`).
- Texto: Inter 400 y 600 (`--font-body`).
- Se sirven desde el propio sitio con `@fontsource/rajdhani` y `@fontsource/inter` (sin CDN externo).

## 4. Espaciado, radios y breakpoints

- Espaciado: `--space-1` 0,25rem, `-2` 0,5rem, `-3` 0,75rem, `-4` 1rem, `-5` 1,5rem, `-6` 2rem, `-7` 3rem.
- Radios: `--radius` 14px (tarjetas), `--radius-sm` 8px (botones).
- Breakpoints (solo de ancho, en `global.css`):
  - Menos de `40rem`: botones compactos (40px, `0.875rem`, en una sola fila dentro de `.card-actions` y `.actions`), tarjeta con menos relleno e ícono de 48px, portada con logo de 120px, ícono grande de 80px en la página de app y capturas con más aire.
  - Desde `48rem` (768px): grilla de dos columnas iguales (`repeat(2, minmax(0, 1fr))`) con `grid-auto-rows: 1fr`, así todas las tarjetas tienen el mismo alto y las acciones quedan abajo. Por debajo, una columna (entre 40 y 48rem con botones de 44px).
  - Entre `48rem` y `64rem`: las tarjetas llevan menos relleno para que quepan los dos botones en una fila.

## 5. Componentes

- `StatusBadge`: insignia de estado (`.badge-production`, `.badge-testing`, `.badge-soon`).
- `AppCard`: tarjeta de una app en la grilla (ícono, nombre, descripción, estado, acciones).
- `TesterSteps`: pasos para unirse al testing (y salir).
- `Screenshots`: capturas de la app, según idioma.
- Botones: `.btn-primary` (relleno de acento) y `.btn-ghost` (borde de acento). Un solo `.btn-primary` por bloque; el resto, `.btn-ghost`. Altura mínima de 44px en escritorio y 40px en móvil.
- `AppCard` y la portada de `AppPage` ponen el título y la insignia en una misma fila (`.card-heading`, `.title-row`) que baja de línea cuando no entran.
- Botón de tema (`.theme-toggle`, en la cabecera): 44x44px, oculto (`hidden`) hasta que `theme.js` lo muestra.

## 6. Notas para Claude

- Hay dos temas (oscuro por defecto y claro). Todo color sale de un token; nada de colores fijos en componentes.
- Contrato del botón de tema: `<button class="theme-toggle" hidden data-label-to-light data-label-to-dark>` en `Base.astro`. `public/theme.js` (script clásico externo, en el `<head>`, sin `async`/`defer`) aplica `localStorage.theme` (`light` o `dark`) como `data-theme` en `<html>` antes del primer pintado, muestra el botón al cargar el DOM y, al hacer clic, alterna el atributo, guarda la elección (todo `localStorage` va en `try/catch`) y actualiza `aria-label` y `title`. Sin JS el botón no existe y el sitio sigue al dispositivo. Los textos van por `t()` (`theme.toLight`, `theme.toDark`).
- `check:dist` exige `dist/theme.js` y el `<script src="/theme.js">` en el `<head>` de cada página; la CSP no cambia (`'self'`).
- Nada de `style=""` ni scripts en línea (CSP): todo en CSS de archivo o componentes.
- Todo texto visible pasa por `t()`, con su clave en `es.json` y `en.json`.
- Los datos de las apps viven solo en `src/data/apps.json`.
- Sumar un idioma: agregar `xx.json` en `src/i18n/`, sumarlo a `LANGS` y crear las rutas.
- Contraste: ver la sección 2 antes de combinar colores nuevos.
