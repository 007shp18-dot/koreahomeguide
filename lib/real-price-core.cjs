const { fetchWithRetry, DEFAULT_UPSTREAM_TIMEOUT_MS } = require('./api-guard.cjs');
const { getRuntimeCache } = require('./runtime-cache.cjs');

const MONTH_CACHE_TTL_MS = 10 * 60 * 1000;
const MONTH_CACHE_MAX_ENTRIES = 48;
const RUNTIME_CACHE_TTL_SECONDS = 24 * 60 * 60;
const RUNTIME_CACHE_TAG = 'molit-month';
const monthCaches = new WeakMap();

function decodeXml(text) {
  return String(text || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? decodeXml(m[1].trim()) : '';
}

function normalizeServiceKey(raw) {
  let serviceKey = String(raw || '').trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(serviceKey)) serviceKey = decodeURIComponent(serviceKey);
  } catch (_) {}
  return serviceKey;
}

function completedMonths(referenceDate, count) {
  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
  const months = [];
  for (let offset = 1; offset <= count; offset += 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function endpointForType(type) {
  const endpoints = {
    apartment: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
    officetel: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
    villa: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
    detached: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent'
  };
  return endpoints[type] || null;
}

function saleEndpointForType(type) {
  if (type === 'apartment') {
    return 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
  }
  return null;
}

function parseItems(xml, type) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return blocks.map(block => {
    const year = tag(block, 'dealYear');
    const month = tag(block, 'dealMonth');
    const day = tag(block, 'dealDay');
    const buildingName = tag(block, 'aptNm') || tag(block, 'offiNm') || tag(block, 'mhouseNm') || tag(block, 'buildingName') || '';
    const dong = tag(block, 'umdNm') || '';
    const building = buildingName || dong || '-';
    const area = tag(block, 'excluUseAr') || tag(block, 'excluUseArea') || tag(block, 'totalFloorAr') || '';
    const deposit = tag(block, 'deposit') || tag(block, 'depositAmt') || '0';
    const monthlyRent = tag(block, 'monthlyRent') || tag(block, 'monthlyRentAmt') || '0';
    return {
      building,
      buildingName,
      dong,
      area,
      deposit,
      monthlyRent,
      contractTerm: tag(block, 'contractTerm') || '',
      contractType: tag(block, 'contractType') || '',
      useRRRight: tag(block, 'useRRRight') || '',
      preDeposit: tag(block, 'preDeposit') || '',
      preMonthlyRent: tag(block, 'preMonthlyRent') || '',
      houseType: tag(block, 'houseType') || '',
      contractDate: year && month && day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '',
      type
    };
  });
}

function parseSaleItems(xml, type = 'apartment') {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return blocks.map(block => {
    const year = tag(block, 'dealYear');
    const month = tag(block, 'dealMonth');
    const day = tag(block, 'dealDay');
    const buildingName = tag(block, 'aptNm') || tag(block, 'buildingName') || '';
    const dong = tag(block, 'umdNm') || '';
    const area = tag(block, 'excluUseAr') || tag(block, 'excluUseArea') || '';
    const dealAmount = tag(block, 'dealAmount') || '0';
    return {
      building: buildingName || dong || '-',
      buildingName,
      dong,
      area,
      dealAmount,
      floor: tag(block, 'floor') || '',
      cancelled: Boolean((tag(block, 'cdealType') || '').trim()),
      cancelDate: tag(block, 'cdealDay') || '',
      contractDate: year && month && day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '',
      type
    };
  });
}

async function fetchPagedXml({ endpoint, serviceKey, lawdCd, dealYmd, fetchImpl = fetch, pageSize = 1000, parser }) {
  async function fetchPage(pageNo) {
    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: String(lawdCd),
      DEAL_YMD: String(dealYmd),
      numOfRows: String(pageSize),
      pageNo: String(pageNo)
    });
    const upstream = await fetchWithRetry(fetchImpl, `${endpoint}?${params.toString()}`, {
      headers: { Accept: 'application/xml,text/xml,*/*' }
    }, DEFAULT_UPSTREAM_TIMEOUT_MS);
    const xml = await upstream.text();
    if (!upstream.ok) throw new Error(`Public API returned HTTP ${upstream.status}.`);
    const resultCode = tag(xml, 'resultCode');
    if (resultCode && resultCode !== '00' && resultCode !== '000') {
      throw new Error(tag(xml, 'resultMsg') || `Public API error (${resultCode}).`);
    }
    return { xml, items: parser(xml) };
  }

  const first = await fetchPage(1);
  const totalCount = Number(String(tag(first.xml, 'totalCount') || first.items.length).replace(/,/g, ''));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages === 1) return first.items;
  const remaining = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)));
  return first.items.concat(...remaining.map(page => page.items));
}

function runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize = 1000 }) {
  return `molit-v1:${String(kind)}:${String(type)}:${String(lawdCd)}:${String(dealYmd)}:${String(pageSize)}`;
}

async function safeRuntimeCacheGet(cache, cacheKey) {
  if (!cache || typeof cache.get !== 'function') return null;
  try {
    const value = await cache.get(cacheKey);
    return Array.isArray(value) ? value : null;
  } catch (_) {
    return null;
  }
}

async function loadWithRuntimeCache({ cacheProvider = getRuntimeCache, cacheKey, loader }) {
  if (typeof loader !== 'function') throw new TypeError('loader must be a function.');

  let cache = null;
  if (typeof cacheProvider === 'function') {
    try {
      cache = await cacheProvider();
    } catch (_) {
      cache = null;
    }
  }

  const hit = await safeRuntimeCacheGet(cache, cacheKey);
  if (hit) return hit;

  let value;
  try {
    value = await loader();
  } catch (error) {
    // Another function may have populated the regional cache while this request
    // was retrying a throttled upstream call. Re-check before surfacing failure.
    const concurrentHit = await safeRuntimeCacheGet(cache, cacheKey);
    if (concurrentHit) return concurrentHit;
    throw error;
  }

  if (cache && typeof cache.set === 'function' && Array.isArray(value)) {
    try {
      await cache.set(cacheKey, value, {
        ttl: RUNTIME_CACHE_TTL_SECONDS,
        tags: [RUNTIME_CACHE_TAG]
      });
    } catch (_) {
      // Runtime Cache is an optimization. Successful MOLIT data must still be served.
    }
  }
  return value;
}

function cacheForFetch(fetchImpl) {
  let cache = monthCaches.get(fetchImpl);
  if (!cache) {
    cache = new Map();
    monthCaches.set(fetchImpl, cache);
  }
  return cache;
}

function cachedMonthRequest(fetchImpl, key, loader) {
  const cache = cacheForFetch(fetchImpl);
  const now = Date.now();
  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(entryKey);
  }

  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    cache.delete(key);
    cache.set(key, existing);
    return existing.promise;
  }

  while (cache.size >= MONTH_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }

  const promise = Promise.resolve().then(loader);
  cache.set(key, { promise, expiresAt: now + MONTH_CACHE_TTL_MS });
  promise.catch(() => {
    const current = cache.get(key);
    if (current && current.promise === promise) cache.delete(key);
  });
  return promise;
}

async function fetchRentalMonth({
  serviceKey,
  type,
  lawdCd,
  dealYmd,
  fetchImpl = fetch,
  pageSize = 1000,
  runtimeCacheProvider
}) {
  const endpoint = endpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported property type.');
  const localCacheKey = `rent:${type}:${lawdCd}:${dealYmd}:${pageSize}`;
  const sharedCacheKey = runtimeMonthCacheKey({ kind:'rent', type, lawdCd, dealYmd, pageSize });
  const sharedProvider = runtimeCacheProvider === undefined
    ? (fetchImpl === globalThis.fetch ? getRuntimeCache : null)
    : runtimeCacheProvider;

  return cachedMonthRequest(fetchImpl, localCacheKey, () => loadWithRuntimeCache({
    cacheProvider: sharedProvider,
    cacheKey: sharedCacheKey,
    loader: () => fetchPagedXml({
      endpoint,
      serviceKey,
      lawdCd,
      dealYmd,
      fetchImpl,
      pageSize,
      parser: xml => parseItems(xml, type)
    })
  }));
}

async function fetchSaleMonth({
  serviceKey,
  type = 'apartment',
  lawdCd,
  dealYmd,
  fetchImpl = fetch,
  pageSize = 1000,
  runtimeCacheProvider
}) {
  const endpoint = saleEndpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported sale property type.');
  const localCacheKey = `sale:${type}:${lawdCd}:${dealYmd}:${pageSize}`;
  const sharedCacheKey = runtimeMonthCacheKey({ kind:'sale', type, lawdCd, dealYmd, pageSize });
  const sharedProvider = runtimeCacheProvider === undefined
    ? (fetchImpl === globalThis.fetch ? getRuntimeCache : null)
    : runtimeCacheProvider;

  return cachedMonthRequest(fetchImpl, localCacheKey, () => loadWithRuntimeCache({
    cacheProvider: sharedProvider,
    cacheKey: sharedCacheKey,
    loader: () => fetchPagedXml({
      endpoint,
      serviceKey,
      lawdCd,
      dealYmd,
      fetchImpl,
      pageSize,
      parser: xml => parseSaleItems(xml, type)
    })
  }));
}

module.exports = {
  decodeXml,
  tag,
  normalizeServiceKey,
  completedMonths,
  endpointForType,
  saleEndpointForType,
  parseItems,
  parseSaleItems,
  runtimeMonthCacheKey,
  loadWithRuntimeCache,
  fetchRentalMonth,
  fetchSaleMonth
};
