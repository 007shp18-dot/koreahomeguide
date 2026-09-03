import type { KoreaRecordStatus, SourceHousingType } from './browser';

export const MOLIT_SALE_ENDPOINTS = Object.freeze({
  apartment: Object.freeze({
    dataset: 'Apartment sale contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
  }),
  officetel: Object.freeze({
    dataset: 'Officetel sale contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
  }),
  villa: Object.freeze({
    dataset: 'Villa and row-house sale contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade',
  }),
  detached: Object.freeze({
    dataset: 'Detached and multi-unit sale contracts',
    url: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade',
  }),
}) satisfies Readonly<Record<SourceHousingType, {
  readonly dataset: string;
  readonly url: string;
}>>;

/** Provider-only sale row. Raw addresses, buyer/seller fields, and API keys never cross this type. */
export type KoreaSaleRecord = Readonly<{
  sourceHousingType: SourceHousingType;
  areaSqm: number;
  priceWon: number;
  contractDate: string;
  recordStatus: KoreaRecordStatus;
  buildingLabel?: string;
  legalDong?: string;
  sourceRecordId?: string;
  floor?: number;
  buildYear?: number;
}>;

export type MolitSaleParsedPage = Readonly<{
  pageNo: number;
  pageSize: number;
  totalCount: number;
  rows: readonly KoreaSaleRecord[];
  /** Internal exact-item fingerprints used only to detect page overlap. */
  rowFingerprints: readonly string[];
}>;

export type MolitSalePageChunk = Readonly<{
  pageNo: number;
  rows: readonly KoreaSaleRecord[];
  readonly rowFingerprintDigests: readonly string[];
}>;

export type MolitSaleMonth = Readonly<{
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize: number;
  totalCount: number;
  pages: readonly MolitSalePageChunk[];
  records: readonly KoreaSaleRecord[];
  retrievedAt: string;
}>;

export type MolitSaleMonthInput = Readonly<{
  serviceKey: string;
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize?: number;
}>;
