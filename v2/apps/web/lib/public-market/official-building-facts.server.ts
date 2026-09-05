import 'server-only';

export type OfficialBuildingFacts = Readonly<{
  status: 'ready';
  match: Readonly<{ kaptCode: string; bjdCode: string }>;
  apartment: Readonly<{
    name: string;
    legalAddress: string;
    roadAddress: string | null;
    households: number | null;
    buildings: number | null;
    heating: string | null;
    corridorType: string | null;
    saleType: string | null;
    approvalDate: string | null;
    totalAreaSqm: number | null;
  }>;
  register: Readonly<{
    ledgerKey: string;
    mainUse: string | null;
    structure: string | null;
    totalAreaSqm: number | null;
    buildingAreaSqm: number | null;
    floorsAbove: number | null;
    floorsBelow: number | null;
    approvalDate: string | null;
    parkingSpaces: number | null;
  }> | null;
}> | Readonly<{
  status: 'unavailable';
  reason: 'unsupported_housing_type' | 'configuration_missing' | 'provider_unavailable'
    | 'apartment_not_found' | 'ambiguous_apartment_match' | 'identity_mismatch';
}>;

type LoaderInput = Readonly<{
  serviceKey?: string;
  fetch: typeof globalThis.fetch;
  districtLawdCd: string;
  neighborhoodName: string;
  officialName: string;
  housingType: string;
}>;

const APT_LIST_URL = 'https://apis.data.go.kr/1613000/AptListService3/getSigunguAptList';
const APT_BASIC_URL = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4';
const BUILDING_REGISTER_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrRecapTitleInfo';

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function integer(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizedName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[\s·._()-]+/g, '');
}

function canonicalApartmentName(value: string): string {
  return normalizedName(value.replace(/\([^)]*\)/g, ''))
    .replace(/(?:아파트|주상복합)$/g, '');
}

function responseBody(source: unknown): Record<string, unknown> | null {
  const response = record(source)?.response;
  const responseRecord = record(response);
  const header = record(responseRecord?.header);
  const code = text(header?.resultCode);
  if (code !== '00' && code !== '000') return null;
  return record(responseRecord?.body);
}

function itemArray(body: Record<string, unknown>): readonly Record<string, unknown>[] {
  const container = body.items ?? body.item;
  if (Array.isArray(container)) return container.map(record).filter((item): item is Record<string, unknown> => item !== null);
  const nested = record(container);
  const value = nested?.item ?? container;
  if (Array.isArray(value)) return value.map(record).filter((item): item is Record<string, unknown> => item !== null);
  const single = record(value);
  return single === null ? Object.freeze([]) : Object.freeze([single]);
}

async function getJson(
  fetch: typeof globalThis.fetch,
  base: string,
  serviceKey: string,
  params: Readonly<Record<string, string>>,
): Promise<Record<string, unknown> | null> {
  const url = new URL(base);
  let normalizedServiceKey = serviceKey.trim();
  if (/%[0-9a-f]{2}/i.test(normalizedServiceKey)) {
    try {
      normalizedServiceKey = decodeURIComponent(normalizedServiceKey);
    } catch {
      // Keep the original value when it is not valid percent-encoded text.
    }
  }
  url.searchParams.set('serviceKey', normalizedServiceKey);
  url.searchParams.set('_type', 'json');
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    return responseBody(await response.json());
  } catch {
    return null;
  }
}

function lotFromAddress(address: string, neighborhoodName: string) {
  const escaped = neighborhoodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s+(산)?(\\d{1,4})(?:-(\\d{1,4}))?(?:\\s|$)`).exec(address);
  if (match === null) return null;
  return Object.freeze({
    platGbCd: match[1] === undefined ? '0' : '1',
    bun: match[2]!.padStart(4, '0'),
    ji: (match[3] ?? '0').padStart(4, '0'),
  });
}

function date(value: unknown): string | null {
  const raw = text(value);
  if (raw === null || !/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export async function loadOfficialBuildingFacts(input: LoaderInput): Promise<OfficialBuildingFacts> {
  if (input.housingType !== 'apartment') {
    return Object.freeze({ status: 'unavailable', reason: 'unsupported_housing_type' });
  }
  if (input.serviceKey === undefined || input.serviceKey.trim() === '') {
    return Object.freeze({ status: 'unavailable', reason: 'configuration_missing' });
  }
  if (!/^\d{5}$/.test(input.districtLawdCd)) {
    return Object.freeze({ status: 'unavailable', reason: 'identity_mismatch' });
  }
  const listBody = await getJson(input.fetch, APT_LIST_URL, input.serviceKey, {
    sigunguCode: input.districtLawdCd,
    numOfRows: '1000',
    pageNo: '1',
  });
  if (listBody === null) return Object.freeze({ status: 'unavailable', reason: 'provider_unavailable' });
  const wantedName = normalizedName(input.officialName);
  const wantedCanonicalName = canonicalApartmentName(input.officialName);
  const matches = itemArray(listBody).filter((item) => {
    const kaptName = text(item.kaptName);
    const bjdCode = text(item.bjdCode);
    return kaptName !== null && (
      normalizedName(kaptName) === wantedName
      || (wantedCanonicalName.length >= 4 && canonicalApartmentName(kaptName) === wantedCanonicalName)
    )
      && bjdCode !== null && bjdCode.startsWith(input.districtLawdCd);
  });
  if (matches.length === 0) return Object.freeze({ status: 'unavailable', reason: 'apartment_not_found' });
  if (matches.length !== 1) return Object.freeze({ status: 'unavailable', reason: 'ambiguous_apartment_match' });
  const kaptCode = text(matches[0]!.kaptCode);
  const listedBjdCode = text(matches[0]!.bjdCode);
  if (kaptCode === null || !/^[A-Z0-9]{5,20}$/.test(kaptCode)
    || listedBjdCode === null || !/^\d{10}$/.test(listedBjdCode)) {
    return Object.freeze({ status: 'unavailable', reason: 'identity_mismatch' });
  }
  const basicBody = await getJson(input.fetch, APT_BASIC_URL, input.serviceKey, { kaptCode });
  if (basicBody === null) return Object.freeze({ status: 'unavailable', reason: 'provider_unavailable' });
  const basicItems = itemArray(basicBody);
  if (basicItems.length !== 1) return Object.freeze({ status: 'unavailable', reason: 'identity_mismatch' });
  const basic = basicItems[0]!;
  const basicCode = text(basic.kaptCode);
  const bjdCode = text(basic.bjdCode);
  const legalAddress = text(basic.kaptAddr);
  const aptName = text(basic.kaptName);
  if (basicCode !== kaptCode || bjdCode !== listedBjdCode || legalAddress === null
    || aptName === null || !(
      normalizedName(aptName) === wantedName
      || canonicalApartmentName(aptName) === wantedCanonicalName
    )
    || !legalAddress.includes(input.neighborhoodName)) {
    return Object.freeze({ status: 'unavailable', reason: 'identity_mismatch' });
  }
  const lot = lotFromAddress(legalAddress, input.neighborhoodName);
  let registerFacts: Extract<OfficialBuildingFacts, { status: 'ready' }>['register'] = null;
  if (lot !== null) {
    const registerBody = await getJson(input.fetch, BUILDING_REGISTER_URL, input.serviceKey, {
      sigunguCd: bjdCode.slice(0, 5),
      bjdongCd: bjdCode.slice(5),
      platGbCd: lot.platGbCd,
      bun: lot.bun,
      ji: lot.ji,
      numOfRows: '100',
      pageNo: '1',
    });
    const registerItems = registerBody === null ? [] : itemArray(registerBody);
    if (registerItems.length === 1) {
      const register = registerItems[0]!;
      const ledgerKey = text(register.mgmBldrgstPk);
      if (ledgerKey !== null) {
        registerFacts = Object.freeze({
          ledgerKey,
          mainUse: text(register.mainPurpsCdNm),
          structure: text(register.strctCdNm),
          totalAreaSqm: number(register.totArea),
          buildingAreaSqm: number(register.archArea),
          floorsAbove: integer(register.grndFlrCnt),
          floorsBelow: integer(register.ugrndFlrCnt),
          approvalDate: date(register.useAprDay),
          parkingSpaces: integer(register.totPkngCnt),
        });
      }
    }
  }
  return Object.freeze({
    status: 'ready',
    match: Object.freeze({ kaptCode, bjdCode }),
    apartment: Object.freeze({
      name: aptName,
      legalAddress,
      roadAddress: text(basic.doroJuso),
      households: integer(basic.hoCnt),
      buildings: integer(basic.kaptDongCnt),
      heating: text(basic.codeHeatNm),
      corridorType: text(basic.codeHallNm),
      saleType: text(basic.codeSaleNm),
      approvalDate: date(basic.kaptUsedate),
      totalAreaSqm: number(basic.kaptTarea),
    }),
    register: registerFacts,
  });
}
