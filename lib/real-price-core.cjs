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

async function fetchWith429Retry(url, options, {
  fetchImpl = fetch,
  sleepImpl = ms => new Promise(resolve => setTimeout(resolve, ms)),
  maxAttempts = 3
} = {}) {
  let response;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    response = await fetchImpl(url, options);
    if (response.status !== 429 || attempt === maxAttempts - 1) return response;
    await sleepImpl(500 * (2 ** attempt));
  }
  return response;
}

async function fetchPagedXml({ endpoint, serviceKey, lawdCd, dealYmd, fetchImpl = fetch, sleepImpl, pageSize = 1000, parser }) {
  async function fetchPage(pageNo) {
    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: String(lawdCd),
      DEAL_YMD: String(dealYmd),
      numOfRows: String(pageSize),
      pageNo: String(pageNo)
    });
    const upstream = await fetchWith429Retry(
      `${endpoint}?${params.toString()}`,
      { headers: { Accept: 'application/xml,text/xml,*/*' } },
      { fetchImpl, sleepImpl }
    );
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
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2))
  );
  return first.items.concat(...remaining.map(page => page.items));
}

async function fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd, fetchImpl = fetch, sleepImpl, pageSize = 1000 }) {
  const endpoint = endpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported property type.');
  return fetchPagedXml({
    endpoint,
    serviceKey,
    lawdCd,
    dealYmd,
    fetchImpl,
    sleepImpl,
    pageSize,
    parser: xml => parseItems(xml, type)
  });
}

async function fetchSaleMonth({ serviceKey, type = 'apartment', lawdCd, dealYmd, fetchImpl = fetch, sleepImpl, pageSize = 1000 }) {
  const endpoint = saleEndpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported sale property type.');
  return fetchPagedXml({
    endpoint,
    serviceKey,
    lawdCd,
    dealYmd,
    fetchImpl,
    sleepImpl,
    pageSize,
    parser: xml => parseSaleItems(xml, type)
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
  fetchWith429Retry,
  fetchRentalMonth,
  fetchSaleMonth
};
