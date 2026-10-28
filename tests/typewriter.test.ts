import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync('public/typewriter.js', 'utf8');
const TEXT = 'Desarrollo de apps web y mobile.';

type Timer = { at: number; fn: () => void };

function classes() {
  const set = new Set<string>();
  return { set, add: (c: string) => set.add(c), remove: (c: string) => set.delete(c), contains: (c: string) => set.has(c) };
}

function setup(opts: { reduced?: boolean; stored?: boolean; storageThrows?: boolean; noMarkup?: boolean } = {}) {
  const timers: Timer[] = [];
  let now = 0;
  const html = classes();
  const box = classes();
  const ghost = { textContent: TEXT };
  const children: Array<{ className: string; textContent: string }> = [];
  const live = {
    _text: '',
    get textContent() { return this._text; },
    set textContent(v: string) { this._text = v; if (v === '') children.length = 0; },
    appendChild(c: { className: string; textContent: string }) { children.push(c); },
  };
  const boxEl = {
    classList: { add: box.add, remove: box.remove },
    querySelector: (sel: string) => (sel === '.tw-ghost' ? ghost : sel === '.tw-live' ? live : null),
  };
  let ready: (() => void) | null = null;
  const store = new Map<string, string>();
  const doc = {
    readyState: 'loading',
    documentElement: { classList: { add: html.add, remove: html.remove } },
    querySelector: (sel: string) => (sel === '.typewriter' && !opts.noMarkup ? boxEl : null),
    createElement: () => ({ className: '', textContent: '' }),
    addEventListener: (_: string, fn: () => void) => { ready = fn; },
  };
  const win = {
    matchMedia: (q: string) => ({ matches: !!opts.reduced && q.includes('reduce') }),
    sessionStorage: opts.storageThrows
      ? { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } }
      : { getItem: (k: string) => (opts.stored ? '1' : store.get(k) ?? null), setItem: (k: string, v: string) => { store.set(k, v); } },
    setTimeout: (fn: () => void, ms: number) => { timers.push({ at: now + ms, fn }); },
  };
  runInNewContext(source, { window: win, document: doc, Math });
  const typedText = () => children.find((c) => c.className === 'tw-typed')?.textContent ?? '';
  const run = (until: number) => {
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers[0];
      if (!next || next.at > until) break;
      timers.shift();
      now = next.at;
      next.fn();
    }
    now = until;
  };
  return { html, box, store, typedText, run, start: () => ready?.(), ready: () => ready !== null, timers };
}

describe('typewriter.js', () => {
  it('con reduced-motion no escribe: no marca la página ni registra nada', () => {
    const s = setup({ reduced: true });
    expect(s.html.set.has('js-typing')).toBe(false);
    expect(s.ready()).toBe(false);
    expect(s.timers).toHaveLength(0);
  });

  it('si ya se escribió en la sesión, muestra el texto completo al instante', () => {
    const s = setup({ stored: true });
    expect(s.html.set.has('js-typing')).toBe(false);
    expect(s.ready()).toBe(false);
  });

  it('si sessionStorage falla, igual escribe y no lanza', () => {
    const s = setup({ storageThrows: true });
    expect(s.html.set.has('js-typing')).toBe(true);
    s.start();
    s.run(1000);
    expect(s.typedText().length).toBeGreaterThan(0);
    s.run(7000);
    expect(s.typedText()).toBe(TEXT);
    expect(s.html.set.has('js-typing')).toBe(false);
  });

  it('camino feliz: marca el estado, escribe letra por letra, termina completo y limpia', () => {
    const s = setup();
    expect(s.html.set.has('js-typing')).toBe(true);
    s.start();
    expect(s.store.get('typewriter-done')).toBe('1');
    s.run(299);
    expect(s.typedText()).toBe('');
    s.run(700);
    const partial = s.typedText();
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(TEXT.length);
    expect(TEXT.startsWith(partial)).toBe(true);
    s.run(4000);
    expect(s.typedText()).toBe(TEXT);
    expect(s.box.set.has('tw-done')).toBe(true);
    expect(s.html.set.has('js-typing')).toBe(true);
    s.run(5000); // cursor ya apagado: antes de 5 s todo vuelve al estado estático
    expect(s.html.set.has('js-typing')).toBe(false);
    expect(s.box.set.has('tw-done')).toBe(false);
  });

  it('el temporizador de seguridad (8 s) quita el estado aunque nunca cargue el DOM', () => {
    const s = setup();
    expect(s.html.set.has('js-typing')).toBe(true);
    s.run(7999);
    expect(s.html.set.has('js-typing')).toBe(true);
    s.run(8000);
    expect(s.html.set.has('js-typing')).toBe(false);
    s.start(); // DOMContentLoaded tardío: no hace nada
    expect(s.typedText()).toBe('');
  });

  it('si falta el marcado, deja el texto completo', () => {
    const s = setup({ noMarkup: true });
    s.start();
    expect(s.html.set.has('js-typing')).toBe(false);
  });
});
