import 'server-only';
import { dubaiEvidenceRepositoryFromEnvironment, type DubaiEvidenceRepository } from '../dubai/evidence-repository.server';
import { dubaiProjectEvidenceForContext } from '../dubai/project-evidence.server';
import type { DubaiProjectEvidence } from '../dubai/project-evidence';
import { readTokyoAreaMapSummary, type TokyoAreaSummary } from '../japan/area-map-summary.server';
import { readCachedJapanCoverage } from '../japan/publication-cache.server';
import { TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS } from '../japan/query';
import type { JapanPublishedScope } from '../japan/repository.server';
import type { TokyoMapFilters } from '../japan/map-summary.server';
import type { MarketLocale } from '../locale/market-localization';
import type { ReviewedPropertyProfile } from './property-review-profile';
import { reviewLocation, type ReviewLocation } from './property-review-locations';
import type { DecisionPriceContext } from './property-decision-price';
import { normalizeTokyoLocality, tokyoLocalityForAddress } from './tokyo-locality';

type Dependencies = Readonly<{
  dubaiRepository: () => DubaiEvidenceRepository | null;
  dubaiProjects: typeof dubaiProjectEvidenceForContext;
  tokyoCoverage: () => Promise<JapanPublishedScope[]>;
  tokyoAreas: (city: string, year: string, quarter: string, filters: TokyoMapFilters) => Promise<TokyoAreaSummary[]>;
}>;

const defaults: Dependencies = {
  dubaiRepository: dubaiEvidenceRepositoryFromEnvironment,
  dubaiProjects: dubaiProjectEvidenceForContext,
  tokyoCoverage: readCachedJapanCoverage,
  tokyoAreas: readTokyoAreaMapSummary,
};
const text = (locale: MarketLocale, ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\s\-_,.·]/g, '');
const positive = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
const validCount = (value: number) => Number.isSafeInteger(value) && value > 0;

function unavailable(profile: ReviewedPropertyProfile, locale: MarketLocale): DecisionPriceContext {
  const currency = ({ 'kr-seoul': 'KRW', 'sg-singapore': 'SGD', 'ae-dubai': 'AED', 'jp-tokyo': 'JPY' } as const)[profile.market_id];
  return { scope: 'unavailable', label: text(locale, '가격 자료 확인 중', 'Price evidence unavailable', '价格资料待确认'),
    currency, amount: null, count: null, period: null, unit: 'total',
    basis: text(locale, '공개된 거래 표본을 불러오지 못했습니다.', 'Published transaction evidence could not be loaded.', '暂时无法读取已公开成交资料。') };
}

function dubaiBasis(locale: MarketLocale, housing: DubaiProjectEvidence['housing'], stage: DubaiProjectEvidence['stage']) {
  const home = housing === 'villa' ? text(locale, '빌라', 'villas', '别墅') : text(locale, '아파트', 'apartments', '公寓');
  const completion = stage === 'ready' ? text(locale, '준공', 'ready', '现房') : text(locale, '오프플랜', 'off-plan', '期房');
  return text(locale, `DLD 등록 매매 · ${home} · ${completion} · 면적 혼합`, `DLD registered sales · ${home} · ${completion} · mixed sizes`, `DLD 登记成交 · ${home} · ${completion} · 面积混合`);
}

function dubaiPrice(profile: ReviewedPropertyProfile, location: ReviewLocation, locale: MarketLocale, deps: Dependencies): DecisionPriceContext {
  const repository = deps.dubaiRepository();
  if (!repository) return unavailable(profile, locale);
  const context = repository.getContext();
  const period = `${context.comparisonPeriod.from} – ${context.comparisonPeriod.to}`;
  const project = location.projectId ? deps.dubaiProjects(context).find(candidate => candidate.id === location.projectId) : undefined;
  if (project && positive(project.medianPriceAed) && project.n >= context.publicationMinimum && validCount(project.n)) {
    return { scope: 'property', label: text(locale, '단지 거래 중위가', 'Project transaction median', '项目成交中位价'),
      currency: 'AED', amount: project.medianPriceAed, count: project.n, period, unit: 'total',
      basis: dubaiBasis(locale, project.housing, project.stage), sourceUrl: context.sourceUrl,
      note: text(locale, '면적·층·조망이 섞인 거래입니다. 같은 조건의 매물과 비교하세요.',
        'Transactions mix sizes, floors and views. Compare the price with a matching unit.', '成交包含不同面积、楼层及景观，应与条件相近的房源比较。') };
  }
  // Aliases come from the verified area registry. A project-name guess never establishes identity.
  const areaKey = normalize(location.areaSlug ?? '');
  const area = repository.getArea(location.areaSlug ?? '') ?? repository.listAreas().find(candidate =>
    areaKey && candidate.searchAliases.some(alias => normalize(alias) === areaKey));
  if (!area) return unavailable(profile, locale);
  const housing = location.projectId?.includes('-villa-') ? 'villa' : 'apartment';
  const segment = area.segments.find(candidate => candidate.housing === housing);
  if (!segment) return unavailable(profile, locale);
  // Skyflame is an explicitly documented off-plan group; it has no verified individual project match.
  const prefersOffPlan = location.projectId?.endsWith('-off-plan') || profile.id === 'ae-skyflame-1';
  const choices = prefersOffPlan ? (['off-plan', 'ready'] as const) : (['ready', 'off-plan'] as const);
  for (const stage of choices) {
    const sale = stage === 'ready' ? segment.sales.ready : segment.sales.offPlan;
    if (!sale || !positive(sale.medianPriceAed) || !validCount(sale.n) || sale.n < context.publicationMinimum) continue;
    const range = positive(sale.priceP25Aed) && positive(sale.priceP75Aed)
      && sale.priceP25Aed <= sale.medianPriceAed && sale.priceP75Aed >= sale.medianPriceAed
      ? { low: sale.priceP25Aed, high: sale.priceP75Aed } : null;
    return { scope: 'area', label: text(locale, `${area.name} 지역 중위가`, `${area.name} area median`, `${area.name} 区域中位价`),
      currency: 'AED', amount: sale.medianPriceAed, count: sale.n, period, unit: 'total', range,
      basis: dubaiBasis(locale, segment.housing, stage), sourceUrl: context.sourceUrl,
      note: text(locale, '이 단지의 거래가 아닌 지역 참고가격입니다. 주택 면적과 인도 조건에 따라 차이가 큽니다.',
        'An area reference, not this project’s transaction price. Unit size and delivery terms can change the comparison.',
        '此价格仅供区域参考，并非该项目成交价；面积及交付条件会影响比较。') };
  }
  return unavailable(profile, locale);
}

const tokyoFilters: TokyoMapFilters = { q: '', type: TOKYO_CONDOMINIUM_TYPE, minArea: null, maxArea: null };

async function tokyoPrice(profile: ReviewedPropertyProfile, location: ReviewLocation, locale: MarketLocale, deps: Dependencies): Promise<DecisionPriceContext> {
  const ward = TOKYO_WARDS.find(([code]) => code === location.wardCode);
  if (!ward) return unavailable(profile, locale);
  const periods = (await deps.tokyoCoverage()).filter(scope => scope.city === ward[0] && scope.sourceCount > 0)
    .sort((a, b) => Number(b.year) - Number(a.year) || Number(b.quarter) - Number(a.quarter));
  const locality = tokyoLocalityForAddress(location.address);
  for (const scope of periods) {
    const areas = await deps.tokyoAreas(scope.city, scope.year, scope.quarter, tokyoFilters);
    const matching = areas.filter(row => row.city === scope.city && row.year === scope.year && row.quarter === scope.quarter
      && positive(row.median) && validCount(row.count));
    const neighbourhood = locality ? matching.find(row => row.district !== null
      && locality.some(alias => normalizeTokyoLocality(alias) === normalizeTokyoLocality(row.district!))) : undefined;
    const cohort = neighbourhood ?? matching.find(row => row.district === null);
    if (!cohort) continue;
    const name = cohort.district ?? ward[1];
    const sourceQuery = new URLSearchParams({ city: scope.city, year: scope.year, quarter: scope.quarter, language: 'en', priceClassification: '01' });
    return { scope: 'area', label: text(locale, `${name} 지역 중위가`, `${name} area median`, `${name} 区域中位价`),
      currency: 'JPY', amount: cohort.median, count: cohort.count, period: `${scope.year} Q${scope.quarter}`, unit: 'total',
      basis: text(locale, 'MLIT 중고 맨션 거래 · 면적·연식 혼합', 'MLIT pre-owned condominium transactions · mixed sizes and ages', 'MLIT 二手公寓成交 · 面积及楼龄混合'),
      sourceUrl: `https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?${sourceQuery.toString()}`,
      note: text(locale, '익명화된 지역 거래입니다. 이 건물의 실거래가나 적정가를 뜻하지 않습니다.',
        'Anonymised area transactions. This is neither a recorded sale at this building nor its fair value.',
        '匿名化区域成交资料，不代表本楼栋成交价或合理估值。') };
  }
  return unavailable(profile, locale);
}

/** Uses only current activated publications or a verified installed snapshot; never writes data. */
export async function namedPropertyDecisionPrice(profile: ReviewedPropertyProfile, locale: MarketLocale = 'en', deps: Dependencies = defaults): Promise<DecisionPriceContext> {
  const location = reviewLocation(profile.id);
  if (!location) return unavailable(profile, locale);
  try {
    if (profile.market_id === 'ae-dubai') return dubaiPrice(profile, location, locale, deps);
    if (profile.market_id === 'jp-tokyo') return await tokyoPrice(profile, location, locale, deps);
  } catch {
    // A missing publication/database must remain missing, never become a zero or a catalogue estimate.
    return unavailable(profile, locale);
  }
  return unavailable(profile, locale);
}
