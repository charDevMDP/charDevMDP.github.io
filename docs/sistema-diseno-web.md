# Sistema de diseño web — charDev

Fuente de verdad: `src/styles/tokens.css` (valores) y `src/styles/global.css` (uso). Tema único oscuro.

## 1. Colores

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

Vienen del logo: acento, pizarra, gris, fondo y fondo profundo. Se derivaron: `--surface`, `--text-muted` y `--accent-hover` (además de `--text`).

## 2. Contraste

Ratios WCAG medidos con la fórmula de luminancia relativa. Todo texto tiene que llegar a 4,5:1 (AA).

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

Regla: nunca poner `--text-muted` sobre `--surface-2`. Si se agrega un par nuevo, medirlo antes y sumarlo acá.

## 3. Tipografía

- Títulos: Rajdhani 700 (`--font-display`).
- Texto: Inter 400 y 600 (`--font-body`).
- Se sirven desde el propio sitio con `@fontsource/rajdhani` y `@fontsource/inter` (sin CDN externo).

## 4. Espaciado, radios y breakpoints

- Espaciado: `--space-1` 0,25rem, `-2` 0,5rem, `-3` 0,75rem, `-4` 1rem, `-5` 1,5rem, `-6` 2rem, `-7` 3rem.
- Radios: `--radius` 14px (tarjetas), `--radius-sm` 8px (botones).
- Breakpoints: no hay media queries de ancho. La grilla es `repeat(auto-fill, minmax(18rem, 1fr))`: el ancho de la columna es el único punto de quiebre.

## 5. Componentes

- `StatusBadge`: insignia de estado (`.badge-production`, `.badge-testing`, `.badge-soon`).
- `AppCard`: tarjeta de una app en la grilla (ícono, nombre, descripción, estado, acciones).
- `TesterSteps`: pasos para unirse al testing (y salir).
- `Screenshots`: capturas de la app, según idioma.
- Botones: `.btn-primary` (relleno de acento) y `.btn-ghost` (borde de acento). Un solo `.btn-primary` por bloque; el resto, `.btn-ghost`. Altura mínima de 44px.

## 6. Notas para Claude

- Tema único oscuro; no hay modo claro.
- Nada de `style=""` ni scripts en línea (CSP): todo en CSS de archivo o componentes.
- Todo texto visible pasa por `t()`, con su clave en `es.json` y `en.json`.
- Los datos de las apps viven solo en `src/data/apps.json`.
- Sumar un idioma: agregar `xx.json` en `src/i18n/`, sumarlo a `LANGS` y crear las rutas.
- Contraste: ver la sección 2 antes de combinar colores nuevos.
