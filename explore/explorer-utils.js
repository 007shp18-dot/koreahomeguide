(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGExplorer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
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

  function budgetFitForDong(item, { maxRent = 0, maxDeposit = 0 } = {}) {
    const rentLimit = Math.max(0, Number(maxRent) || 0);
    const depositLimit = Math.max(0, Number(maxDeposit) || 0);
    const bands = Array.isArray(item && item.depositBands) ? item.depositBands : [];
    const matchesLimit = band => {
      const rent = Number(band && band.medianMonthlyRentWon);
      const deposit = Number(band && band.medianDepositWon);
      if (rentLimit && (!Number.isFinite(rent) || rent > rentLimit)) return false;
      if (depositLimit && (!Number.isFinite(deposit) || deposit > depositLimit)) return false;
      return true;
    };

    if (bands.length) {
      const matches = bands.filter(matchesLimit);
      if (!matches.length) return { fits:false, matchingContractCount:0, representativeBand:null };
      const ranked = [...matches].sort((a, b) => {
        const countDelta = Number(b && b.count || 0) - Number(a && a.count || 0);
        if (countDelta) return countDelta;
        const rentDelta = Number(a && a.medianMonthlyRentWon || Infinity) - Number(b && b.medianMonthlyRentWon || Infinity);
        if (rentDelta) return rentDelta;
        return Number(a && a.medianDepositWon || Infinity) - Number(b && b.medianDepositWon || Infinity);
      });
      return {
        fits:true,
        matchingContractCount:matches.reduce((sum, band) => sum + Math.max(0, Number(band && band.count) || 0), 0),
        representativeBand:ranked[0] || null
      };
    }

    const rentRaw = item && (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
    const depositRaw = item && (item.contextualMedianDepositWon ?? item.medianDepositWon);
    const rent = rentRaw == null || rentRaw === '' ? NaN : Number(rentRaw);
    const deposit = depositRaw == null || depositRaw === '' ? NaN : Number(depositRaw);
    if (rentLimit && (!Number.isFinite(rent) || rent > rentLimit)) return { fits:false, matchingContractCount:0, representativeBand:null };
    if (depositLimit && (!Number.isFinite(deposit) || deposit > depositLimit)) return { fits:false, matchingContractCount:0, representativeBand:null };
    return {
      fits:true,
      matchingContractCount:Math.max(0, Number(item && item.contractCount) || 0),
      representativeBand:Number.isFinite(rent) || Number.isFinite(deposit)
        ? { medianMonthlyRentWon:Number.isFinite(rent) ? rent : null, medianDepositWon:Number.isFinite(deposit) ? deposit : null, count:Number(item && item.contractCount) || 0 }
        : null
    };
  }

  function rankDongsByBudget(items, limits = {}) {
    const rows = Array.isArray(items) ? items : [];
    const rentLimit = Math.max(0, Number(limits && limits.maxRent) || 0);
    const depositLimit = Math.max(0, Number(limits && limits.maxDeposit) || 0);
    if (!rentLimit && !depositLimit) return [...rows];
    return rows
      .map((item, index) => ({ item, index, fit:budgetFitForDong(item, { maxRent:rentLimit, maxDeposit:depositLimit }) }))
      .filter(entry => entry.fit.fits)
      .sort((a, b) => {
        const evidenceDelta = b.fit.matchingContractCount - a.fit.matchingContractCount;
        if (evidenceDelta) return evidenceDelta;
        const totalDelta = Number(b.item && b.item.contractCount || 0) - Number(a.item && a.item.contractCount || 0);
        if (totalDelta) return totalDelta;
        const ar = Number(a.fit.representativeBand && a.fit.representativeBand.medianMonthlyRentWon);
        const br = Number(b.fit.representativeBand && b.fit.representativeBand.medianMonthlyRentWon);
        if (Number.isFinite(ar) && Number.isFinite(br) && ar !== br) return ar - br;
        return a.index - b.index;
      })
      .map(entry => entry.item);
  }

  function filterDongsByBudget(items, limits = {}) {
    return rankDongsByBudget(items, limits);
  }

  function propertyTypeLabel(type) {
    return ({ apartment:'Apartment', officetel:'Officetel', villa:'Villa / Low-rise (연립·다세대)', detached:'Detached / Multi-family' })[type] || type;
  }

  return {
    buildDongSeoUrl,
    buildBuildingSeoUrl,
    buildBuildingDetailUrl,
    filterDongsByBudget,
    budgetFitForDong,
    rankDongsByBudget,
    propertyTypeLabel,
    stableSuffix
  };
});
