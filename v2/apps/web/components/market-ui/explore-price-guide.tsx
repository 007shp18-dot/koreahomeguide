import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './explore-controls.module.css';

const COPY = {
  en: {
    sale: 'Recorded sales', jeonse: 'Jeonse deposits', monthly: 'Monthly rents',
    tokyo: 'Neighbourhood medians · Individual sale totals · JPY',
    singapore: 'URA private homes · Median sale price · SGD',
    dubai: 'Area median sale prices · AED · Rent shown separately per year',
    seoulSale: 'Sale prices · KRW · Area summaries use medians',
    seoulJeonse: 'Refundable deposits · KRW · Area summaries use medians',
    seoulMonthly: 'Rent per month · KRW · Deposits shown separately',
  },
  ko: {
    sale: '매매 실거래가', jeonse: '전세 보증금', monthly: '월세 실거래가',
    tokyo: '동네별 중앙값 · 개별 기록은 매매 총액 · 일본 엔(JPY)',
    singapore: 'URA 민간 주택 · 매매가 중앙값 · 싱가포르 달러(SGD)',
    dubai: '지역별 매매가 중앙값 · 디르함(AED) · 임대료는 연간 금액으로 별도 표시',
    seoulSale: '매매 금액 · 원(KRW) · 지역 요약은 중앙값',
    seoulJeonse: '반환형 보증금 · 원(KRW) · 지역 요약은 중앙값',
    seoulMonthly: '월 임대료 · 원(KRW) · 보증금 별도 표시',
  },
  'zh-CN': {
    sale: '买卖成交价', jeonse: '全租押金', monthly: '月租成交价',
    tokyo: '街区中位数 · 单笔记录为成交总价 · 日元(JPY)',
    singapore: 'URA 私人住宅 · 成交价中位数 · 新加坡元(SGD)',
    dubai: '区域成交价中位数 · 迪拉姆(AED) · 租金按年另列',
    seoulSale: '成交总价 · 韩元(KRW) · 区域摘要采用中位数',
    seoulJeonse: '可退还押金 · 韩元(KRW) · 区域摘要采用中位数',
    seoulMonthly: '每月租金 · 韩元(KRW) · 押金另列',
  },
} as const;

export function ExplorePriceGuide({ locale = 'en', market, transaction = 'sale' }: {
  locale?: MarketLocale;
  market: 'seoul' | 'singapore' | 'dubai' | 'tokyo';
  transaction?: 'sale' | 'jeonse' | 'monthly';
}) {
  const copy = COPY[locale];
  const kind = market === 'seoul' ? transaction : 'sale';
  const detail = market === 'seoul'
    ? copy[kind === 'sale' ? 'seoulSale' : kind === 'jeonse' ? 'seoulJeonse' : 'seoulMonthly']
    : copy[market];
  return <p className={styles.priceGuide} data-explore-price-guide={market} data-transaction-kind={kind}>
    <strong>{copy[kind]}</strong><span>{detail}</span>
  </p>;
}
