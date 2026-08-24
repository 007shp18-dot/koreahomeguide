const SEOUL_DISTRICTS = Object.freeze({
  '11680':'Gangnam-gu',
  '11440':'Mapo-gu',
  '11170':'Yongsan-gu',
  '11200':'Seongdong-gu',
  '11560':'Yeongdeungpo-gu'
});
const PROPERTY_TYPES = Object.freeze(['apartment','officetel','villa']);

function isSupportedAreaCode(code) {
  return Object.prototype.hasOwnProperty.call(SEOUL_DISTRICTS, String(code || ''));
}
function isSupportedPropertyType(type) {
  return PROPERTY_TYPES.includes(String(type || ''));
}

module.exports = { SEOUL_DISTRICTS, PROPERTY_TYPES, isSupportedAreaCode, isSupportedPropertyType };
