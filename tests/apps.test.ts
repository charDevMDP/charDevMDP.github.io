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

  it('exige privacyUrl en producción y en testing', () => {
    expect(() => validateApps([production({ privacyUrl: null })])).toThrow('privacyUrl');
    expect(() => validateApps([testing({ privacyUrl: null })])).toThrow('privacyUrl');
  });

  it('rechaza ids repetidos, reservados o con formato inválido', () => {
    expect(() => validateApps([base(), base()])).toThrow('repetido');
    expect(() => validateApps([base({ id: 'tester' })])).toThrow('reservado');
    expect(() => validateApps([base({ id: 'Mi App' })])).toThrow('id inválido');
  });

  it('reserva los ids que terminan en -legal (son repos de políticas)', () => {
    for (const id of ['geli-legal', 'reinaneon-legal', 'x-legal']) {
      expect(() => validateApps([base({ id })])).toThrow('reservado');
    }
    expect(() => validateApps([base({ id: 'legal-x' })])).not.toThrow();
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
