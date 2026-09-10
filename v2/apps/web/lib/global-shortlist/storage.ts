import { defaults, validBudgetFilters, type BudgetFilters, type OverseasMarket } from './model';
export const GLOBAL_SAVED_KEY = 'signedprice_global_shortlist_v1';
export const GLOBAL_SAVED_EVENT = 'signedprice:global-shortlist';
export type SavedPlace = { market: OverseasMarket; key: string; name: string; signature: string; checkedAt: string };
export type GlobalSaved = { version: 1; filters: Record<OverseasMarket, BudgetFilters>; places: SavedPlace[] };
export function parseGlobalSaved(raw: string): GlobalSaved {
  const empty: GlobalSaved = { version: 1, filters: { singapore: defaults('singapore'), dubai: defaults('dubai'), tokyo: defaults('tokyo') }, places: [] };
  try {
    if (raw.length > 100_000) return empty;
    const value = JSON.parse(raw) as GlobalSaved;
    if (value.version !== 1 || !value.filters || !Array.isArray(value.places)) return empty;
    for (const market of ['singapore', 'dubai', 'tokyo'] as const) if (validBudgetFilters(value.filters[market], market)) empty.filters[market] = value.filters[market];
    const keys = new Set<string>();
    empty.places = value.places.filter(p => {
      if (!p || !['singapore', 'dubai', 'tokyo'].includes(p.market) || typeof p.key !== 'string' || !/^[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]{1,160}$/.test(p.key) || typeof p.name !== 'string' || p.name.length > 200 || !/^[a-f0-9]{64}$/.test(p.signature) || typeof p.checkedAt !== 'string' || !Number.isFinite(Date.parse(p.checkedAt))) return false;
      const key = `${p.market}:${p.key}`;
      if (keys.has(key) || [...keys].filter(k => k.startsWith(`${p.market}:`)).length >= 30) return false;
      keys.add(key); return true;
    });
    return empty;
  } catch { return empty; }
}
let volatileValue = '', sessionOnly = false;
export const readGlobalSaved = () => {
  if (sessionOnly) return volatileValue;
  try { return window.localStorage.getItem(GLOBAL_SAVED_KEY) ?? ''; } catch { return volatileValue; }
};
export function subscribeGlobalSaved(listener: () => void) {
  window.addEventListener('storage', listener); window.addEventListener(GLOBAL_SAVED_EVENT, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(GLOBAL_SAVED_EVENT, listener); };
}
export function writeGlobalSaved(value: GlobalSaved): boolean {
  volatileValue = JSON.stringify(value);
  try { window.localStorage.setItem(GLOBAL_SAVED_KEY, volatileValue); sessionOnly = false; } catch { sessionOnly = true; }
  window.dispatchEvent(new Event(GLOBAL_SAVED_EVENT));
  return !sessionOnly;
}
