import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Devuelve el cuerpo `{ … }` que sigue a `selector` (sin llaves anidadas). */
function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`tokens.css: falta ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

function props(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

const COLOR_TOKENS = ['--bg', '--bg-deep', '--surface', '--surface-2', '--border', '--text', '--text-muted', '--text-dim', '--accent', '--accent-hover', '--on-accent', '--focus'];

const dark = props(block(':root {'));
const lightMedia = props(block(":root:not([data-theme='dark'])"));
const lightManual = props(block(":root[data-theme='light']"));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens: tema claro y oscuro', () => {
  it('el bloque claro por media query usa los mismos tokens que el oscuro', () => {
    for (const k of COLOR_TOKENS) expect(dark.has(k), `oscuro sin ${k}`).toBe(true);
    const names = (m: Map<string, string>) => [...m.keys()].sort();
    const colors = [...COLOR_TOKENS].sort();
    expect(names(lightMedia)).toEqual(colors);
    expect(names(lightManual)).toEqual(colors);
    expect(names(dark).filter((k) => COLOR_TOKENS.includes(k))).toEqual(colors);
  });

  it('los dos bloques claros tienen valores idénticos y declaran color-scheme', () => {
    expect(lightMedia).toEqual(lightManual);
    expect(block(":root:not([data-theme='dark'])")).toMatch(/color-scheme:\s*light/);
    expect(block(":root[data-theme='light']")).toMatch(/color-scheme:\s*light/);
    expect(block(':root {')).toMatch(/color-scheme:\s*dark/);
  });

  const PAIRS: Array<[string, string]> = [
    ['--text', '--bg'], ['--text', '--surface'], ['--text-muted', '--bg'], ['--text-muted', '--surface'],
    ['--text-dim', '--bg-deep'], ['--accent', '--bg'], ['--accent', '--surface'], ['--on-accent', '--accent'],
    ['--accent', '--bg-deep'], ['--text-muted', '--bg-deep'], ['--text', '--surface-2'], ['--on-accent', '--accent-hover'],
  ];
  for (const [name, theme] of [['oscuro', dark], ['claro', lightManual]] as const) {
    for (const [fg, bg] of PAIRS) {
      it(`${name}: ${fg} sobre ${bg} llega a 4,5:1`, () => {
        expect(ratio(theme.get(fg)!, theme.get(bg)!)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
