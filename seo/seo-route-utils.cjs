const {
  DONG_SLUG_ALIASES,
  districtSlugFromCode,
  isSupportedPropertyType
} = require('../providers/seoul-config.cjs');

const SLUG_TO_DONG = Object.freeze(Object.fromEntries(
  Object.entries(DONG_SLUG_ALIASES).map(([dong, slug]) => [slug, dong])
));

function normalizeSegment(value) {
  return String(value || '').normalize('NFKC').trim();
}

function safelyDecode(value) {
  const text = normalizeSegment(value);
  try { return decodeURIComponent(text); } catch (_) { return text; }
}

function dongSlugFromName(dong) {
  const normalized = normalizeSegment(dong);
  if (!normalized) return '';
  return DONG_SLUG_ALIASES[normalized] || normalized;
}

function dongNameFromSlug(slug) {
  const normalized = safelyDecode(slug);
  if (!normalized || normalized.includes('/') || normalized.includes('..')) return null;
  if (SLUG_TO_DONG[normalized]) return SLUG_TO_DONG[normalized];
  // Only pass through non-curated Korean legal-dong style names. Never invent a romanization.
  if (/^[\p{Script=Hangul}0-9·._-]+$/u.test(normalized)) return normalized;
  return null;
}

function readableSlug(value, fallback = 'building') {
  const normalized = normalizeSegment(value)
    .toLocaleLowerCase('en-US')
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return normalized || fallback;
}

function stableSuffix(value) {
  const text = normalizeSegment(value).toLocaleLowerCase('en-US');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

function buildingSlug(building) {
  const name = building && building.buildingName;
  const key = building && building.buildingKey;
  if (!normalizeSegment(name) || !normalizeSegment(key)) return '';
  return `${readableSlug(name)}-${stableSuffix(key)}`;
}

function resolveBuildingSlug(buildings, slug) {
  const normalized = safelyDecode(slug);
  if (!normalized) return null;
  return (Array.isArray(buildings) ? buildings : []).find(item => buildingSlug(item) === normalized) || null;
}

function languagePrefix(lang) {
  return String(lang || '').toLowerCase().startsWith('zh') ? '/zh' : '';
}

function buildDongSeoUrl({ areaCode, dong, propertyType, lang = 'en' }) {
  const district = districtSlugFromCode(areaCode);
  const dongSlug = dongSlugFromName(dong);
  if (!district || !dongSlug || !isSupportedPropertyType(propertyType)) return '';
  return `${languagePrefix(lang)}/seoul/${encodeURIComponent(district)}/${encodeURIComponent(dongSlug)}/${encodeURIComponent(propertyType)}/`
    .replace(/%2F/gi, '/');
}

function buildBuildingSeoUrl({ areaCode, dong, propertyType, building, lang = 'en' }) {
  const base = buildDongSeoUrl({ areaCode, dong, propertyType, lang });
  const slug = buildingSlug(building);
  if (!base || !slug) return '';
  return `${base}${encodeURIComponent(slug)}/`;
}

module.exports = {
  dongSlugFromName,
  dongNameFromSlug,
  readableSlug,
  stableSuffix,
  buildingSlug,
  resolveBuildingSlug,
  buildDongSeoUrl,
  buildBuildingSeoUrl
};
