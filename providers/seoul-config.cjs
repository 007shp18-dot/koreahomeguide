const SEOUL_DISTRICTS = Object.freeze({
  '11680':'Gangnam-gu',
  '11440':'Mapo-gu',
  '11170':'Yongsan-gu',
  '11200':'Seongdong-gu',
  '11560':'Yeongdeungpo-gu',
  '11620':'Gwanak-gu',
  '11230':'Dongdaemun-gu',
  '11410':'Seodaemun-gu',
  '11290':'Seongbuk-gu',
  '11215':'Gwangjin-gu'
});

const SEOUL_DISTRICT_SLUGS = Object.freeze({
  'gangnam-gu':'11680',
  'mapo-gu':'11440',
  'yongsan-gu':'11170',
  'seongdong-gu':'11200',
  'yeongdeungpo-gu':'11560',
  'gwanak-gu':'11620',
  'dongdaemun-gu':'11230',
  'seodaemun-gu':'11410',
  'seongbuk-gu':'11290',
  'gwangjin-gu':'11215'
});

const DONG_SLUG_ALIASES = Object.freeze({
  '역삼동':'yeoksam-dong',
  '논현동':'nonhyeon-dong',
  '대치동':'daechi-dong',
  '삼성동':'samseong-dong',
  '청담동':'cheongdam-dong',
  '연남동':'yeonnam-dong',
  '서교동':'seogyo-dong',
  '망원동':'mangwon-dong',
  '합정동':'hapjeong-dong',
  '공덕동':'gongdeok-dong',
  '아현동':'ahyeon-dong',
  '이태원동':'itaewon-dong',
  '한남동':'hannam-dong',
  '후암동':'huam-dong',
  '보광동':'bogwang-dong',
  '성수동1가':'seongsu-dong-1-ga',
  '성수동2가':'seongsu-dong-2-ga',
  '옥수동':'oksu-dong',
  '금호동1가':'geumho-dong-1-ga',
  '금호동2가':'geumho-dong-2-ga',
  '금호동3가':'geumho-dong-3-ga',
  '금호동4가':'geumho-dong-4-ga',
  '여의도동':'yeouido-dong',
  '당산동':'dangsan-dong',
  '문래동':'mullae-dong',
  '영등포동':'yeongdeungpo-dong'
});

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
