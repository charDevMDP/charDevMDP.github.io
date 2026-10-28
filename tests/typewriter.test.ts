import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync('public/typewriter.js', 'utf8');
const TEXT = 'Desarrollo de apps web y mobile.';

type Timer = { at: number; fn: () => void };

function classes() {
  const set = new Set<string>();
  return { set, add: (c: string) => set.add(c), remove: (c: string) => set.delete(c) };
}

function setup(opts: { reduced?: boolean; noMarkup?: boolean; throwOnRender?: boolean } = {}) {
  const timers: Timer[] = [];
  let now = 0;
  const html = classes();
  const children: Array<{ className: string; textContent: string }> = [];
  const ghost = { textContent: TEXT };
  const live = {
    _text: '',
    get textContent() { return this._text; },
    set textContent(v: string) { this._text = v; if (v === '') children.length = 0; },
    appendChild(c: { className: string; textContent: string }) { children.push(c); },
  };
  const boxEl = {
    querySelector: (sel: string) => (sel === '.tw-ghost' ? ghost : sel === '.tw-live' ? live : null),
  };
  const handlers: Record<string, () => void> = {};
  const doc = {
    readyState: 'loading',
    hidden: false,
    documentElement: { classList: { add: html.add, remove: html.remove } },
    querySelector: (sel: string) => (sel === '.typewriter' && !opts.noMarkup ? boxEl : null),
    createElement: () => {
      const el = { className: '', _t: '' };
      return Object.defineProperty(el, 'textContent', {
        get: () => el._t,
        set: (v: string) => { if (opts.throwOnRender && el.className === 'tw-typed' && v.length > 3) throw new Error('boom'); el._t = v; },
      });
    },
    addEventListener: (name: string, fn: () => void) => { handlers[name] = fn; },
  };
  const win = {
    matchMedia: (q: string) => ({ matches: !!opts.reduced && q.includes('reduce') }),
    setTimeout: (fn: () => void, ms: number) => { timers.push({ at: now + ms, fn }); },
  };
  runInNewContext(source, { window: win, document: doc, Math });
  const typed = () => children.find((c) => c.className === 'tw-typed')?.textContent ?? '';
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
  return {
    html, doc, typed, run, timers,
    start: () => handlers.DOMContentLoaded?.(),
    visible: () => handlers.visibilitychange?.(),
    hasReadyHandler: () => !!handlers.DOMContentLoaded,
  };
}

describe('typewriter.js (bucle)', () => {
  it('con reduced-motion no escribe: no marca la página ni agenda nada', () => {
    const s = setup({ reduced: true });
    expect(s.html.set.has('js-typing')).toBe(false);
    expect(s.hasReadyHandler()).toBe(false);
    expect(s.timers).toHaveLength(0);
  });

  it('escribe letra por letra hasta la frase completa y se queda fija con el estado activo', () => {
    const s = setup();
    expect(s.html.set.has('js-typing')).toBe(true);
    s.start();
    s.run(299);
    expect(s.typed()).toBe('');
    s.run(1000);
    const partial = s.typed();
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(TEXT.length);
    expect(TEXT.startsWith(partial)).toBe(true);
    s.run(4000);
    expect(s.typed()).toBe(TEXT);
    s.run(6000); // dentro de la pausa de 4,5 s con la frase completa (escribió hasta ~2,1 s)
    expect(s.typed()).toBe(TEXT);
    expect(s.html.set.has('js-typing')).toBe(true);
  });

  it('después de la pausa borra y vuelve a escribir, una y otra vez', () => {
    const s = setup();
    s.start();
    s.run(4000);
    expect(s.typed()).toBe(TEXT);
    s.run(7000); // pausa terminada (~6,6 s): está borrando
    expect(s.typed().length).toBeLessThan(TEXT.length);
    s.run(7700); // borrado completo, antes de volver a escribir (~8 s)
    expect(s.typed()).toBe('');
    s.run(12000); // escribió de nuevo, desde el principio
    expect(s.typed()).toBe(TEXT);
    s.run(60000);
    expect(s.html.set.has('js-typing')).toBe(true); // sigue activo: no termina nunca
  });

  it('con la pestaña oculta el bucle se detiene y retoma al volver', () => {
    const s = setup();
    s.start();
    s.run(1000);
    const before = s.typed();
    s.doc.hidden = true;
    s.run(30000);
    expect(s.typed()).toBe(before);
    s.doc.hidden = false;
    s.visible();
    s.run(31000);
    expect(s.typed().length).toBeGreaterThan(before.length);
  });

  it('el temporizador de seguridad (8 s) quita el estado si nunca arrancó', () => {
    const s = setup();
    s.run(7999);
    expect(s.html.set.has('js-typing')).toBe(true);
    s.run(8000);
    expect(s.html.set.has('js-typing')).toBe(false);
    s.start(); // DOMContentLoaded tardío: no hace nada
    expect(s.typed()).toBe('');
  });

  it('no corta un bucle ya iniciado a los 8 s', () => {
    const s = setup();
    s.start();
    s.run(8001);
    expect(s.html.set.has('js-typing')).toBe(true);
  });

  it('si un paso falla, vuelve al texto estático y se detiene', () => {
    const s = setup({ throwOnRender: true });
    s.start();
    s.run(5000);
    expect(s.html.set.has('js-typing')).toBe(false);
  });

  it('si falta el marcado, deja el texto completo', () => {
    const s = setup({ noMarkup: true });
    s.start();
    expect(s.html.set.has('js-typing')).toBe(false);
  });
});
