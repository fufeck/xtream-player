const STORAGE_KEY = 'xtream_favorites';

export function getFavoriteIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): void {
  const ids = getFavoriteIds();
  const idx = ids.indexOf(id);
  if (idx === -1) ids.push(id);
  else ids.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
