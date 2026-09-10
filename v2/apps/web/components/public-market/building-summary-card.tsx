import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import { buildingDisplayName, neighborhoodDisplayName } from '../../lib/public-market/seoul-display-names';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { seoulBuildingLocationHref } from '../../lib/public-market/seoul-building-location';
import { MarketSummary } from '../market-ui/market-summary';
import { PassportLink as Link } from '../passport/passport-journey';
import { BuildingSaveButton } from './building-save-button';
import styles from './building-summary-card.module.css';

type Locale = 'en' | 'ko';

const money = (value: number, locale: Locale) => locale === 'ko'
  ? value >= 100_000_000 ? `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억 원`
    : value >= 10_000 ? `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만 원` : `${Math.round(value).toLocaleString('ko-KR')}원`
  : `₩${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;

function ReportedContractMiniChart({ model, locale }: Readonly<{ model: KoreaExplorerBuildingDetailModel; locale: Locale }>) {
  // No new period medians are inferred from the retained rows. Each dot remains an
  // already reported sale, with equal area and a minimum of five rows per month.
  const rows = model.recentTransactions;
  if (model.evidence.state !== 'published' || model.selection.transaction !== 'sale' || !rows.length) return null;
  if (rows.some(row => row.transaction !== 'sale' || row.areaSqm !== rows[0]!.areaSqm || !Number.isFinite(row.primaryWon) || row.primaryWon <= 0 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.filedMonth))) return null;
  const months = [...new Set(rows.map(row => row.filedMonth))].sort();
  if (months.length < 3 || months.some(month => rows.filter(row => row.filedMonth === month).length < 5)) return null;
  const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  const start = monthIndex(months[0]!);
  const span = monthIndex(months.at(-1)!) - start;
  const max = Math.max(...rows.map(row => row.primaryWon));
  const min = Math.min(...rows.map(row => row.primaryWon));
  const range = Math.max(max - min, max * .1);
  return <figure className={styles.miniChart} data-building-summary-chart="reported-contracts">
    <figcaption>{locale === 'ko' ? '신고 거래' : 'Reported sales'} · {rows[0]!.areaSqm}㎡</figcaption>
    <svg viewBox="0 0 200 96" role="img" aria-label={locale === 'ko' ? '같은 전용면적의 실제 신고 거래. 점은 계약이며 가격 지수가 아닙니다.' : 'Actual reported contracts at the same unit size. Dots are contracts, not a price index.'}>
      <line x1="8" x2="192" y1="82" y2="82" stroke="currentColor" opacity=".15" />
      {rows.map((row, index) => <circle key={`${row.filedMonth}-${index}`} cx={8 + (monthIndex(row.filedMonth) - start) / span * 184} cy={72 - (row.primaryWon - min) / range * 56} r="3" fill="currentColor" opacity=".65"><title>{row.filedMonth} · {row.areaSqm}㎡ · {money(row.primaryWon, locale)}</title></circle>)}
    </svg>
    <div className={styles.chartDates}><span>{months[0]}</span><span>{months.at(-1)}</span></div>
    <a href="#building-transactions">{locale === 'ko' ? `${rows.length}건 거래표 보기` : `View ${rows.length} contracts`}</a>
  </figure>;
}

export function BuildingSummaryCard({ model, backHref, locale = 'en' }: Readonly<{ model: KoreaExplorerBuildingDetailModel; backHref: string; locale?: Locale }>) {
  const ko = locale === 'ko';
  const district = ko ? model.district.nameKo : model.district.nameEn;
  const transaction = ko ? { sale: '매매', jeonse: '전세', monthly: '월세' }[model.selection.transaction] : { sale: 'Sale', jeonse: 'Jeonse', monthly: 'Monthly rent' }[model.selection.transaction];
  const area = ko ? { all: '전체 면적', 'under-40': '40㎡ 미만', '40-60': '40~60㎡', '60-85': '60~85㎡', '85-plus': '85㎡ 이상' }[model.selection.areaBand] : { all: 'All sizes', 'under-40': 'Under 40 m²', '40-60': '40–60 m²', '60-85': '60–85 m²', '85-plus': '85 m² and above' }[model.selection.areaBand];
  const label = ko ? { 'sale-price': '기간 매매가격 중앙값', deposit: '기간 보증금 중앙값', 'monthly-rent': '기간 월세 중앙값' }[model.evidence.primaryMetric] : { 'sale-price': 'Period sale price median', deposit: 'Period deposit median', 'monthly-rent': 'Period monthly rent median' }[model.evidence.primaryMetric];
  const published = model.evidence.state === 'published' && model.evidence.medianWon !== null;
  const monthly = model.evidence.primaryMetric === 'monthly-rent';
  const latestMonth = model.recentTransactions.map(row => row.filedMonth).filter(month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month)).sort().at(-1);
  const asOfYear = Number(model.generatedAt.slice(0, 4));
  const years = [...new Set(model.recentTransactions.map(row => row.buildYear).filter((year): year is number => year !== null && Number.isInteger(year) && year >= 1800 && year <= asOfYear))];
  const facts = [
    { label: ko ? '전용면적 조건' : 'Unit size filter', value: area },
    { label: ko ? '주택 유형' : 'Property type', value: seoulDetailText(locale, model.building.housingType) },
    ...(latestMonth ? [{ label: ko ? '최근 계약 월' : 'Latest contract month', value: latestMonth }] : []),
    ...(years.length === 1 ? [{ label: ko ? '신고 건축연도' : 'Reported build year', value: String(years[0]) }] : []),
  ];
  const trend = ReportedContractMiniChart({ model, locale });
  return <MarketSummary
    id="building-overview"
    title={buildingDisplayName(model.building.officialName, locale)}
    location={`${neighborhoodDisplayName(model.building.neighborhoodName, locale)} · ${district}`}
    context={`${transaction} · ${area}`}
    metric={{
      label,
      value: published ? `${money(model.evidence.medianWon!, locale)}${monthly ? (ko ? ' /월' : ' /month') : ''}` : (ko ? '가격 집계 없음' : 'Price not published'),
      note: `${seoulDetailText(locale, model.evidence.sampleLabel)} · ${model.period}`,
      secondary: monthly && published && model.evidence.filedDepositMedianWon !== null
        ? `${ko ? '보증금 중앙값' : 'Deposit median'} ${money(model.evidence.filedDepositMedianWon, locale)}`
        : published && model.evidence.middleHalfLabel ? `${ko ? '중간 50%' : 'Middle half'} ${model.evidence.middleHalfLabel}` : undefined,
    }}
    facts={facts}
    trend={trend}
    locale={locale}
    actions={<><Link href={seoulBuildingLocationHref(backHref)}>{ko ? '지도에서 위치 확인' : 'View location on map'}</Link><Link href={backHref}>{ko ? `${district} 탐색으로` : `Back to ${district} Explore`}</Link><BuildingSaveButton buildingKey={`${model.district.slug}/${model.building.buildingId}`} buildingName={model.building.officialName} locale={locale} variant="detail" /></>}
  />;
}
