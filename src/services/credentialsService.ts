import { Credentials } from '../types';

const KEY = 'xtream_credentials';

export function saveCredentials(host: string, username: string, password: string): void {
  localStorage.setItem(KEY, JSON.stringify({ host, username, password }));
}

export function getCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Credentials>;
    if (!parsed.host || !parsed.username || !parsed.password) return null;
    return { host: parsed.host, username: parsed.username, password: parsed.password };
  } catch {
    return null;
  }
}
