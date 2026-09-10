'use strict';

const { fetchWithRetry, DEFAULT_UPSTREAM_TIMEOUT_MS } = require('./api-guard.cjs');
const { getRuntimeCache } = require('./runtime-cache.cjs');

const RUNTIME_CACHE_TTL_SECONDS = 86400;
const WARM_CACHE_TTL_MS = 5 * 60 * 1000;
const warmMonthRequests = new Map();

function runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize = 1000 }) {
  return `molit-v2:${kind}:${type}:${lawdCd}:${dealYmd}:${pageSize}`;
}

async function loadWithRuntimeCache({ cacheProvider = getRuntimeCache, cacheKey, loader }) {
  let cache = null;
  try {
    cache = await cacheProvider();
  } catch (_) {
    cache = null;
  }

  if (cache) {
    try {
      const hit = await cache.get(cacheKey);
      if (hit !== null && hit !== undefined) return hit;
    } catch (_) {}
  }

  const value = await loader();
  if (cache) {
    try {
      await cache.set(cacheKey, value, {
        ttl:RUNTIME_CACHE_TTL_SECONDS,
        tags:['molit-month']
      });
    } catch (_) {}
  }
  return value;
}

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
    const buildingName =
      tag(block, 'aptNm') ||
      tag(block, 'offiNm') ||
      tag(block, 'mhouseNm') ||
      tag(block, 'buildingName') ||
      '';
    const dong = tag(block, 'umdNm') || '';
    const jibun = tag(block, 'jibun') || '';
    const roadName = tag(block, 'roadNm') || '';
    const roadMainNumber = tag(block, 'roadNmBonbun') || '';
    const roadSubNumber = tag(block, 'roadNmBubun') || '';
    const building = buildingName || dong || '-';
    const area =
      tag(block, 'excluUseAr') ||
      tag(block, 'excluUseArea') ||
      tag(block, 'totalFloorAr') ||
      '';
    const deposit = tag(block, 'deposit') || tag(block, 'depositAmt') || '0';
    const monthlyRent = tag(block, 'monthlyRent') || tag(block, 'monthlyRentAmt') || '0';

    return {
      building,
      buildingName,
      dong,
      jibun,
      roadName,
      roadMainNumber,
      roadSubNumber,
      buildYear: tag(block, 'buildYear') || tag(block, 'buildYr') || tag(block, '건축년도') || '',
      floor: tag(block, 'floor') || tag(block, 'flrNo') || tag(block, '층') || '',
      sggCd: tag(block, 'sggCd') || '',
      umdCd: tag(block, 'umdCd') || '',
      area,
      deposit,
      monthlyRent,
      contractTerm: tag(block, 'contractTerm') || '',
      contractType: tag(block, 'contractType') || '',
      useRRRight: tag(block, 'useRRRight') || '',
      preDeposit: tag(block, 'preDeposit') || '',
      preMonthlyRent: tag(block, 'preMonthlyRent') || '',
      houseType: tag(block, 'houseType') || '',
      contractDate: year && month && day
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : '',
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
      contractDate: year && month && day
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : '',
      type
    };
  });
}

function nonNegativeInteger(value) {
  const normalized = String(value || '').replace(/,/g, '').trim();
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function validateMolitPage(xml, { pageNo, expectedTotalCount = null } = {}) {
  const text = String(xml || '').trim();
  const completeResponse = /<response(?:\s[^>]*)?>[\s\S]*<\/response>\s*$/i.test(text);
  const completeHeader = /<header(?:\s[^>]*)?>[\s\S]*<\/header>/i.test(text);
  if (!completeResponse || !completeHeader) {
    throw new Error('Invalid MOLIT response envelope.');
  }

  const resultCode = tag(text, 'resultCode');
  if (!resultCode) throw new Error('Invalid MOLIT response envelope.');
  if (resultCode !== '00' && resultCode !== '000') {
    throw new Error(tag(text, 'resultMsg') || `Public API error (${resultCode}).`);
  }

  if (!/<body(?:\s[^>]*)?>[\s\S]*<\/body>/i.test(text)) {
    throw new Error('Invalid MOLIT response envelope.');
  }
  const totalCount = nonNegativeInteger(tag(text, 'totalCount'));
  if (totalCount === null) throw new Error('Invalid MOLIT pagination metadata.');

  const reportedPageNo = tag(text, 'pageNo');
  if (reportedPageNo && nonNegativeInteger(reportedPageNo) !== pageNo) {
    throw new Error('Invalid MOLIT pagination metadata.');
  }
  if (expectedTotalCount !== null && totalCount !== expectedTotalCount) {
    throw new Error('Invalid MOLIT pagination metadata.');
  }
  return totalCount;
}

async function fetchPagedXml({
  endpoint,
  serviceKey,
  lawdCd,
  dealYmd,
  fetchImpl = fetch,
  sleepImpl,
  pageSize = 1000,
  parser,
  retryImpl = fetchWithRetry
}) {
  async function fetchPage(pageNo, expectedTotalCount = null) {
    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: String(lawdCd),
      DEAL_YMD: String(dealYmd),
      numOfRows: String(pageSize),
      pageNo: String(pageNo)
    });
    const attempt = await retryImpl(
      fetchImpl,
      `${endpoint}?${params.toString()}`,
      { headers: { Accept: 'application/xml,text/xml,*/*' } },
      DEFAULT_UPSTREAM_TIMEOUT_MS,
      { retries:2, sleepImpl, readBody:response => response.text() }
    );
    const consumed = attempt && attempt.response && Object.prototype.hasOwnProperty.call(attempt, 'body');
    const upstream = consumed ? attempt.response : attempt;
    const xml = consumed ? attempt.body : await upstream.text();
    if (!upstream.ok) {
      const error = new Error(`Public API returned HTTP ${upstream.status}.`);
      error.upstreamStatus = upstream.status;
      throw error;
    }
    const totalCount = validateMolitPage(xml, { pageNo, expectedTotalCount });
    return { xml, items: parser(xml), totalCount };
  }

  const first = await fetchPage(1);
  const totalCount = first.totalCount;
  const items = [...first.items];

  // Page by the size the server actually returned, not the size we asked for.
  // Several data.go.kr services silently cap numOfRows below the request while
  // still reporting the true totalCount. Deriving the page count from `pageSize`
  // then stops early on a perfectly good response and the count check below
  // rejects it — which is indistinguishable, from the caller, from the service
  // being unavailable.
  const observedPageSize = first.items.length;
  if (items.length < totalCount) {
    if (observedPageSize === 0) {
      throw new Error('Invalid MOLIT pagination metadata.');
    }
    const totalPages = Math.ceil(totalCount / observedPageSize);
    for (let pageNo = 2; pageNo <= totalPages && items.length < totalCount; pageNo += 1) {
      const page = await fetchPage(pageNo, totalCount);
      // A page that comes back empty before the total is reached means the
      // reported total and the served data disagree; stop rather than loop.
      if (page.items.length === 0) break;
      items.push(...page.items);
    }
  }

  if (items.length !== totalCount) {
    throw new Error('Invalid MOLIT pagination metadata.');
  }
  return items;
}

async function loadMonth({ kind, type, lawdCd, dealYmd, pageSize, runtimeCacheProvider, loader }) {
  const cacheKey = runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize });
  const now = Date.now();
  const warm = warmMonthRequests.get(cacheKey);
  if (warm && warm.expiresAt > now) return warm.promise;

  const promise = loadWithRuntimeCache({
    cacheProvider:runtimeCacheProvider || getRuntimeCache,
    cacheKey,
    loader
  });
  warmMonthRequests.set(cacheKey, { promise, expiresAt:now + WARM_CACHE_TTL_MS });
  try {
    return await promise;
  } catch (error) {
    if (warmMonthRequests.get(cacheKey)?.promise === promise) warmMonthRequests.delete(cacheKey);
    throw error;
  }
}

async function fetchRentalMonth({
  serviceKey,
  type,
  lawdCd,
  dealYmd,
  fetchImpl = fetch,
  sleepImpl,
  pageSize = 1000,
  runtimeCacheProvider,
  retryImpl = fetchWithRetry
}) {
  const endpoint = endpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported property type.');
  return loadMonth({
    kind:'rent',
    type,
    lawdCd,
    dealYmd,
    pageSize,
    runtimeCacheProvider,
    loader:() => fetchPagedXml({
      endpoint,
      serviceKey,
      lawdCd,
      dealYmd,
      fetchImpl,
      sleepImpl,
      pageSize,
      parser:xml => parseItems(xml, type),
      retryImpl
    })
  });
}

async function fetchSaleMonth({
  serviceKey,
  type = 'apartment',
  lawdCd,
  dealYmd,
  fetchImpl = fetch,
  sleepImpl,
  pageSize = 1000,
  runtimeCacheProvider,
  retryImpl = fetchWithRetry
}) {
  const endpoint = saleEndpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported sale property type.');
  return loadMonth({
    kind:'sale',
    type,
    lawdCd,
    dealYmd,
    pageSize,
    runtimeCacheProvider,
    loader:() => fetchPagedXml({
      endpoint,
      serviceKey,
      lawdCd,
      dealYmd,
      fetchImpl,
      sleepImpl,
      pageSize,
      parser:xml => parseSaleItems(xml, type),
      retryImpl
    })
  });
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
  fetchWithRetry,
  fetchRentalMonth,
  fetchSaleMonth
};
