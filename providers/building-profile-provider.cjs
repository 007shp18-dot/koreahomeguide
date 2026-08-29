'use strict';

const DEFAULT_ENDPOINT = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';

function parseParcel(value) {
  const raw = String(value || '').normalize('NFKC').trim();
  const match = raw.match(/^(산\s*)?(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return {
    platGbCd:match[1] ? '1' : '0',
    bun:String(Number(match[2])).padStart(4, '0'),
    ji:String(Number(match[3] || 0)).padStart(4, '0')
  };
}

function cleanNumber(value) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(number) && number > 0 ? number : null;
}

function cleanText(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function comparableName(value) {
  return cleanText(value).replace(/[\s()\[\]·._-]/g, '').toLocaleLowerCase('ko-KR');
}

function itemArray(payload) {
  const item = payload && payload.response && payload.response.body && payload.response.body.items && payload.response.body.items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function compatibleCandidate(item, transaction) {
  const requested = comparableName(transaction.explorerBuildingName || transaction.buildingName || transaction.building);
  const returned = comparableName(item && item.bldNm);
  if (!requested || !returned) return true;
  return requested.includes(returned) || returned.includes(requested);
}

function profileFromItem(item) {
  const approval = cleanText(item.useAprDay);
  const useApprovalYear = /^\d{4}/.test(approval) ? Number(approval.slice(0, 4)) : null;
  const households = cleanNumber(item.hhldCnt);
  const families = cleanNumber(item.fmlyCnt);
  const profile = {
    status:'matched',
    officialAddress:cleanText(item.platPlc),
    roadAddress:cleanText(item.newPlatPlc),
    useApprovalYear,
    householdCount:households || families,
    householdLabel:households ? 'households' : families ? 'families' : null,
    groundFloors:cleanNumber(item.grndFlrCnt),
    undergroundFloors:cleanNumber(item.ugrndFlrCnt),
    source:'MOLIT Building HUB'
  };
  for (const key of Object.keys(profile)) {
    if (profile[key] == null || profile[key] === '') delete profile[key];
  }
  return profile;
}

async function fetchBuildingProfile({ serviceKey, transaction, fetchImpl = fetch, endpoint = DEFAULT_ENDPOINT } = {}) {
  const parcel = parseParcel(transaction && transaction.jibun || transaction && transaction.explorerJibun);
  const sggCd = cleanText(transaction && transaction.sggCd);
  const umdCd = cleanText(transaction && transaction.umdCd);
  if (!serviceKey || !parcel || !/^\d{5}$/.test(sggCd) || !/^\d{5}$/.test(umdCd)) return { status:'unavailable' };
  const params = new URLSearchParams({
    serviceKey:String(serviceKey), sigunguCd:sggCd, bjdongCd:umdCd,
    platGbCd:parcel.platGbCd, bun:parcel.bun, ji:parcel.ji,
    numOfRows:'100', pageNo:'1', _type:'json'
  });
  try {
    const response = await fetchImpl(`${endpoint}?${params.toString()}`, {
      headers:{ Accept:'application/json' }, signal:AbortSignal.timeout(3500)
    });
    if (!response.ok) return { status:'unavailable' };
    const payload = await response.json();
    const resultCode = cleanText(payload && payload.response && payload.response.header && payload.response.header.resultCode);
    if (resultCode && resultCode !== '00' && resultCode !== '000') return { status:'unavailable' };
    const candidates = itemArray(payload).filter(item => compatibleCandidate(item, transaction));
    if (!candidates.length) return { status:'empty' };
    if (candidates.length !== 1) return { status:'ambiguous' };
    return profileFromItem(candidates[0]);
  } catch (_) {
    return { status:'unavailable' };
  }
}

module.exports = { DEFAULT_ENDPOINT, parseParcel, fetchBuildingProfile, profileFromItem };
