import { DEFAULT_FILTERS, validFilters, type SearchFilters } from './model';

export const SHORTLIST_STORAGE_KEY = 'signedprice_seoul_shortlist_v1';
export const SHORTLIST_EVENT = 'signedprice:shortlist';
export type SavedBuilding = { key: string; name: string; signatures: string[]; checkedAt: string };
export type SavedSearch = { version: 1; filters: SearchFilters; buildings: SavedBuilding[] };
export function parseSavedSearch(raw: string): SavedSearch {
  const empty: SavedSearch = { version: 1, filters: { ...DEFAULT_FILTERS }, buildings: [] };
  try {
    if (raw.length > 150_000) return empty;
    const value = JSON.parse(raw) as SavedSearch;
    if (value.version !== 1 || !validFilters(value.filters) || !Array.isArray(value.buildings)) return empty;
    const keys = new Set<string>();
    const buildings = value.buildings.filter(b => {
      if (!b || typeof b.key !== 'string' || !/^[a-z0-9_-]+\/[a-zA-Z0-9_-]{1,160}$/.test(b.key)
        || keys.has(b.key) || typeof b.name !== 'string' || b.name.length > 200
        || typeof b.checkedAt !== 'string' || !Number.isFinite(Date.parse(b.checkedAt))
        || !Array.isArray(b.signatures) || b.signatures.length > 20
        || b.signatures.some(s => typeof s !== 'string' || s.length > 120)) return false;
      keys.add(b.key); return true;
    }).slice(0, 30);
    return { version: 1, filters: value.filters, buildings };
  } catch { return empty; }
}
let volatileValue = '';
let sessionOnly = false;
export function readSavedSearch(): string {
  if (sessionOnly) return volatileValue;
  try { return window.localStorage.getItem(SHORTLIST_STORAGE_KEY) ?? ''; }
  catch { return volatileValue; }
}
export function subscribeSavedSearch(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(SHORTLIST_EVENT, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(SHORTLIST_EVENT, listener); };
}
export function writeSavedSearch(value: SavedSearch): boolean {
  volatileValue = JSON.stringify(value);
  let persisted = true;
  try { window.localStorage.setItem(SHORTLIST_STORAGE_KEY, volatileValue); sessionOnly = false; }
  catch { persisted = false; sessionOnly = true; }
  window.dispatchEvent(new Event(SHORTLIST_EVENT));
  return persisted;
}

/** First successful observation establishes a baseline; historical rows are not updates. */
export function initializeSavedBaselines(stored: SavedSearch, observed: readonly {key: string; signatures: string[]}[], checkedAt: string): SavedSearch {
  let changed = false;
  const buildings = stored.buildings.map(building => {
    if (building.signatures.length) return building;
    const item = observed.find(item => item.key === building.key);
    if (!item?.signatures.length) return building;
    changed = true;
    return {...building, signatures: item.signatures, checkedAt};
  });
  return changed ? {...stored, buildings} : stored;
}
