import raw from './apps.json';
import { validateApps, type App } from '../lib/apps';

// Se valida al cargar el módulo: si apps.json tiene un problema, el build falla acá.
export const apps: App[] = validateApps(raw);

export function getApp(id: string): App | undefined {
  return apps.find((a) => a.id === id);
}
