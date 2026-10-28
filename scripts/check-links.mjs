// Comprueba que respondan los enlaces externos de apps.json. Necesita red; no corre en CI.
import { readFileSync } from 'node:fs';

const apps = JSON.parse(readFileSync('src/data/apps.json', 'utf8'));
let broken = 0;

for (const app of apps) {
  for (const key of ['playUrl', 'optInUrl', 'groupUrl', 'privacyUrl']) {
    const url = app[key];
    if (!url) continue;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const bad = res.status === 404 || res.status >= 500;
      if (bad) broken++;
      console.log(`${bad ? 'ROTO' : 'ok  '} ${res.status} ${app.id}.${key} ${url}`);
    } catch (e) {
      broken++;
      console.log(`ROTO --- ${app.id}.${key} ${url} (${e.message})`);
    }
  }
}
// Google Groups y los enlaces de prueba pueden mandar a un login (200/302): eso no cuenta como roto.
process.exit(broken > 0 ? 1 : 0);
