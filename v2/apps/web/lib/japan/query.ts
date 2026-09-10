import type { JapanFilters } from './repository.server';

export const TOKYO_CONDOMINIUM_TYPE = 'Pre-owned Condominiums, etc.';

// Explore opens on comparable apartment transactions. An explicit empty type
// still means all property types; the public API retains its existing defaults.
export function japanExploreQuery(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const query = japanPageQuery(params);
  if (!query.has('type')) query.set('type', TOKYO_CONDOMINIUM_TYPE);
  return query;
}

export const TOKYO_WARDS = [
  ['13101','Chiyoda'],['13102','Chuo'],['13103','Minato'],['13104','Shinjuku'],
  ['13105','Bunkyo'],['13106','Taito'],['13107','Sumida'],['13108','Koto'],
  ['13109','Shinagawa'],['13110','Meguro'],['13111','Ota'],['13112','Setagaya'],
  ['13113','Shibuya'],['13114','Nakano'],['13115','Suginami'],['13116','Toshima'],
  ['13117','Kita'],['13118','Arakawa'],['13119','Itabashi'],['13120','Nerima'],
  ['13121','Adachi'],['13122','Katsushika'],['13123','Edogawa'],
] as const;
export function parseJapanFilters(query: URLSearchParams): JapanFilters {
  for (const [key] of query) {
    if (!['city','year','quarter','q','type','minArea','maxArea','page','release'].includes(key)
      || query.getAll(key).length !== 1) throw new TypeError('invalid_query');
  }
  const numeric = (key: string) => {
    const raw = query.get(key);
    if (raw === null || raw === '') return null;
    if (!/^\d+(\.\d+)?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 100000) throw new TypeError('invalid_query');
    return Number(raw);
  };
  const minArea = numeric('minArea'); const maxArea = numeric('maxArea');
  const page = query.get('page') ?? '1';
  const q = query.get('q')?.trim() ?? '';
  const type = query.get('type') ?? '';
  const release = query.get('release');
  if (!/^[1-9]\d{0,3}$/.test(page) || q.length > 100 || type.length > 100
    || (minArea !== null && maxArea !== null && minArea > maxArea)
    || (release !== null && !/^jp-area-[a-f0-9-]{36}$/.test(release))) throw new TypeError('invalid_query');
  return { q, type, minArea, maxArea, page: Number(page), release };
}

// Attribution belongs to the page URL, not to the database filter contract.
// Preserve unknown parameters so the existing strict validation still catches typos.
export function japanPageQuery(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const query = new URLSearchParams();
  const attribution = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
    'gclid', 'dclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid', 'twclid', 'li_fat_id']);
  for (const [key, value] of Object.entries(params)) {
    if (attribution.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) value.forEach(item => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  return query;
}
