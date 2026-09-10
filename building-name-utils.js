(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGBuildingNames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SAFE_TOKENS = Object.freeze({
    '푸르지오시티':'Prugio City',
    'e편한세상':'e-Pyeonhansesang',
    '롯데캐슬':'Lotte Castle',
    '래미안':'Raemian',
    '푸르지오':'Prugio',
    '힐스테이트':'Hillstate',
    '아이파크':'I-PARK',
    '더샵':'The Sharp',
    '센트럴':'Central',
    '시티':'City',
    '자이':'Xi',
    '마포':'Mapo',
    '강남':'Gangnam',
    '서초':'Seocho',
    '송파':'Songpa',
    '용산':'Yongsan',
    '성수':'Seongsu',
    '여의도':'Yeouido',
    '청담':'Cheongdam',
    '삼성':'Samseong',
    '역삼':'Yeoksam',
    '논현':'Nonhyeon',
    '한남':'Hannam',
    '이태원':'Itaewon',
    '합정':'Hapjeong',
    '망원':'Mangwon',
    '연남':'Yeonnam',
    '공덕':'Gongdeok',
    '왕십리':'Wangsimni',
    '홍대':'Hongdae',
    '신촌':'Sinchon',
    '잠실':'Jamsil'
  });
  const TOKENS = Object.keys(SAFE_TOKENS).sort((a, b) => b.length - a.length);

  function normalizeName(name) {
    return String(name || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  function containsHangul(value) {
    return /[\u3131-\u318E\uAC00-\uD7A3]/.test(value);
  }

  function safeLatinDisplay(name) {
    const source = normalizeName(name);
    if (!source || !containsHangul(source)) return source;
    const parts = [];
    let index = 0;
    while (index < source.length) {
      const match = TOKENS.find(token => source.startsWith(token, index));
      if (match) {
        parts.push(SAFE_TOKENS[match]);
        index += match.length;
        continue;
      }
      const char = source[index];
      if (/\s/.test(char)) { index += 1; continue; }
      if (/[A-Za-z0-9()\-_.]/.test(char)) {
        let end = index + 1;
        while (end < source.length && /[A-Za-z0-9()\-_.]/.test(source[end])) end += 1;
        parts.push(source.slice(index, end));
        index = end;
        continue;
      }
      // Unknown Hangul or other text: do not guess a transliteration/translation.
      return '';
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function getBuildingNameDisplay(name, lang) {
    const official = normalizeName(name);
    const latin = safeLatinDisplay(official);
    const canUseLatin = Boolean(latin && latin !== official && containsHangul(official));
    return {
      primary: canUseLatin ? latin : official,
      secondary: canUseLatin ? official : '',
      officialNameKo: containsHangul(official) ? official : '',
      displayNameEn: canUseLatin ? latin : official,
      displayNameZh: canUseLatin ? latin : official,
      lang: String(lang || 'en')
    };
  }

  return { normalizeName, safeLatinDisplay, getBuildingNameDisplay };
});
