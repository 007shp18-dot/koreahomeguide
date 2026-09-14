import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import { buildingDisplayName, neighborhoodDisplayName } from '../../lib/public-market/seoul-display-names';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { seoulBuildingLocationHref } from '../../lib/public-market/seoul-building-location';
import { MarketSummary } from '../market-ui/market-summary';
import { PassportLink as Link } from '../passport/passport-journey';
import { BuildingSaveButton } from './building-save-button';

type Locale = 'en' | 'ko' | 'zh-CN';

const money = (value: number, locale: Locale) => locale === 'ko'
  ? value >= 100_000_000 ? `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억 원`
    : value >= 10_000 ? `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만 원` : `${Math.round(value).toLocaleString('ko-KR')}원`
  : `₩${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;

export function BuildingSummaryCard({ model, backHref, locale = 'en' }: Readonly<{ model: KoreaExplorerBuildingDetailModel; backHref: string; locale?: Locale }>) {
  const ko = locale === 'ko';
  const district = ko ? model.district.nameKo : model.district.nameEn;
  const transaction = ko ? { sale: '매매', jeonse: '전세', monthly: '월세' }[model.selection.transaction] : locale === 'zh-CN' ? { sale: '买卖', jeonse: '全租', monthly: '月租' }[model.selection.transaction] : { sale: 'Sale', jeonse: 'Jeonse', monthly: 'Monthly rent' }[model.selection.transaction];
  const area = ko ? { all: '전체 면적', 'under-40': '40㎡ 미만', '40-60': '40~60㎡', '60-85': '60~85㎡', '85-plus': '85㎡ 이상' }[model.selection.areaBand] : locale === 'zh-CN' ? { all: '全部面积', 'under-40': '40㎡以下', '40-60': '40–60㎡', '60-85': '60–85㎡', '85-plus': '85㎡及以上' }[model.selection.areaBand] : { all: 'All sizes', 'under-40': 'Under 40 m²', '40-60': '40–60 m²', '60-85': '60–85 m²', '85-plus': '85 m² and above' }[model.selection.areaBand];
  const label = ko ? { 'sale-price': '기간 매매가격 중앙값', deposit: '기간 보증금 중앙값', 'monthly-rent': '기간 월세 중앙값' }[model.evidence.primaryMetric] : locale === 'zh-CN' ? { 'sale-price': '期间成交价中位数', deposit: '期间押金中位数', 'monthly-rent': '期间月租中位数' }[model.evidence.primaryMetric] : { 'sale-price': 'Period sale price median', deposit: 'Period deposit median', 'monthly-rent': 'Period monthly rent median' }[model.evidence.primaryMetric];
  const published = model.evidence.state === 'published' && model.evidence.medianWon !== null;
  const monthly = model.evidence.primaryMetric === 'monthly-rent';
  const latestMonth = model.recentTransactions.map(row => row.filedMonth).filter(month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month)).sort().at(-1);
  const asOfYear = Number(model.generatedAt.slice(0, 4));
  const years = [...new Set(model.recentTransactions.map(row => row.buildYear).filter((year): year is number => year !== null && Number.isInteger(year) && year >= 1800 && year <= asOfYear))];
  const facts = [
    { label: ko ? '전용면적 조건' : locale === 'zh-CN' ? '专有面积筛选' : 'Unit size filter', value: area },
    { label: ko ? '주택 유형' : locale === 'zh-CN' ? '住宅类型' : 'Property type', value: seoulDetailText(locale, model.building.housingType) },
    ...(latestMonth ? [{ label: ko ? '최근 계약 월' : locale === 'zh-CN' ? '最新合同月份' : 'Latest contract month', value: latestMonth }] : []),
    ...(years.length === 1 ? [{ label: ko ? '신고 건축연도' : locale === 'zh-CN' ? '申报建造年份' : 'Reported build year', value: String(years[0]) }] : []),
  ];
  return <MarketSummary
    id="building-overview"
    title={buildingDisplayName(model.building.officialName, locale)}
    location={`${neighborhoodDisplayName(model.building.neighborhoodName, locale)} · ${district}`}
    context={`${transaction} · ${area}`}
    metric={{
      label,
      value: published ? `${money(model.evidence.medianWon!, locale)}${monthly ? (ko ? ' /월' : locale === 'zh-CN' ? ' /月' : ' /month') : ''}` : (ko ? '가격 집계 없음' : locale === 'zh-CN' ? '暂无公布价格' : 'Price not published'),
      note: `${seoulDetailText(locale, model.evidence.sampleLabel)} · ${model.period}`,
      secondary: monthly && published && model.evidence.filedDepositMedianWon !== null
        ? `${ko ? '보증금 중앙값' : locale === 'zh-CN' ? '押金中位数' : 'Deposit median'} ${money(model.evidence.filedDepositMedianWon, locale)}`
        : published && model.evidence.middleHalfLabel ? `${ko ? '중간 50%' : locale === 'zh-CN' ? '中间50%区间' : 'Middle half'} ${model.evidence.middleHalfLabel}` : undefined,
    }}
    facts={facts}
    locale={locale}
    actions={<><Link href={seoulBuildingLocationHref(backHref)}>{ko ? '지도에서 위치 확인' : locale === 'zh-CN' ? '在地图上查看位置' : 'View location on map'}</Link><Link href={backHref}>{ko ? `${district} 탐색으로` : locale === 'zh-CN' ? `返回${district}探索` : `Back to ${district} Explore`}</Link><BuildingSaveButton buildingKey={`${model.district.slug}/${model.building.buildingId}`} buildingName={model.building.officialName} locale={locale} variant="detail" /></>}
  />;
}
