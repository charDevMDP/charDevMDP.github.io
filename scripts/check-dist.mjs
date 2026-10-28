// Verifica el resultado de `npm run build` antes de publicar.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://chardevmdp.github.io';
const EXPECTED_APP_ADS = 'google.com, pub-6526918428646723, DIRECT, f08c47fec0942fa0\n';
const SHADOWED = ['suguruneon-legal', 'geli-legal', 'reinaneon-legal']; // viven en repos aparte: el build no puede crearlas
const problems = [];
const fail = (msg) => problems.push(msg);

if (!existsSync(DIST)) {
  console.error('No existe dist/: corré `npm run build` primero.');
  process.exit(1);
}

const apps = JSON.parse(readFileSync('src/data/apps.json', 'utf8'));
const pages = ['', 'tester/', ...apps.map((a) => `${a.id}/`)].flatMap((p) => [p, `en/${p}`]);

// 1. app-ads.txt idéntico y archivos esperados presentes
if (!existsSync(join(DIST, 'app-ads.txt')) || readFileSync(join(DIST, 'app-ads.txt'), 'utf8') !== EXPECTED_APP_ADS) {
  fail('app-ads.txt falta o cambió');
}
for (const f of ['sitemap.xml', 'robots.txt', 'favicon-32.png', 'apple-touch-icon.png']) {
  if (!existsSync(join(DIST, f))) fail(`falta dist/${f}`);
}
for (const p of pages) {
  if (!existsSync(join(DIST, p, 'index.html'))) fail(`falta la página /${p}`);
}

// 2. No pisar las políticas de privacidad
for (const dir of SHADOWED) {
  if (existsSync(join(DIST, dir))) fail(`el build crea /${dir}/ y pisaría el repo de la política`);
}

// 3. Cada página: lang, hreflang, una sola h1, sin style en línea, CSP, activos locales existentes
const exists = (urlPath) => {
  const target = join(DIST, urlPath);
  return existsSync(target) && (!statSync(target).isDirectory() || existsSync(join(target, 'index.html')));
};
for (const p of pages) {
  const file = join(DIST, p, 'index.html');
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const lang = p.startsWith('en/') ? 'en' : 'es-AR';
  if (!html.includes(`<html lang="${lang}"`)) fail(`/${p}: lang incorrecto (esperado ${lang})`);
  const logical = p.replace(/^en\//, '');
  const es = `${ORIGIN}/${logical}`;
  const en = `${ORIGIN}/en/${logical}`;
  for (const [h, href] of [['es-AR', es], ['en', en], ['x-default', es]]) {
    if (!html.includes(`<link rel="alternate" hreflang="${h}" href="${href}">`)) {
      fail(`/${p}: falta <link rel="alternate" hreflang="${h}" href="${href}">`);
    }
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`/${p}: debe tener exactamente una h1`);
  if (/\sstyle="/.test(html)) fail(`/${p}: tiene style en línea (la CSP lo bloquea)`);
  const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1];
  if (csp === undefined) fail(`/${p}: falta la CSP`);
  else {
    for (const bad of ['unsafe-inline', 'unsafe-eval']) {
      if (csp.includes(bad)) fail(`/${p}: la CSP contiene ${bad}`);
    }
    const hosts = csp.match(/https?:\/\/[^\s;]+/g);
    if (hosts) fail(`/${p}: la CSP permite hosts externos (${hosts.join(', ')})`);
  }
  for (const m of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
    if (!exists(m[1])) fail(`/${p}: enlace local roto ${m[1]}`);
  }
}

if (problems.length > 0) {
  console.error(`check-dist: ${problems.length} problema(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`check-dist: OK (${pages.length} páginas)`);
