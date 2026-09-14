import 'server-only';
import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';
import type { KoreaEvidenceAreaBand } from '@signedprice/korea-rent';
import { koreaEvidenceRepositoriesFromEnvironment, type KoreaEvidenceRepositories } from '../public-market/korea-evidence-repositories.server';
import type { SingaporeSnapshotRepository } from '../singapore/snapshot-repository.server';
import type { MarketLocale } from '../locale/market-localization';
import type { DecisionPriceContext } from './property-decision-price';

export type LocalizedDecisionPriceContext = Readonly<Record<MarketLocale, DecisionPriceContext>>;
const locales = ['en', 'ko', 'zh-CN'] as const;
const text = (locale: MarketLocale, ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
const localized = (build: (locale: MarketLocale) => DecisionPriceContext): LocalizedDecisionPriceContext => Object.fromEntries(locales.map(locale => [locale, build(locale)])) as LocalizedDecisionPriceContext;

/** Broaden only to a separately published cohort; never aggregate hidden medians. */
export function koreaDecisionPriceFallback(input: Readonly<{
  district: string;
  buildingId: string;
  housingType: string;
  transaction: 'sale' | 'jeonse' | 'monthly';
  areaBand: KoreaEvidenceAreaBand;
  contractGroup: 'all' | 'new' | 'renewal' | 'unknown' | 'not-applicable';
  repositories?: KoreaEvidenceRepositories;
}>): LocalizedDecisionPriceContext | undefined {
  const repositories = input.repositories ?? koreaEvidenceRepositoriesFromEnvironment();
  const repository = input.transaction === 'sale' ? repositories.sale : repositories.rent;
  if (!repository) return undefined;
  const district = getSeoulDistrictBySlug(input.district);
  if (!district) return undefined;
  const building = repository.listBuildingRecords().find(row => row.districtSlug === input.district && row.buildingId === input.buildingId && row.housingType === input.housingType);
  const area = repository.listAreaRecords().find(row => row.scope === 'district' && row.districtSlug === input.district && row.housingType === input.housingType);
  const variants = [
    { areaBand: input.areaBand, contractGroup: input.contractGroup },
    { areaBand: 'all', contractGroup: input.contractGroup },
    { areaBand: input.areaBand, contractGroup: 'all' },
    { areaBand: 'all', contractGroup: 'all' },
  ];
  for (const [scope, record] of [['property', building], ['area', area]] as const) {
    if (!record) continue;
    for (const variant of variants) {
      const cohort = record.cohorts.find(candidate => candidate.areaBand === variant.areaBand && ('price' in candidate || candidate.transaction === input.transaction && candidate.contractGroup === variant.contractGroup));
      const distribution = cohort && ('price' in cohort ? cohort.price : cohort.primary);
      if (!distribution?.published || !Number.isFinite(distribution.med) || distribution.med <= 0) continue;
      return localized(locale => {
        const place = scope === 'area' ? locale === 'ko' ? district.nameKo : district.nameEn : text(locale, '같은 단지', 'Same property', '同一项目');
        const deal = input.transaction === 'sale' ? text(locale, '매매', 'sale price', '买卖价格') : input.transaction === 'jeonse' ? text(locale, '전세 보증금', 'jeonse deposit', '全租押金') : text(locale, '월세 · 월', 'monthly rent', '月租');
        const home = input.housingType === 'apartment' ? text(locale, '아파트', 'apartments', '公寓') : input.housingType === 'officetel' ? text(locale, '오피스텔', 'officetels', '商住公寓') : input.housingType === 'detached' ? text(locale, '단독주택', 'detached homes', '独立住宅') : text(locale, '연립·다세대', 'villas / multifamily homes', '多户住宅');
        const size = variant.areaBand === 'all' ? text(locale, '전체 면적', 'all sizes', '全部面积') : variant.areaBand === 'under-40' ? '<40㎡' : variant.areaBand === '85-plus' ? '≥85㎡' : `${variant.areaBand.replace('-', '–')}㎡`;
        const contract = input.transaction === 'sale' ? '' : variant.contractGroup === 'all' ? text(locale, '전체 계약', 'all contracts', '全部合同') : variant.contractGroup === 'new' ? text(locale, '신규 계약', 'new contracts', '新签合同') : variant.contractGroup === 'renewal' ? text(locale, '갱신 계약', 'renewals', '续约合同') : text(locale, '미분류 계약', 'unclassified contracts', '未分类合同');
        return {
          scope, currency: 'KRW', amount: distribution.med, count: distribution.n, period: repository.getArtifact().period, unit: 'total',
          label: text(locale, `${place} ${deal} 중앙값`, `${place} · median ${deal}`, `${place} · ${deal}中位数`),
          range: { low: distribution.p25, high: distribution.p75 }, basis: [home, size, contract].filter(Boolean).join(' · '),
          note: scope === 'area'
            ? text(locale, '선택한 단지 조건의 가격은 공개 기준에 미달합니다. 표시 금액은 같은 구·주택 유형의 별도 집계이며, 이 단지 가격을 뜻하지 않습니다.', 'The selected property cohort is not publishable. This separate district and housing-type aggregate is context, not this property’s price.', '所选项目样本未达到公布标准；此处为同区同住宅类型的独立汇总，不代表本项目价格。')
            : text(locale, '선택한 세부 조건의 가격 대신, 표시된 면적·계약 범위로 넓힌 공개 거래를 보여줍니다.', 'The selected cohort is too small; this published property aggregate uses the wider size and contract scope shown above.', '所选细分样本不足；此处展示按上方面积及合同范围扩大后的已公开项目成交。'),
        };
      });
    }
  }
  return undefined;
}

export function singaporeDecisionPriceFallback(repository: SingaporeSnapshotRepository, segment: string): LocalizedDecisionPriceContext | undefined {
  const region = repository.getSegment(segment);
  if (!region?.published || !Number.isFinite(region.medianPriceSgd) || region.medianPriceSgd <= 0) return undefined;
  return localized(locale => ({
    scope: 'area', currency: 'SGD', amount: region.medianPriceSgd, count: region.n, period: repository.getContext().period, unit: 'total',
    label: text(locale, `${region.segment} 권역 매매 중앙값`, `${region.segment} region sale median`, `${region.segment} 区域买卖中位数`),
    range: { low: region.p25PriceSgd, high: region.p75PriceSgd },
    basis: text(locale, '민간 주택 · 전체 프로젝트·면적', 'Private homes · all projects and sizes', '私人住宅 · 全部项目及面积'),
    note: text(locale, '이 프로젝트의 표본은 공개 기준에 미달합니다. 표시 금액은 권역 전체 거래 집계이며, 프로젝트 가격으로 해석하지 않습니다.', 'This project has too few transactions to publish a median. The amount is a separate region-wide aggregate, not this project’s price.', '本项目成交不足以公布中位数；此金额为整个区域的独立汇总，不代表本项目价格。'),
  }));
}
