import { getMarketCapability, type CapabilityState, type MarketId } from '@signedprice/market-core';

import { MARKET_PHOTOS, type MarketPhoto } from '../../components/market-representative-photo';

export type ThreeMarketHomeAction = Readonly<{ label: string; href: string }>;

export type ThreeMarketHomePanel = Readonly<{
  id: MarketId;
  city: string;
  position: string;
  photo: MarketPhoto;
  summary: string;
  evidenceState: CapabilityState | 'insufficient';
  evidenceTitle: string;
  evidenceValue: string | null;
  evidenceNote: string;
  primaryAction: ThreeMarketHomeAction;
  secondaryAction: ThreeMarketHomeAction | null;
}>;

export type ThreeMarketHomeModel = Readonly<{
  locale: 'en' | 'zh-CN';
  headline: string;
  lead: string;
  markets: readonly ThreeMarketHomePanel[];
}>;

type Input = Readonly<{
  locale: 'en' | 'zh-CN';
  seoulMetric: Readonly<{ label: string; value: string; context: string }> | null;
}>;

function freezeModel(input: ThreeMarketHomeModel): ThreeMarketHomeModel {
  for (const market of input.markets) {
    Object.freeze(market.primaryAction);
    if (market.secondaryAction !== null) Object.freeze(market.secondaryAction);
    Object.freeze(market);
  }
  Object.freeze(input.markets);
  return Object.freeze(input);
}

export function createThreeMarketHomeModel(input: Input): ThreeMarketHomeModel {
  const singaporeExplore = getMarketCapability('sg-singapore', 'explore', null);
  const singaporeCheck = getMarketCapability('sg-singapore', 'check', null);
  const dubaiTransactions = getMarketCapability('ae-dubai', 'transaction_detail', null);
  const zh = input.locale === 'zh-CN';

  return freezeModel({
    locale: input.locale,
    headline: zh ? '做决定之前，先看懂市场。' : 'See the market before you make the move.',
    lead: zh
      ? '在首尔、新加坡和迪拜，用清楚标注来源与范围的房地产依据做决定。'
      : 'Property evidence for decisions across Seoul, Singapore and Dubai, with source and coverage kept visible.',
    markets: [
      {
        id: 'kr-seoul',
        city: zh ? '首尔' : 'Seoul',
        position: '01',
        photo: MARKET_PHOTOS.seoul,
        summary: zh ? '查看已申报的买卖、全租与月租依据。' : 'Read reported sales, jeonse and monthly rent.',
        evidenceState: input.seoulMetric === null ? 'insufficient' : 'available',
        evidenceTitle: input.seoulMetric?.label ?? (zh ? '首尔成交依据' : 'Seoul transaction evidence'),
        evidenceValue: input.seoulMetric?.value ?? null,
        evidenceNote: input.seoulMetric?.context ?? (zh ? '当前没有足够依据显示代表性数字。' : 'No representative figure is shown without sufficient current evidence.'),
        primaryAction: { label: zh ? '探索首尔' : 'Explore Seoul', href: '/kr/seoul/explore/' },
        secondaryAction: { label: zh ? '查询价格' : 'Check a price', href: '/kr/seoul/check/' },
      },
      {
        id: 'sg-singapore',
        city: zh ? '新加坡' : 'Singapore',
        position: '02',
        photo: MARKET_PHOTOS.singapore,
        summary: zh ? '分开查看私人住宅与 HDB 公共住宅。' : 'Compare private homes and HDB on separate evidence.',
        evidenceState: singaporeExplore?.state ?? 'insufficient',
        evidenceTitle: zh ? '私人住宅与 HDB 数据' : 'Private residential and HDB evidence',
        evidenceValue: null,
        evidenceNote: zh ? '两个住宅板块的覆盖范围与更新周期分别显示。' : 'Coverage and release periods are disclosed separately for each housing sector.',
        primaryAction: { label: zh ? '探索新加坡' : 'Explore Singapore', href: singaporeExplore?.publicHref ?? '/sg/' },
        secondaryAction: singaporeCheck?.publicHref === null || singaporeCheck === null
          ? null
          : { label: zh ? '查询价格' : 'Check a price', href: singaporeCheck.publicHref },
      },
      {
        id: 'ae-dubai',
        city: zh ? '迪拜' : 'Dubai',
        position: '03',
        photo: MARKET_PHOTOS.dubai,
        summary: zh ? '先了解市场和项目背景，再判断投资机会。' : 'Review market and project context before investing.',
        evidenceState: dubaiTransactions?.state ?? 'rights_blocked',
        evidenceTitle: zh ? '市场与项目研究' : 'Market and project research',
        evidenceValue: null,
        evidenceNote: zh ? '详细交易数据展示权确认前，不提供价格查询。' : 'Transaction detail remains unavailable until display rights are cleared.',
        primaryAction: { label: zh ? '探索迪拜' : 'Explore Dubai', href: '/ae/dubai/' },
        secondaryAction: { label: zh ? '阅读迪拜研究' : 'Read Dubai research', href: '/insights/' },
      },
    ],
  });
}
