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
    villa: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent'
  };
  return endpoints[type] || null;
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
      contractDate: year && month && day
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : '',
      type
    };
  });
}

async function fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd, fetchImpl = fetch, pageSize = 1000 }) {
  const endpoint = endpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported property type.');

  async function fetchPage(pageNo) {
    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: String(lawdCd),
      DEAL_YMD: String(dealYmd),
      numOfRows: String(pageSize),
      pageNo: String(pageNo)
    });
    const upstream = await fetchImpl(`${endpoint}?${params.toString()}`, {
      headers: { Accept: 'application/xml,text/xml,*/*' }
    });
    const xml = await upstream.text();
    if (!upstream.ok) throw new Error(`Public API returned HTTP ${upstream.status}.`);
    const resultCode = tag(xml, 'resultCode');
    if (resultCode && resultCode !== '00' && resultCode !== '000') {
      throw new Error(tag(xml, 'resultMsg') || `Public API error (${resultCode}).`);
    }
    return { xml, items: parseItems(xml, type) };
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

module.exports = { decodeXml, tag, normalizeServiceKey, completedMonths, endpointForType, parseItems, fetchRentalMonth };
