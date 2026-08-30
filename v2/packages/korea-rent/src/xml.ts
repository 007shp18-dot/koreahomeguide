import type { KoreaRentRecord, SourceHousingType } from './input';
import { MOLIT_ENDPOINT_VERSION, MOLIT_PARSER_VERSION } from './versions';

export { MOLIT_ENDPOINT_VERSION, MOLIT_PARSER_VERSION } from './versions';
export const MOLIT_DEFAULT_PAGE_SIZE = 100 as const;

export const MOLIT_RENT_ENDPOINTS = Object.freeze({
  apartment: Object.freeze({
    dataset: 'Apartment rental contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  }),
  officetel: Object.freeze({
    dataset: 'Officetel rental contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
  }),
  villa: Object.freeze({
    dataset: 'Villa and row-house rental contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
  }),
  detached: Object.freeze({
    dataset: 'Detached and multi-unit rental contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent',
  }),
}) satisfies Readonly<Record<SourceHousingType, {
  readonly dataset: string;
  readonly url: string;
}>>;

export type MolitSourceErrorCode =
  | 'source_timeout'
  | 'source_malformed'
  | 'source_unavailable';

export class MolitSourceError extends Error {
  constructor(readonly code: MolitSourceErrorCode) {
    const message = {
      source_timeout: 'The official rental source timed out.',
      source_malformed: 'The official rental source returned an invalid response.',
      source_unavailable: 'The official rental source is unavailable.',
    } as const;
    super(message[code]);
    this.name = 'MolitSourceError';
  }
}

export type MolitParsedPage = {
  readonly pageNo: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly rows: readonly KoreaRentRecord[];
  /** Internal exact-item fingerprints used only to detect page overlap. */
  readonly rowFingerprints: readonly string[];
};

export type MolitPageChunk = {
  readonly pageNo: number;
  readonly rows: readonly KoreaRentRecord[];
  readonly rowFingerprintDigests: readonly string[];
};

export type MolitRentalMonth = {
  readonly sourceHousingType: SourceHousingType;
  readonly lawdCd: string;
  readonly dealYmd: string;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly pages: readonly MolitPageChunk[];
  readonly records: readonly KoreaRentRecord[];
  readonly retrievedAt: string;
};

export type MolitRentalMonthInput = {
  readonly serviceKey: string;
  readonly sourceHousingType: SourceHousingType;
  readonly lawdCd: string;
  readonly dealYmd: string;
  readonly pageSize?: number;
};

export type ProviderCallBudget = {
  /** Counts and authorizes one provider attempt, including retries. */
  consume(): void;
};

export type MolitFetchResponse = Pick<Response, 'ok' | 'status' | 'text'>;
export type MolitFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<MolitFetchResponse>;

export type FetchMolitRentalMonthDependencies = {
  readonly fetch: MolitFetch;
  readonly budget: ProviderCallBudget;
  readonly deadlineSignal: AbortSignal;
  readonly attemptSignal?: (timeoutMs: number, deadlineSignal: AbortSignal) => AbortSignal;
  readonly now: () => Date;
};

type XmlNode = {
  readonly name: string;
  readonly children: XmlNode[];
  text: string;
};

const ATTEMPT_TIMEOUT_MS = 5_000;
const MAX_ATTEMPTS = 3;

function malformed(): never {
  throw new MolitSourceError('source_malformed');
}

function localName(name: string): string {
  const separator = name.indexOf(':');
  return separator === -1 ? name : name.slice(separator + 1);
}

function isXmlCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x09 ||
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

function decodeXml(value: string): string {
  return value.replace(
    /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,
    (entity) => {
      if (entity === '&amp;') return '&';
      if (entity === '&lt;') return '<';
      if (entity === '&gt;') return '>';
      if (entity === '&quot;') return '"';
      if (entity === '&apos;') return "'";
      const radix = entity.startsWith('&#x') ? 16 : 10;
      const digits = entity.slice(radix === 16 ? 3 : 2, -1);
      const codePoint = Number.parseInt(digits, radix);
      if (!Number.isInteger(codePoint) || !isXmlCodePoint(codePoint)) malformed();
      return String.fromCodePoint(codePoint);
    },
  );
}

function decodeXmlText(value: string): string {
  if (value.includes('&') && /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/.test(value)) {
    malformed();
  }
  return decodeXml(value);
}

function openingTag(token: string): { readonly name: string; readonly selfClosing: boolean } {
  const match = /^<\s*([A-Za-z_][\w:.-]*)([\s\S]*)>$/.exec(token);
  if (match === null) malformed();
  let remainder = match[2]!.trimEnd();
  const selfClosing = remainder.endsWith('/');
  if (selfClosing) remainder = remainder.slice(0, -1).trimEnd();

  const attributes = new Set<string>();
  while (remainder.length > 0) {
    const attribute = /^\s+([A-Za-z_][\w:.-]*)\s*=\s*("[^"<]*"|'[^'<]*')/.exec(remainder);
    if (attribute === null || attributes.has(attribute[1]!)) malformed();
    attributes.add(attribute[1]!);
    decodeXmlText(attribute[2]!.slice(1, -1));
    remainder = remainder.slice(attribute[0].length);
  }
  return { name: match[1]!, selfClosing };
}

function parseXml(xml: string): XmlNode {
  if (xml.trim().length === 0 || /<!DOCTYPE|<!ENTITY/i.test(xml)) malformed();
  for (const character of xml) {
    if (!isXmlCodePoint(character.codePointAt(0)!)) malformed();
  }

  const documentNode: XmlNode = { name: '#document', children: [], text: '' };
  const stack: XmlNode[] = [documentNode];
  const tokens = xml.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g);
  if (tokens === null || tokens.join('') !== xml) malformed();

  for (const token of tokens) {
    if (token.startsWith('<?') || token.startsWith('<!--')) continue;
    const current = stack[stack.length - 1];
    if (current === undefined) malformed();

    if (token.startsWith('<![CDATA[')) {
      current.text += token.slice(9, -3);
      continue;
    }
    if (token.startsWith('</')) {
      const match = /^<\/\s*([A-Za-z_][\w:.-]*)\s*>$/.exec(token);
      if (match === null || stack.length === 1 || stack[stack.length - 1]?.name !== match[1]) {
        malformed();
      }
      stack.pop();
      continue;
    }
    if (token.startsWith('<')) {
      const parsed = openingTag(token);
      const node: XmlNode = { name: parsed.name, children: [], text: '' };
      current.children.push(node);
      if (!parsed.selfClosing) stack.push(node);
      continue;
    }

    current.text += decodeXmlText(token);
  }

  if (
    stack.length !== 1 ||
    documentNode.children.length !== 1 ||
    documentNode.text.trim().length > 0
  ) {
    malformed();
  }
  return documentNode.children[0]!;
}

function children(node: XmlNode, name: string): XmlNode[] {
  return node.children.filter((child) => localName(child.name) === name);
}

function onlyChild(node: XmlNode, name: string): XmlNode {
  const matches = children(node, name);
  if (matches.length !== 1) malformed();
  return matches[0]!;
}

function optionalText(node: XmlNode, names: readonly string[]): string | undefined {
  for (const name of names) {
    const matches = children(node, name);
    if (matches.length > 1) malformed();
    if (matches.length === 1) {
      const value = matches[0]!.text.trim();
      if (value.length > 0) return value;
    }
  }
  return undefined;
}

function requiredText(node: XmlNode, names: readonly string[]): string {
  const value = optionalText(node, names);
  if (value === undefined) malformed();
  return value;
}

function unsignedInteger(value: string): number {
  if (!/^\d+$/.test(value)) malformed();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) malformed();
  return number;
}

function wonFromManwon(value: string): number {
  const compact = value.replace(/[\s,]/g, '');
  const manwon = unsignedInteger(compact);
  const won = manwon * 10_000;
  if (!Number.isSafeInteger(won)) malformed();
  return won;
}

function positiveArea(value: string): number {
  const compact = value.replace(/,/g, '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(compact)) malformed();
  const area = Number(compact);
  if (!Number.isFinite(area) || area <= 0 || area > 2_000) malformed();
  return area;
}

function contractDate(item: XmlNode): string {
  const year = unsignedInteger(requiredText(item, ['dealYear']));
  const month = unsignedInteger(requiredText(item, ['dealMonth']));
  const day = unsignedInteger(requiredText(item, ['dealDay']));
  const candidate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const instant = new Date(`${candidate}T00:00:00.000Z`);
  if (
    year < 1900 ||
    year > 2200 ||
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() + 1 !== month ||
    instant.getUTCDate() !== day
  ) {
    malformed();
  }
  return candidate;
}

function contractType(value: string | undefined): KoreaRentRecord['contractType'] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === '신규' || normalized === 'new') return 'new';
  if (normalized === '갱신' || normalized === 'renewal') return 'renewal';
  return 'unknown';
}

function recordStatus(item: XmlNode): KoreaRentRecord['recordStatus'] {
  const cancellationDay = optionalText(item, ['cdealDay', 'cancelDealDay']);
  const status = optionalText(item, ['cdealType', 'cancelDealType', 'recordStatus'])?.toLowerCase();
  if (
    cancellationDay !== undefined ||
    status === 'o' ||
    status === 'y' ||
    status === '1' ||
    status === '취소' ||
    status === 'cancelled' ||
    status === 'canceled'
  ) {
    return 'cancelled';
  }
  if (
    status === 'n' ||
    status === '0' ||
    status === '정상' ||
    status === 'active'
  ) {
    return 'active';
  }
  return 'unknown';
}

function fingerprint(item: XmlNode): string {
  return JSON.stringify(
    item.children
      .map((child) => [localName(child.name), child.text.trim()] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function fingerprintDigest(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeItem(
  item: XmlNode,
  sourceHousingType: SourceHousingType,
  expected: { readonly dealYmd?: string; readonly lawdCd?: string },
): KoreaRentRecord {
  const buildingLabel = optionalText(item, [
    'aptNm',
    'offiNm',
    'mhouseNm',
    'houseType',
    'buildingName',
  ]);
  const sourceRecordId = optionalText(item, ['dealSn', 'transactionId', 'dealNo']);
  const normalizedContractDate = contractDate(item);
  const suppliedLawdCd = optionalText(item, ['sggCd', 'lawdCd']);
  if (
    (expected.dealYmd !== undefined &&
      normalizedContractDate.slice(0, 7).replace('-', '') !== expected.dealYmd) ||
    (suppliedLawdCd !== undefined &&
      (!/^\d{5}$/.test(suppliedLawdCd) || suppliedLawdCd !== expected.lawdCd))
  ) {
    malformed();
  }
  return {
    ...(buildingLabel === undefined ? {} : { buildingLabel }),
    sourceHousingType,
    areaSqm: positiveArea(requiredText(item, ['excluUseAr', 'totalFloorAr', 'rentArea'])),
    depositWon: wonFromManwon(requiredText(item, ['deposit'])),
    monthlyRentWon: wonFromManwon(requiredText(item, ['monthlyRent'])),
    contractDate: normalizedContractDate,
    contractType: contractType(optionalText(item, ['contractType'])),
    recordStatus: recordStatus(item),
    ...(sourceRecordId === undefined ? {} : { sourceRecordId }),
  };
}

export function parseMolitRentalPage(
  xml: string,
  input: {
    readonly sourceHousingType: SourceHousingType;
    readonly expectedPageNo: number;
    readonly expectedPageSize: number;
    readonly expectedDealYmd?: string;
    readonly expectedLawdCd?: string;
  },
): MolitParsedPage {
  const root = parseXml(xml);
  if (localName(root.name) !== 'response') malformed();
  const header = onlyChild(root, 'header');
  const body = onlyChild(root, 'body');
  const resultCode = requiredText(header, ['resultCode']);
  requiredText(header, ['resultMsg']);
  if (resultCode !== '00' && resultCode !== '000') malformed();

  const items = onlyChild(body, 'items');
  const pageSize = unsignedInteger(requiredText(body, ['numOfRows']));
  const pageNo = unsignedInteger(requiredText(body, ['pageNo']));
  const totalCount = unsignedInteger(requiredText(body, ['totalCount']));
  if (
    pageSize <= 0 ||
    pageSize !== input.expectedPageSize ||
    pageNo !== input.expectedPageNo
  ) {
    malformed();
  }

  const itemNodes = children(items, 'item');
  if (itemNodes.length !== items.children.length || itemNodes.length > pageSize) malformed();
  const rows = itemNodes.map((item) => normalizeItem(item, input.sourceHousingType, {
    ...(input.expectedDealYmd === undefined ? {} : { dealYmd: input.expectedDealYmd }),
    ...(input.expectedLawdCd === undefined ? {} : { lawdCd: input.expectedLawdCd }),
  }));
  return Object.freeze({
    pageNo,
    pageSize,
    totalCount,
    rows: Object.freeze(rows),
    rowFingerprints: Object.freeze(itemNodes.map(fingerprint)),
  });
}

function defaultAttemptSignal(timeoutMs: number, deadlineSignal: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const abortSignal = AbortSignal as typeof AbortSignal & {
    any(signals: readonly AbortSignal[]): AbortSignal;
  };
  return abortSignal.any([deadlineSignal, timeoutSignal]);
}

function asSourceError(error: unknown, deadlineSignal: AbortSignal): MolitSourceError {
  if (error instanceof MolitSourceError) return error;
  if (
    deadlineSignal.aborted ||
    (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
  ) {
    return new MolitSourceError('source_timeout');
  }
  return new MolitSourceError('source_unavailable');
}

function awaitWithSignals<T>(
  operation: Promise<T>,
  signals: readonly AbortSignal[],
): Promise<T> {
  if (signals.some((signal) => signal.aborted)) {
    void operation.catch(() => undefined);
    return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      signals.forEach((signal) => signal.removeEventListener('abort', abort));
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    signals.forEach((signal) => signal.addEventListener('abort', abort, { once: true }));
    operation.then(
      (value) => {
        signals.forEach((signal) => signal.removeEventListener('abort', abort));
        resolve(value);
      },
      (error: unknown) => {
        signals.forEach((signal) => signal.removeEventListener('abort', abort));
        reject(error);
      },
    );
  });
}

function assertInput(input: MolitRentalMonthInput): number {
  if (
    input.serviceKey.length === 0 ||
    !/^\d{5}$/.test(input.lawdCd) ||
    !isValidDealYmd(input.dealYmd) ||
    !(input.sourceHousingType in MOLIT_RENT_ENDPOINTS)
  ) {
    throw new MolitSourceError('source_unavailable');
  }
  const pageSize = input.pageSize ?? MOLIT_DEFAULT_PAGE_SIZE;
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0 || pageSize > 1_000) {
    throw new MolitSourceError('source_unavailable');
  }
  return pageSize;
}

export function isValidDealYmd(value: string): boolean {
  const match = /^(\d{4})(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1900 && year <= 2200 && month >= 1 && month <= 12;
}

async function fetchPage(
  input: MolitRentalMonthInput,
  pageSize: number,
  pageNo: number,
  dependencies: FetchMolitRentalMonthDependencies,
): Promise<MolitParsedPage> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (dependencies.deadlineSignal.aborted) throw new MolitSourceError('source_timeout');
    try {
      dependencies.budget.consume();
    } catch {
      throw new MolitSourceError('source_unavailable');
    }
    try {
      const endpoint = MOLIT_RENT_ENDPOINTS[input.sourceHousingType];
      const url = new URL(endpoint.url);
      url.searchParams.set('serviceKey', input.serviceKey);
      url.searchParams.set('LAWD_CD', input.lawdCd);
      url.searchParams.set('DEAL_YMD', input.dealYmd);
      url.searchParams.set('numOfRows', String(pageSize));
      url.searchParams.set('pageNo', String(pageNo));
      const signal = (dependencies.attemptSignal ?? defaultAttemptSignal)(
        ATTEMPT_TIMEOUT_MS,
        dependencies.deadlineSignal,
      );
      const response = await awaitWithSignals(
        dependencies.fetch(url, { cache: 'no-store', signal }),
        [signal, dependencies.deadlineSignal],
      );
      const body = await awaitWithSignals(
        Promise.resolve().then(() => response.text()),
        [signal, dependencies.deadlineSignal],
      );
      if (!response.ok) throw new MolitSourceError('source_unavailable');
      return parseMolitRentalPage(body, {
        sourceHousingType: input.sourceHousingType,
        expectedPageNo: pageNo,
        expectedPageSize: pageSize,
        expectedDealYmd: input.dealYmd,
        expectedLawdCd: input.lawdCd,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw asSourceError(lastError, dependencies.deadlineSignal);
}

function validatePageCompleteness(page: MolitParsedPage, pageCount: number): void {
  const expectedRows = page.pageNo < pageCount
    ? page.pageSize
    : page.totalCount - page.pageSize * (pageCount - 1);
  if (page.rows.length !== expectedRows) malformed();
}

export async function fetchMolitRentalMonth(
  input: MolitRentalMonthInput,
  dependencies: FetchMolitRentalMonthDependencies,
): Promise<MolitRentalMonth> {
  const pageSize = assertInput(input);
  if (dependencies.deadlineSignal.aborted) throw new MolitSourceError('source_timeout');
  const first = await fetchPage(input, pageSize, 1, dependencies);
  const pageCount = Math.max(1, Math.ceil(first.totalCount / pageSize));
  validatePageCompleteness(first, pageCount);

  const pages: MolitParsedPage[] = [first];
  for (let pageNo = 2; pageNo <= pageCount; pageNo += 1) {
    const page = await fetchPage(input, pageSize, pageNo, dependencies);
    if (page.totalCount !== first.totalCount) malformed();
    validatePageCompleteness(page, pageCount);
    pages.push(page);
  }

  const records: KoreaRentRecord[] = [];
  const pageChunks: MolitPageChunk[] = [];
  const stableIds = new Map<string, string>();
  const previousAnonymousFingerprints = new Set<string>();
  for (const page of pages) {
    const anonymousOnThisPage: string[] = [];
    page.rows.forEach((record, index) => {
      const itemFingerprint = page.rowFingerprints[index]!;
      if (record.sourceRecordId !== undefined) {
        const priorFingerprint = stableIds.get(record.sourceRecordId);
        if (priorFingerprint !== undefined) {
          if (priorFingerprint !== itemFingerprint) malformed();
          return;
        }
        stableIds.set(record.sourceRecordId, itemFingerprint);
      } else {
        if (previousAnonymousFingerprints.has(itemFingerprint)) malformed();
        anonymousOnThisPage.push(itemFingerprint);
      }
      records.push(record);
    });
    anonymousOnThisPage.forEach((value) => previousAnonymousFingerprints.add(value));
    const rowFingerprintDigests = await awaitWithSignals(
      Promise.all(page.rowFingerprints.map(fingerprintDigest)),
      [dependencies.deadlineSignal],
    );
    pageChunks.push(Object.freeze({
      pageNo: page.pageNo,
      rows: page.rows,
      rowFingerprintDigests: Object.freeze(rowFingerprintDigests),
    }));
  }

  const retrievedAt = dependencies.now();
  if (dependencies.deadlineSignal.aborted) throw new MolitSourceError('source_timeout');
  if (!Number.isFinite(retrievedAt.getTime())) throw new MolitSourceError('source_unavailable');
  return Object.freeze({
    sourceHousingType: input.sourceHousingType,
    lawdCd: input.lawdCd,
    dealYmd: input.dealYmd,
    pageSize,
    totalCount: first.totalCount,
    pages: Object.freeze(pageChunks),
    records: Object.freeze(records),
    retrievedAt: retrievedAt.toISOString(),
  });
}
