const LOCATIONS = require('../location-catalog.js');

const SEOUL_DISTRICTS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.RENT_CHECK_DISTRICTS).map(([code, record]) => [code, record.en])
));

const RENT_CHECK_DISTRICTS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.RENT_CHECK_DISTRICTS).map(([code, record]) => [code, record.en])
));

const SEOUL_MARKET_DISTRICTS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.DISTRICTS).map(([code, record]) => [code, record.en])
));

const SEOUL_DISTRICT_SLUGS = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.RENT_CHECK_DISTRICTS).map(([code, record]) => [record.slug, code])
));

const DONG_SLUG_ALIASES = Object.freeze(Object.fromEntries(
  Object.entries(LOCATIONS.DONGS).map(([name, record]) => [name, record.slug])
));

const PROPERTY_TYPES = Object.freeze(['apartment','officetel','villa','detached']);
const ZH_INDEXABLE_DISTRICT_CODES = LOCATIONS.ZH_INDEXABLE_DISTRICT_CODES;

const SEOUL_DONGS_BY_DISTRICT = Object.freeze({
  '11680':Object.freeze(['역삼동','논현동','대치동','삼성동','청담동']),
  '11440':Object.freeze(['연남동','서교동','망원동','합정동','공덕동','아현동']),
  '11170':Object.freeze(['이태원동','한남동','후암동','보광동']),
  '11200':Object.freeze(['성수동1가','성수동2가','옥수동','금호동1가','금호동2가','금호동3가','금호동4가']),
  '11560':Object.freeze(['여의도동','당산동','문래동','영등포동'])
});

function isSupportedAreaCode(code) {
  return Object.prototype.hasOwnProperty.call(SEOUL_DISTRICTS, String(code || ''));
}
function isRentCheckAreaCode(code) {
  return Object.prototype.hasOwnProperty.call(RENT_CHECK_DISTRICTS, String(code || ''));
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

function supportsZhIndexing(code) {
  return LOCATIONS.supportsZhIndexing(code);
}

module.exports = {
  SEOUL_DISTRICTS,
  SEOUL_MARKET_DISTRICTS,
  RENT_CHECK_DISTRICTS,
  SEOUL_DISTRICT_SLUGS,
  DONG_SLUG_ALIASES,
  PROPERTY_TYPES,
  ZH_INDEXABLE_DISTRICT_CODES,
  SEOUL_DONGS_BY_DISTRICT,
  isSupportedAreaCode,
  isRentCheckAreaCode,
  isSupportedPropertyType,
  districtCodeFromSlug,
  districtSlugFromCode,
  supportsZhIndexing
};
