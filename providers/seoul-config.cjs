const LOCATIONS = require('../location-catalog.js');

const SEOUL_DISTRICTS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.DISTRICTS).map(([code, record]) => [code, record.en])
));

const SEOUL_DISTRICT_SLUGS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.DISTRICTS).map(([code, record]) => [record.slug, code])
));

const DONG_SLUG_ALIASES = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.DONGS).map(([name, record]) => [name, record.slug])
));

const PROPERTY_TYPES = Object.freeze(['apartment','officetel','villa','detached']);

function isSupportedAreaCode(code) {
  return Object.prototype.hasOwnProperty.call(SEOUL_DISTRICTS, String(code || ''));
}
function isSupportedPropertyType(type) {
  return PROPERTY_TYPES.includes(String(type || ''));
}
function districtCodeFromSlug(slug) {
  return SEOUL_DISTRICT_SLUGS[String(slug || '').toLowerCase()] || null;
}
function districtSlugFromCode(code) {
  const target = String(code || '');
  for (const [slug, areaCode] of Object.entries(SEOUL_DISTRICT_SLUGS)) {
    if (areaCode === target) return slug;
  }
  return null;
}

module.exports = {
  SEOUL_DISTRICTS,
  SEOUL_DISTRICT_SLUGS,
  DONG_SLUG_ALIASES,
  PROPERTY_TYPES,
  isSupportedAreaCode,
  isSupportedPropertyType,
  districtCodeFromSlug,
  districtSlugFromCode
};
