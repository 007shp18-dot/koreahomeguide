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

// Prefer a supplied English name when the source actually has one. Never
// transliterate: an invented romanization gets brand names wrong exactly where
// the search value sits (푸르지오 = "Prugio", not "pureujio").
function slugSourceName(building) {
  const korean = normalizeSegment(building && building.buildingName);
  const english = normalizeSegment(building && building.displayBuildingNameEn);
  if (!english || english === korean) return korean;
  const hasLatin = /\p{Script=Latin}/u.test(english);
  const hasHangul = /\p{Script=Hangul}/u.test(english);
  return hasLatin && !hasHangul ? english : korean;
}

function buildingSlug(building) {
  const name = slugSourceName(building);
  const key = building && building.buildingKey;
  if (!name || !normalizeSegment(key)) return '';
  return `${readableSlug(name)}-${stableSuffix(key)}`;
}

// The trailing suffix is the stable identity; the readable half is cosmetic.
// Matching on the suffix keeps old links alive if the readable half ever changes.
function suffixOfSlug(slug) {
  const match = /-([0-9a-f]{7})$/.exec(normalizeSegment(slug).toLocaleLowerCase('en-US'));
  return match ? match[1] : '';
}

// Same normalization resolveBuildingSlug applies, exported so a caller can ask
// "is the slug I was given already the canonical one?" without guessing.
function normalizeBuildingSlug(slug) {
  return safelyDecode(slug);
}

function resolveBuildingSlug(buildings, slug) {
  const normalized = safelyDecode(slug);
  if (!normalized) return null;
  const list = Array.isArray(buildings) ? buildings : [];
  const exact = list.find(item => buildingSlug(item) === normalized);
  if (exact) return exact;
  const suffix = suffixOfSlug(normalized);
  if (!suffix) return null;
  return list.find(item => stableSuffix(item && item.buildingKey) === suffix) || null;
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
  slugSourceName,
  buildingSlug,
  suffixOfSlug,
  normalizeBuildingSlug,
  resolveBuildingSlug,
  buildDongSeoUrl,
  buildBuildingSeoUrl
};
