export type DiscoveryMarket = 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export type RecentPlace = { market: DiscoveryMarket; key: string; name: string; href: string; viewedAt: string };
export type PlaceNote = { market: DiscoveryMarket; key: string; text: string };
export type DiscoveryJournal = { version: 1; recent: RecentPlace[]; notes: PlaceNote[] };
export const JOURNAL_KEY = 'signedprice_discovery_journal_v1';
const JOURNAL_EVENT = 'signedprice:discovery-journal';
export const DISCOVERY_MARKETS: readonly DiscoveryMarket[] = ['seoul', 'singapore', 'dubai', 'tokyo'];
export const EXPLORE_PATHS: Record<DiscoveryMarket, string> = {
  seoul: '/kr/seoul/explore/', singapore: '/sg/singapore/explore/',
  dubai: '/ae/dubai/explore/', tokyo: '/jp/tokyo/explore/',
};
const publicFilters = new Set([
  'area', 'areaBand', 'areaMin', 'areaMax', 'district', 'neighborhood', 'building', 'buildingId', 'contractType',
  'transaction', 'propertyType', 'housing', 'stage', 'completion', 'q', 'region',
  'project', 'city', 'neighbourhood', 'type', 'minArea', 'maxArea', 'year', 'quarter',
  'page', 'release', 'sort', 'period', 'from', 'to', 'budgetMax', 'yieldMin',
  'buildingPage', 'view', 'station', 'stationDistance', 'school', 'schoolDistance',
]);
const marketValid = (value: unknown): value is DiscoveryMarket => typeof value === 'string' && DISCOVERY_MARKETS.includes(value as DiscoveryMarket);
const keyValid = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 240 && !/[\u0000-\u001f\u007f]/u.test(value);
const emptyJournal = (): DiscoveryJournal => ({ version: 1, recent: [], notes: [] });

export function normalizeExploreHref(market: DiscoveryMarket, href: string): string | null {
  if (!marketValid(market) || typeof href !== 'string' || href.length > 2_000 || !href.startsWith('/') || href.startsWith('//') || /[\\\u0000-\u0020\u007f]/u.test(href)) return null;
  try {
    const neutral = href.replace(/^\/(?:ko|zh-cn)(?=\/)/u, '');
    const url = new URL(neutral, 'https://signedprice.invalid');
    if (url.origin !== 'https://signedprice.invalid' || !url.pathname.startsWith(EXPLORE_PATHS[market])) return null;
    const decodedPath = decodeURIComponent(url.pathname);
    if (/[\\\u0000-\u0020\u007f]/u.test(decodedPath) || decodedPath.includes('//') || decodedPath.split('/').some(part => part === '.' || part === '..')) return null;
    const query = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (publicFilters.has(key) && value.length <= 240 && !/[\u0000-\u001f\u007f]/u.test(value)) query.set(key, value);
    }
    return url.pathname + (query.size ? `?${query}` : '');
  } catch { return null; }
}

function parseRecent(value: unknown): RecentPlace | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as RecentPlace;
  if (!marketValid(item.market) || !keyValid(item.key) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 || typeof item.viewedAt !== 'string' || !Number.isFinite(Date.parse(item.viewedAt))) return null;
  const href = normalizeExploreHref(item.market, item.href);
  return href ? { market: item.market, key: item.key, name: item.name, href, viewedAt: item.viewedAt } : null;
}
function parseNote(value: unknown): PlaceNote | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as PlaceNote;
  return marketValid(item.market) && keyValid(item.key) && typeof item.text === 'string' && item.text.length <= 1_000
    ? { market: item.market, key: item.key, text: item.text } : null;
}

export function parseJournal(raw: string): DiscoveryJournal {
  const state = emptyJournal();
  if (raw.length > 250_000) return state;
  try {
    const value = JSON.parse(raw) as DiscoveryJournal | null;
    if (!value || value.version !== 1 || !Array.isArray(value.recent) || !Array.isArray(value.notes)) return state;
    const seen = new Set<string>();
    for (const input of value.recent.slice(0, 100)) {
      const item = parseRecent(input);
      if (!item || seen.has(`${item.market}:${item.key}`)) continue;
      seen.add(`${item.market}:${item.key}`); state.recent.push(item);
      if (state.recent.length === 12) break;
    }
    seen.clear();
    for (const input of value.notes.slice(0, 240)) {
      const item = parseNote(input);
      if (!item || !item.text.trim() || seen.has(`${item.market}:${item.key}`)) continue;
      seen.add(`${item.market}:${item.key}`); state.notes.push(item);
      if (state.notes.length === 120) break;
    }
    return state;
  } catch { return state; }
}

export function withRecentPlace(state: DiscoveryJournal, value: RecentPlace): DiscoveryJournal {
  const place = parseRecent(value);
  if (!place) return state;
  return { ...state, recent: [place, ...state.recent.filter(p => p.market !== place.market || p.key !== place.key)].slice(0, 12) };
}

export function withPlaceNote(state: DiscoveryJournal, value: PlaceNote): DiscoveryJournal | null {
  const note = parseNote(value);
  if (!note) return null;
  const remaining = state.notes.filter(n => n.market !== note.market || n.key !== note.key);
  if (!note.text.trim()) return { ...state, notes: remaining };
  if (remaining.length >= 120) return null;
  return { ...state, notes: [...remaining, note] };
}

let sessionValue: string | null = null;
export const journalIsSessionOnly = () => sessionValue !== null;
export function readJournal(): string {
  if (sessionValue !== null) return sessionValue;
  try { return window.localStorage.getItem(JOURNAL_KEY) ?? ''; } catch { return ''; }
}
export function subscribeJournal(listener: () => void): () => void {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === null || event.key === JOURNAL_KEY) { sessionValue = null; listener(); }
  };
  window.addEventListener('storage', storageChanged);
  window.addEventListener(JOURNAL_EVENT, listener);
  return () => { window.removeEventListener('storage', storageChanged); window.removeEventListener(JOURNAL_EVENT, listener); };
}
export function writeJournal(state: DiscoveryJournal): boolean {
  const raw = JSON.stringify(parseJournal(JSON.stringify(state)));
  let persisted = true;
  try { window.localStorage.setItem(JOURNAL_KEY, raw); sessionValue = null; }
  catch { sessionValue = raw; persisted = false; }
  window.dispatchEvent(new Event(JOURNAL_EVENT));
  return persisted;
}
