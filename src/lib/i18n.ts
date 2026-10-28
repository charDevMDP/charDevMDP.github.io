import es from '../i18n/es.json';
import en from '../i18n/en.json';
import type { Lang } from './langs';

export type Dict = { [key: string]: string | Dict };
type Vars = Record<string, string | number>;

const dicts: Record<Lang, Dict> = { es, en };

export const htmlLang: Record<Lang, string> = { es: 'es-AR', en: 'en' };

export function flatKeys(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatKeys(v, `${prefix}${k}.`),
  );
}

export function missingKeys(source: Dict, target: Dict): string[] {
  const have = new Set(flatKeys(target));
  return flatKeys(source).filter((k) => !have.has(k));
}

export function assertParity(esDict: Dict, enDict: Dict): void {
  const problems = [
    ...missingKeys(esDict, enDict).map((k) => `falta en en.json: ${k}`),
    ...missingKeys(enDict, esDict).map((k) => `falta en es.json: ${k}`),
  ];
  if (problems.length > 0) throw new Error(`es.json y en.json no coinciden:\n- ${problems.join('\n- ')}`);
}

// Si los diccionarios no coinciden, el build falla acá, antes de renderizar nada.
assertParity(dicts.es, dicts.en);

export function lookup(dict: Dict, key: string): string | undefined {
  let cur: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (cur === undefined || typeof cur === 'string') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function translate(dict: Dict, key: string, vars: Vars = {}): string {
  const raw = lookup(dict, key);
  if (raw === undefined) throw new Error(`Falta la clave de texto: ${key}`);
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`Falta la variable {${name}} en ${key}`);
    return String(vars[name]);
  });
}

export function t(lang: Lang, key: string, vars?: Vars): string {
  return translate(dicts[lang], key, vars);
}

export function localePath(lang: Lang, path: string): string {
  return lang === 'es' ? path : `/en${path}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}
