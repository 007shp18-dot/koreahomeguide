(function(root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGAcquisitionContext = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const GUIDES = [
    'wolse-vs-jeonse',
    'korea-rental-contract-checklist',
    'seoul-brokerage-fees',
    'before-you-sign',
    'rent-apartment-korea-foreigner',
    'korea-rental-scams',
    'seoul-officetel-rent',
    'korea-rent-deposit-protection-foreigners'
  ];
  const DISTRICTS = [
    ['gangnam-gu', 'Gangnam-gu', '11680'],
    ['mapo-gu', 'Mapo-gu', '11440'],
    ['yongsan-gu', 'Yongsan-gu', '11170'],
    ['seongdong-gu', 'Seongdong-gu', '11200'],
    ['yeongdeungpo-gu', 'Yeongdeungpo-gu', '11560'],
    ['gwanak-gu', 'Gwanak-gu', '11620'],
    ['dongdaemun-gu', 'Dongdaemun-gu', '11230'],
    ['seodaemun-gu', 'Seodaemun-gu', '11410'],
    ['seongbuk-gu', 'Seongbuk-gu', '11290'],
    ['gwangjin-gu', 'Gwangjin-gu', '11215']
  ];
  const PROPERTY_TYPES = ['apartment', 'officetel', 'villa'];
  const DONG_PROPERTY_TYPES = new Set([...PROPERTY_TYPES, 'detached']);
  const HUB_SOURCE_PATHS = Object.freeze([
    '/guides/',
    '/explore/',
    '/zh/guides/',
    '/zh/explore/'
  ]);
  const DIRECT_SOURCE_PATHS = Object.freeze([
    '/',
    '/zh/',
    '/tools/seoul-rent-check/',
    '/zh/tools/seoul-rent-check/'
  ]);

  const guideContexts = GUIDES.map(slug => ({
    path: `/guides/${slug}/`,
    kind: 'guide',
    slug
  }));
  const marketContexts = DISTRICTS.flatMap(([districtSlug, districtLabel, lawdCd]) =>
    PROPERTY_TYPES.map(propertyType => ({
      path: `/rent/${districtSlug}/${propertyType}/`,
      kind: 'market',
      districtSlug,
      districtLabel,
      lawdCd,
      propertyType
    }))
  );
  const ENTRY_CONTEXTS = Object.freeze(
    [...guideContexts, ...marketContexts].map(item => Object.freeze(item))
  );
  const contextByPath = new Map(ENTRY_CONTEXTS.map(item => [item.path, item]));
  const directSourcePaths = new Set(DIRECT_SOURCE_PATHS);
  const hubSourcePaths = new Set(HUB_SOURCE_PATHS);
  const districtBySlug = new Map(DISTRICTS.map(([districtSlug, , lawdCd]) => [districtSlug, lawdCd]));

  function normalizePath(pathname) {
    const raw = String(pathname || '').trim();
    if (!raw || !raw.startsWith('/')) return '';
    const path = raw.split(/[?#]/, 1)[0];
    return path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
  }

  function findEntryContext(pathname) {
    const path = normalizePath(pathname);
    const fixed = contextByPath.get(path);
    if (fixed) return fixed;
    if (hubSourcePaths.has(path)) return { path, kind: 'hub' };

    const match = path.match(/^(?:\/zh)?\/seoul\/([^/]+)\/([^/]+)\/([^/]+)\/$/);
    if (!match) return null;
    const [, districtSlug, rawDong, propertyType] = match;
    const lawdCd = districtBySlug.get(districtSlug);
    if (!lawdCd || !DONG_PROPERTY_TYPES.has(propertyType)) return null;

    let dong;
    try {
      dong = decodeURIComponent(rawDong).normalize('NFKC');
    } catch (_) {
      return null;
    }
    if (!dong || dong === '.' || dong === '..' || /[\/\\\u0000-\u001f\u007f]/.test(dong)) return null;
    const canonicalDong = encodeURIComponent(dong);
    const prefix = path.startsWith('/zh/') ? '/zh' : '';
    return {
      path: `${prefix}/seoul/${districtSlug}/${canonicalDong}/${propertyType}/`,
      kind: 'dong',
      districtSlug,
      lawdCd,
      propertyType
    };
  }

  function validatedEntrySource(sourcePage, lawdCd, propertyType) {
    const entry = findEntryContext(sourcePage);
    if (!entry) return '';
    if (entry.kind === 'market' || entry.kind === 'dong') {
      if (String(lawdCd || '') !== entry.lawdCd) return '';
      if (String(propertyType || '') !== entry.propertyType) return '';
    }
    return entry.path;
  }

  function validatedResultSource(sourcePage) {
    const normalized = normalizePath(sourcePage);
    if (directSourcePaths.has(normalized)) return normalized;
    const entry = findEntryContext(normalized);
    return entry ? entry.path : '';
  }

  return {
    ENTRY_CONTEXTS,
    DIRECT_SOURCE_PATHS,
    HUB_SOURCE_PATHS,
    normalizePath,
    findEntryContext,
    validatedEntrySource,
    validatedResultSource
  };
});
