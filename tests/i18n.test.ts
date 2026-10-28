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
