(function(root, factory) {
  const catalog = typeof module === 'object' && module.exports
    ? require('../location-catalog.js')
    : root.KHGLocations;
  const api = factory(catalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGExplorer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(catalog) {
  const DISTRICT_SLUGS = Object.freeze({
    '11680':'gangnam-gu', '11440':'mapo-gu', '11170':'yongsan-gu', '11200':'seongdong-gu', '11560':'yeongdeungpo-gu', '11620':'gwanak-gu', '11230':'dongdaemun-gu', '11410':'seodaemun-gu', '11290':'seongbuk-gu', '11215':'gwangjin-gu'
  });
  const DONG_SLUGS = Object.freeze({
    '역삼동':'yeoksam-dong','논현동':'nonhyeon-dong','대치동':'daechi-dong','삼성동':'samseong-dong','청담동':'cheongdam-dong',
    '연남동':'yeonnam-dong','서교동':'seogyo-dong','망원동':'mangwon-dong','합정동':'hapjeong-dong','공덕동':'gongdeok-dong','아현동':'ahyeon-dong',
    '이태원동':'itaewon-dong','한남동':'hannam-dong','후암동':'huam-dong','보광동':'bogwang-dong',
    '성수동1가':'seongsu-dong-1-ga','성수동2가':'seongsu-dong-2-ga','옥수동':'oksu-dong',
    '금호동1가':'geumho-dong-1-ga','금호동2가':'geumho-dong-2-ga','금호동3가':'geumho-dong-3-ga','금호동4가':'geumho-dong-4-ga',
    '여의도동':'yeouido-dong','당산동':'dangsan-dong','문래동':'mullae-dong','영등포동':'yeongdeungpo-dong'
  });

  function normalizeSegment(value) {
    return String(value || '').normalize('NFKC').trim();
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

  function dongSlug(dong) {
    const normalized = normalizeSegment(dong);
    return DONG_SLUGS[normalized] || normalized;
  }

  function buildDongSeoUrl({ lawdCd, type, dong, lang = 'en' }) {
    const district = DISTRICT_SLUGS[String(lawdCd || '')];
    const dSlug = dongSlug(dong);
    if (!district || !['apartment','officetel','villa','detached'].includes(String(type || '')) || !dSlug) return '';
    const prefix = String(lang || '').toLowerCase().startsWith('zh') ? '/zh' : '';
    return `${prefix}/seoul/${encodeURIComponent(district)}/${encodeURIComponent(dSlug)}/${encodeURIComponent(type)}/`.replace(/%2F/gi, '/');
  }

  function buildBuildingSeoUrl({ lawdCd, type, dong, buildingName, buildingKey, lang = 'en' }) {
    const base = buildDongSeoUrl({ lawdCd, type, dong, lang });
    if (!base || !normalizeSegment(buildingName) || !normalizeSegment(buildingKey)) return '';
    const slug = `${readableSlug(buildingName)}-${stableSuffix(buildingKey)}`;
    return `${base}${encodeURIComponent(slug)}/`;
  }

  function buildBuildingDetailUrl({ lawdCd, type, dong = '', buildingKey }) {
    const params = new URLSearchParams({
      lawdCd:String(lawdCd || ''),
      type:String(type || '')
    });
    if (dong) params.set('dong', String(dong));
    params.set('buildingKey', String(buildingKey || ''));
    return `/explore/building/?${params.toString()}`;
  }

  function filterDongsByBudget(items, { maxRent = 0, maxDeposit = 0 } = {}) {
    const rentLimit = Math.max(0, Number(maxRent) || 0);
    const depositLimit = Math.max(0, Number(maxDeposit) || 0);
    return (Array.isArray(items) ? items : []).filter(item => {
      const bands = Array.isArray(item && item.depositBands) ? item.depositBands : [];
      if ((rentLimit || depositLimit) && bands.length) {
        return bands.some(band => {
          const rent = Number(band.medianMonthlyRentWon);
          const deposit = Number(band.medianDepositWon);
          if (rentLimit && (!Number.isFinite(rent) || rent > rentLimit)) return false;
          if (depositLimit && (!Number.isFinite(deposit) || deposit > depositLimit)) return false;
          return true;
        });
      }
      if (rentLimit) {
        const rawRent = item && (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
        if (rawRent == null || rawRent === '') return false;
        const rent = Number(rawRent);
        if (!Number.isFinite(rent) || rent > rentLimit) return false;
      }
      if (depositLimit) {
        const rawDeposit = item && (item.contextualMedianDepositWon ?? item.medianDepositWon);
        if (rawDeposit == null || rawDeposit === '') return false;
        const deposit = Number(rawDeposit);
        if (!Number.isFinite(deposit) || deposit > depositLimit) return false;
      }
      return true;
    });
  }

  function propertyTypeLabel(type, locale = 'en') {
    return catalog ? catalog.propertyTypeLabel(type, locale) : String(type || '');
  }

  return {
    buildDongSeoUrl,
    buildBuildingSeoUrl,
    buildBuildingDetailUrl,
    filterDongsByBudget,
    propertyTypeLabel,
    stableSuffix
  };
});
