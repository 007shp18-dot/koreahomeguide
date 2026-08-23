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
    const building =
      tag(block, 'aptNm') ||
      tag(block, 'offiNm') ||
      tag(block, 'mhouseNm') ||
      tag(block, 'buildingName') ||
      tag(block, 'umdNm') ||
      '-';
    const area =
      tag(block, 'excluUseAr') ||
      tag(block, 'excluUseArea') ||
      tag(block, 'totalFloorAr') ||
      '';
    const deposit = tag(block, 'deposit') || tag(block, 'depositAmt') || '0';
    const monthlyRent = tag(block, 'monthlyRent') || tag(block, 'monthlyRentAmt') || '0';

    return {
      building,
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

module.exports = { decodeXml, tag, normalizeServiceKey, completedMonths, endpointForType, parseItems };
