import type { EditorialSource } from './editorial-content';

const checkedAt = '2026-09-04' as const;

function source(
  publisher: string,
  label: string,
  href: string,
): EditorialSource {
  return Object.freeze({ publisher, label, href, checkedAt });
}

export const OFFICIAL_PROPERTY_SOURCES = Object.freeze({
  housingLeaseAct: source(
    'National Law Information Center',
    'Housing Lease Protection Act',
    'https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=220619&urlMode=engLsInfoR&viewCls=engLsInfoR',
  ),
  transactionReportAct: source(
    'National Law Information Center',
    'Act on Report on Real Estate Transactions, Etc.',
    'https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=191659&urlMode=engLsInfoR&viewCls=engLsInfoR',
  ),
  registrationAct: source(
    'National Law Information Center',
    'Registration of Real Estate Act',
    'https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=213783&urlMode=engLsInfoR&viewCls=engLsInfoR',
  ),
  localTaxAct: source(
    'National Law Information Center',
    'Local Tax Act',
    'https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=254021&urlMode=engLsInfoR&viewCls=engLsInfoR',
  ),
  realTransactions: source(
    'Ministry of Land, Infrastructure and Transport',
    'Real Estate Transaction Management System',
    'https://rt.molit.go.kr/',
  ),
  realTransactionDownload: source(
    'Ministry of Land, Infrastructure and Transport',
    'Actual transaction data download and use notes',
    'https://rt.molit.go.kr/pt/xls/xls.do?mobileAt=',
  ),
  housingGuarantee: source(
    'Korea Housing & Urban Guarantee Corporation',
    'Housing guarantees for multicultural families',
    'https://www.khug.or.kr/khugcms/board/skin/download.jsp?fileId=7073&id=1038',
  ),
  leaseReporting: source(
    'Seoul Foreign Resident Center',
    'Housing lease contract reporting FAQ',
    'https://global.seoul.go.kr/web/news/sfaq/bordContDetail.do?brd_no=11&lang=en&mode=W&post_no=43EF590F1E2400ACE063C0A8A023B4D0',
  ),
  fixedDate: source(
    'Seoul Foreign Resident Center',
    'Fixed-date and residence-report Q&A',
    'https://global.seoul.go.kr/web/news/libr/bordContDetail.do?brd_no=9&lang=en&mode=W&post_no=02CEAC6C9B1201D6E063C0A8A023B1FE',
  ),
  proxySigning: source(
    'Seoul Foreign Resident Center',
    'Lease signing through a proxy Q&A',
    'https://global.seoul.go.kr/web/news/libr/bordContDetail.do?brd_no=9&lang=en&mode=W&post_no=0482ABB167B30106E063C0A8A02339A1',
  ),
  seoulHousing: source(
    'Seoul Metropolitan Government',
    'Wolse and jeonse housing guide',
    'https://english.seoul.go.kr/service/living/housing/1-wolse-jeonse/',
  ),
  leaseCounselling: source(
    'Seoul Metropolitan Government',
    'Multilingual lease counselling for international residents',
    'https://english.seoul.go.kr/seoul-offers-lease-counseling-in-seven-languages-to-protect-international-residents-from-jeonse-fraud-in-small-apartments-villas/',
  ),
  globalAgencies: source(
    'Seoul Metropolitan Government',
    'Global real estate agency directory',
    'https://english.seoul.go.kr/global-real-estate-agency/',
  ),
  brokerageFees: source(
    'Seoul Metropolitan Government',
    'Guide to real estate brokerage fees',
    'https://english.seoul.go.kr/seoul-guide-to-real-estate-brokerage-fees/',
  ),
  foreignAcquisition: source(
    'Easy Law Information for Foreigners',
    'Acquisition of real estate by a foreigner',
    'https://www.easylaw.go.kr/CSM/SubCnpclsCmd.laf?ccfNo=1&cciNo=1&cnpClsNo=1&csmSeq=2499',
  ),
  foreignAcquisitionLaws: source(
    'Invest Korea',
    'Laws related to foreign acquisition of real estate',
    'https://www.investkorea.org/ik-en/cntnts/i-417/web.do',
  ),
  foreignAcquisitionProcedure: source(
    'Invest Korea',
    'Acquisition procedures and required documents',
    'https://www.investkorea.org/ik-en/cntnts/i-418/web.do',
  ),
  uraPropertyData: source(
    'Urban Redevelopment Authority',
    'Private residential property data',
    'https://www.ura.gov.sg/Corporate/Property/Property-Data',
  ),
  hdbResaleData: source(
    'data.gov.sg',
    'HDB resale flat prices',
    'https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view',
  ),
});
