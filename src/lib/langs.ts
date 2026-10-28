export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
