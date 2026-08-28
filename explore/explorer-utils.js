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
    const record = catalog && catalog.DONGS && catalog.DONGS[normalized];
    return record && record.slug ? record.slug : normalized;
  }

  function buildDongSeoUrl({ lawdCd, type, dong, lang = 'en' }) {
    const district = DISTRICT_SLUGS[String(lawdCd || '')];
    const dSlug = dongSlug(dong);
    if (!district || !['apartment','officetel','villa','detached'].includes(String(type || '')) || !dSlug) return '';
    const prefix = String(lang || '').toLowerCase().startsWith('zh') ? '/zh' : '';
    return `${prefix}/seoul/${encodeURIComponent(district)}/${encodeURIComponent(dSlug)}/${encodeURIComponent(type)}/`.replace(/%2F/gi, '/');
  }

  function buildExplorerDongUrl({ lawdCd, type, dong, lang = 'en' }) {
    const districtCode = String(lawdCd || '');
    const propertyType = String(type || '');
    const neighborhood = normalizeSegment(dong);
    if (!catalog?.DISTRICTS?.[districtCode] || !['apartment','officetel','villa','detached'].includes(propertyType) || !neighborhood) return '';
    const prefix = String(lang || '').toLowerCase().startsWith('zh') ? '/zh' : '';
    const params = new URLSearchParams({ lawdCd:districtCode, type:propertyType, dong:neighborhood });
    return `${prefix}/explore/?${params.toString()}`;
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

  function numericBudgetValue(value) {
    if (value == null || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function budgetFitForDong(item, { maxRent = 0, maxDeposit = 0 } = {}) {
    const rentLimit = Math.max(0, Number(maxRent) || 0);
    const depositLimit = Math.max(0, Number(maxDeposit) || 0);
    const bands = Array.isArray(item?.depositBands) ? item.depositBands : [];
    const matching = bands.filter(band => {
      const rent = numericBudgetValue(band.medianMonthlyRentWon);
      const deposit = numericBudgetValue(band.medianDepositWon);
      if (rentLimit && (rent === null || rent > rentLimit)) return false;
      if (depositLimit && (deposit === null || deposit > depositLimit)) return false;
      return true;
    });
    if (bands.length) {
      const representativeBand = [...matching]
        .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0] || null;
      return {
        fits:matching.length > 0,
        matchingContractCount:matching.reduce((sum, band) => sum + Number(band.count || 0), 0),
        representativeBand
      };
    }
    const rent = numericBudgetValue(item?.contextualMedianMonthlyRentWon ?? item?.medianMonthlyRentWon);
    const deposit = numericBudgetValue(item?.contextualMedianDepositWon ?? item?.medianDepositWon);
    const fits = (!rentLimit || (rent !== null && rent <= rentLimit)) &&
      (!depositLimit || (deposit !== null && deposit <= depositLimit));
    return {
      fits,
      matchingContractCount:fits ? Number(item?.contractCount || 0) : 0,
      representativeBand:null
    };
  }

  function filterDongsByBudget(items, limits = {}) {
    const source = Array.isArray(items) ? items : [];
    const rentLimit = Math.max(0, Number(limits.maxRent) || 0);
    const depositLimit = Math.max(0, Number(limits.maxDeposit) || 0);
    if (!rentLimit && !depositLimit) return [...source];

    return source
      .map((item, index) => ({ item, index, fit:budgetFitForDong(item, limits) }))
      .filter(entry => entry.fit.fits)
      .sort((a, b) =>
        b.fit.matchingContractCount - a.fit.matchingContractCount || a.index - b.index
      )
      .map(entry => entry.item);
  }

  function propertyTypeLabel(type, locale = 'en') {
    return catalog ? catalog.propertyTypeLabel(type, locale) : String(type || '');
  }

  function localizedDongParts(dong, locale = 'en') {
    const korean = normalizeSegment(dong);
    const primary = catalog ? catalog.dongLabel(korean, locale, { includeKorean:false }) : korean;
    const secondary = primary && primary !== korean ? korean : '';
    return Object.freeze({
      primary:primary || korean,
      korean:secondary,
      breakKorean:Boolean(secondary && (String(primary).length >= 17 || String(primary).length + secondary.length >= 24))
    });
  }

  function areaSnapshotForDong(data, dong) {
    const selectedDong = normalizeSegment(dong);
    const dongs = Array.isArray(data && data.dongs) ? data.dongs : [];
    const dongSummary = dongs.find(item => normalizeSegment(item && item.dong) === selectedDong);
    if (!selectedDong || !dongSummary) return null;
    const areaSummary = data && data.summary || {};
    const buildings = (Array.isArray(data && data.buildings) ? data.buildings : [])
      .filter(item => normalizeSegment(item && item.dong) === selectedDong);
    return Object.freeze({
      ...(data || {}),
      dong:selectedDong,
      summary:Object.freeze({
        ...dongSummary,
        totalContracts:Number(dongSummary.totalContracts || dongSummary.contractCount || 0),
        monthsUsed:Number(areaSummary.monthsUsed || 6),
        dataThroughMonth:areaSummary.dataThroughMonth || null
      }),
      buildings:Object.freeze(buildings)
    });
  }

  function supportsZhIndexing(areaCode) {
    return Boolean(catalog && catalog.supportsZhIndexing(areaCode));
  }

  function initialViewForWidth(width) {
    const viewportWidth = Number(width);
    return Number.isFinite(viewportWidth) && viewportWidth > 0 && viewportWidth <= 760 ? 'list' : 'map';
  }

  function buildLabeledTableRow(cells) {
    const values = Array.isArray(cells) ? cells : [];
    const escapeLabel = value => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#39;');
    return `<tr>${values.map(cell => `<td data-label="${escapeLabel(cell && cell.label)}">${String(cell && cell.html || '')}</td>`).join('')}</tr>`;
  }

  return {
    buildDongSeoUrl,
    buildExplorerDongUrl,
    buildBuildingSeoUrl,
    buildBuildingDetailUrl,
    budgetFitForDong,
    filterDongsByBudget,
    areaSnapshotForDong,
    localizedDongParts,
    propertyTypeLabel,
    supportsZhIndexing,
    initialViewForWidth,
    buildLabeledTableRow,
    stableSuffix
  };
});
