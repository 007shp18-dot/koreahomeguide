(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGLocations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function freezeRecords(records) {
    Object.values(records).forEach(Object.freeze);
    return Object.freeze(records);
  }

  const DISTRICTS = freezeRecords({
    '11680':{ slug:'gangnam-gu', ko:'강남구', en:'Gangnam-gu', 'zh-CN':'江南区' },
    '11440':{ slug:'mapo-gu', ko:'마포구', en:'Mapo-gu', 'zh-CN':'麻浦区' },
    '11170':{ slug:'yongsan-gu', ko:'용산구', en:'Yongsan-gu', 'zh-CN':'龙山区' },
    '11200':{ slug:'seongdong-gu', ko:'성동구', en:'Seongdong-gu', 'zh-CN':'城东区' },
    '11560':{ slug:'yeongdeungpo-gu', ko:'영등포구', en:'Yeongdeungpo-gu', 'zh-CN':'永登浦区' },
    '11620':{ slug:'gwanak-gu', ko:'관악구', en:'Gwanak-gu', 'zh-CN':'冠岳区' },
    '11230':{ slug:'dongdaemun-gu', ko:'동대문구', en:'Dongdaemun-gu', 'zh-CN':'东大门区' },
    '11410':{ slug:'seodaemun-gu', ko:'서대문구', en:'Seodaemun-gu', 'zh-CN':'西大门区' },
    '11290':{ slug:'seongbuk-gu', ko:'성북구', en:'Seongbuk-gu', 'zh-CN':'城北区' },
    '11215':{ slug:'gwangjin-gu', ko:'광진구', en:'Gwangjin-gu', 'zh-CN':'广津区' }
  });

  const DONGS = freezeRecords({
    '역삼동':{ slug:'yeoksam-dong', en:'Yeoksam-dong', 'zh-CN':'驿三洞' },
    '논현동':{ slug:'nonhyeon-dong', en:'Nonhyeon-dong', 'zh-CN':'论岘洞' },
    '대치동':{ slug:'daechi-dong', en:'Daechi-dong', 'zh-CN':'大峙洞' },
    '삼성동':{ slug:'samseong-dong', en:'Samseong-dong', 'zh-CN':'三成洞' },
    '청담동':{ slug:'cheongdam-dong', en:'Cheongdam-dong', 'zh-CN':'清潭洞' },
    '연남동':{ slug:'yeonnam-dong', en:'Yeonnam-dong', 'zh-CN':'延南洞' },
    '서교동':{ slug:'seogyo-dong', en:'Seogyo-dong', 'zh-CN':'西桥洞' },
    '망원동':{ slug:'mangwon-dong', en:'Mangwon-dong', 'zh-CN':'望远洞' },
    '합정동':{ slug:'hapjeong-dong', en:'Hapjeong-dong', 'zh-CN':'合井洞' },
    '공덕동':{ slug:'gongdeok-dong', en:'Gongdeok-dong', 'zh-CN':'孔德洞' },
    '아현동':{ slug:'ahyeon-dong', en:'Ahyeon-dong', 'zh-CN':'阿岘洞' },
    '이태원동':{ slug:'itaewon-dong', en:'Itaewon-dong', 'zh-CN':'梨泰院洞' },
    '한남동':{ slug:'hannam-dong', en:'Hannam-dong', 'zh-CN':'汉南洞' },
    '후암동':{ slug:'huam-dong', en:'Huam-dong', 'zh-CN':'厚岩洞' },
    '보광동':{ slug:'bogwang-dong', en:'Bogwang-dong', 'zh-CN':'普光洞' },
    '성수동1가':{ slug:'seongsu-dong-1-ga', en:'Seongsu-dong 1-ga', 'zh-CN':'圣水洞1街' },
    '성수동2가':{ slug:'seongsu-dong-2-ga', en:'Seongsu-dong 2-ga', 'zh-CN':'圣水洞2街' },
    '옥수동':{ slug:'oksu-dong', en:'Oksu-dong', 'zh-CN':'玉水洞' },
    '금호동1가':{ slug:'geumho-dong-1-ga', en:'Geumho-dong 1-ga', 'zh-CN':'金湖洞1街' },
    '금호동2가':{ slug:'geumho-dong-2-ga', en:'Geumho-dong 2-ga', 'zh-CN':'金湖洞2街' },
    '금호동3가':{ slug:'geumho-dong-3-ga', en:'Geumho-dong 3-ga', 'zh-CN':'金湖洞3街' },
    '금호동4가':{ slug:'geumho-dong-4-ga', en:'Geumho-dong 4-ga', 'zh-CN':'金湖洞4街' },
    '여의도동':{ slug:'yeouido-dong', en:'Yeouido-dong', 'zh-CN':'汝矣岛洞' },
    '당산동':{ slug:'dangsan-dong', en:'Dangsan-dong', 'zh-CN':'堂山洞' },
    '문래동':{ slug:'mullae-dong', en:'Mullae-dong', 'zh-CN':'文来洞' },
    '영등포동':{ slug:'yeongdeungpo-dong', en:'Yeongdeungpo-dong', 'zh-CN':'永登浦洞' }
  });

  const PROPERTY_TYPES = freezeRecords({
    apartment:{ ko:'아파트', en:'Apartment', 'zh-CN':'公寓' },
    officetel:{ ko:'오피스텔', en:'Officetel', 'zh-CN':'Officetel' },
    villa:{ ko:'연립·다세대', en:'Low-rise multifamily / Villa', 'zh-CN':'低层多户住宅 / Villa' },
    detached:{ ko:'단독·다가구', en:'Detached & multi-unit house', 'zh-CN':'独栋及多户住宅' },
    studio:{ ko:'원룸', en:'Studio / One-room', 'zh-CN':'单间 / One-room' }
  });

  function localeKey(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }

  function withKorean(primary, korean, locale, includeKorean) {
    if (includeKorean === false || !korean || primary === korean) return primary || korean;
    return localeKey(locale) === 'zh-CN' ? `${primary}（${korean}）` : `${primary} (${korean})`;
  }

  function display(record, locale, fallback, options) {
    if (!record) return String(fallback || '');
    const key = localeKey(locale);
    const primary = record[key] || record.en || record.ko || String(fallback || '');
    return withKorean(primary, record.ko || fallback, key, !options || options.includeKorean !== false);
  }

  function districtLabel(code, locale, options) {
    return display(DISTRICTS[String(code || '')], locale, code, options);
  }

  function dongLabel(koreanName, locale, options) {
    const name = String(koreanName || '');
    const record = DONGS[name];
    return record ? display({ ...record, ko:name }, locale, name, options) : name;
  }

  function propertyTypeLabel(type, locale, options) {
    const key = String(type || '');
    return display(PROPERTY_TYPES[key], locale, key, options);
  }

  function districtSlug(code) {
    const record = DISTRICTS[String(code || '')];
    return record ? record.slug : '';
  }

  return Object.freeze({
    DISTRICTS, DONGS, PROPERTY_TYPES,
    districtLabel, dongLabel, propertyTypeLabel, districtSlug, localeKey
  });
});
