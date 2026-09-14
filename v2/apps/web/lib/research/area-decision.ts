import type { MarketLocale } from '../locale/market-localization';
import type { LivingContext } from './living-context';
import type { ReviewedPropertyProfile } from './property-review-profile';
import type { PropertyReview, ReviewPoint, ReviewText } from './property-review';
import { getPropertyDecision, type DecisionItem, type PropertyDecision } from './property-decision';
import { decisionText, type DecisionPersona } from './property-decision-topics';

type AreaInput = Readonly<{
  market: PropertyReview['marketId'];
  areaKey: string;
  name: ReviewText;
  /** The caller must match the requested area against verified catalogue locations. */
  profiles: readonly ReviewedPropertyProfile[];
  checkedOn?: string;
}>;
export type AreaDecisionProfile = LivingContext & { review: PropertyReview };

const sections = ['transport', 'schools', 'daily', 'costs'] as const;
const namespace = (reviewId: string, sourceId: string) => `${reviewId}::${sourceId}`;
const prefix = (name: string, value: string) => `「${name}」 ${value}`;
const unprefix = (value: string) => value.replace(/^「[^」]+」\s*/, '');
const propertyName = (value: string) => /^「([^」]+)」/.exec(value)?.[1];

function sourcedPoint(review: PropertyReview, point: ReviewPoint): ReviewPoint {
  return { ...point, title: { ko: prefix(review.name.ko, point.title.ko), en: prefix(review.name.en, point.title.en) },
    sourceIds: point.sourceIds.map(id => namespace(review.id, id)) };
}

/** Interleave examples without converting their building-specific facts into area-wide claims. */
function interleave(reviews: readonly PropertyReview[], select: (review: PropertyReview) => readonly ReviewPoint[]): ReviewPoint[] {
  const result: ReviewPoint[] = [];
  const max = Math.max(0, ...reviews.map(review => select(review).length));
  for (let index = 0; index < max; index += 1) {
    for (const review of reviews) {
      const point = select(review)[index];
      if (point) result.push(sourcedPoint(review, point));
    }
  }
  return result;
}

/** A report about named examples within an area. No scores, prices or area-wide conclusions are inferred. */
export function areaDecisionProfile({ market, areaKey, name, profiles, checkedOn }: AreaInput): AreaDecisionProfile | null {
  const unique = new Map(profiles.filter(profile => profile.market_id === market && profile.review.marketId === market)
    .map(profile => [profile.id, profile.review]));
  const reviews = [...unique.values()];
  if (!reviews.length) return null;
  const id = `area-${market}-${areaKey}`;
  const oldestCheck = reviews.map(review => review.checkedOn).sort()[0]!;
  const sourceRows = reviews.flatMap(review => review.sources.map(source => ({ ...source,
    id: namespace(review.id, source.id), title: `${review.name.en} — ${source.title}` })));
  const summary = {
    ko: `${name.ko}의 검토 단지 ${reviews.length}곳을 같은 질문으로 비교합니다. 아래 조건은 이름이 붙은 단지의 사례이며, 지역 전체에 공통으로 적용되는 평가가 아닙니다.`,
    en: `Compare ${reviews.length} reviewed properties in ${name.en} using the same questions. Each finding belongs to the named property; it is not a conclusion about the entire area.`,
  };
  const review: PropertyReview = {
    id, marketId: market, name, area: name, checkedOn: checkedOn ?? oldestCheck,
    verdict: { ko: '지역 안에서도 단지별 조건을 비교하세요', en: 'Compare the differences between properties in this area' },
    summary,
    bestFor: { ko: '지역을 고른 뒤 실제 단지의 생활 조건과 비용을 좁혀보려는 매수자.', en: 'Buyers narrowing an area choice to specific homes, daily routines and costs.' },
    holdFor: { ko: '개별 매물의 가격 판단에는 같은 조건의 거래와 계약 확인이 더 필요합니다.', en: 'A specific purchase still needs matched transactions and contract checks.' },
    strengths: interleave(reviews, item => item.strengths),
    tradeoffs: interleave(reviews, item => item.tradeoffs),
    sections: {
      transport: interleave(reviews, item => item.sections.transport),
      schools: interleave(reviews, item => item.sections.schools),
      daily: interleave(reviews, item => item.sections.daily),
      costs: interleave(reviews, item => item.sections.costs),
    },
    comparisons: reviews.map(item => ({ name: item.name, reason: item.bestFor, condition: item.holdFor })),
    sources: sourceRows,
  };
  return { id, market_id: market, name_ko: name.ko, canonical_name: name.en, area: name.en,
    headline: review.verdict.en, checked_on: review.checkedOn,
    identity_note: 'Area context built from explicitly named, reviewed examples. Findings retain their individual property scope.',
    publication_status: 'published', linked_entity_ids: [], facts: [], analysis: [], field_checks: [], review,
    sources: Object.fromEntries(sourceRows.map(source => [source.id, {
      title: source.title, url: source.url, scope: source.note.en, checked_on: source.checkedOn,
    }])) };
}

const areaLenses = {
  'jp-tokyo': {
    family: decisionText('통학과 장보기의 동선을 먼저 비교하고, 같은 생활권에서도 관리비와 수선적립금이 얼마나 다른지 보세요.', 'Compare school and grocery routes first, then the different management fees and repair reserves within the same neighbourhood.', '先比较上学和购物路线，再看同一生活圈内不同楼盘的管理费与维修储备金。'),
    couple: decisionText('역 이름보다 각 건물에서 승강장까지 가는 길과 퇴근 후 동선을 비교하세요. 방을 새로 고쳤더라도 공용부의 수선 계획은 별도로 봐야 합니다.', 'Compare the journey from each building to the platform and the evening routine. A renovated apartment still needs a separate check of planned work on shared parts.', '应比较从具体楼栋到站台的路线和下班后的日常行程。室内重新装修，也仍需另查公共部分的修缮计划。'),
    investor: decisionText('지역 중위가로 개별 타워의 값을 정할 수는 없습니다. 후보마다 권리 형태와 수선적립금, 예정 공사를 맞춰야 싼 매물이 실제로도 덜 드는지 드러납니다.', 'An area median cannot value a particular tower. Compare tenure, reserve contributions and planned work for each candidate to see whether the cheaper purchase also costs less to hold.', '区域中位价不能为某座塔楼直接定价。应逐一比较权利性质、维修储备金和计划工程，判断低价房的持有成本是否也更低。'),
  },
  'ae-dubai': {
    family: decisionText('아이의 입학 시기와 주택 인도일을 먼저 맞추세요. 같은 지역이라도 이미 운영 중인 학교·상가와 입주 뒤 생길 시설은 생활 계획에서 다르게 다뤄야 합니다.', 'Start with the child’s school-entry date and the home’s delivery date. Existing schools and shops have a different place in the family plan from facilities expected after move-in.', '先核对孩子入学时间与住房交付时间。已经运营的学校商店，与入住后才计划开业的设施，需要分别考虑。'),
    couple: decisionText('각 단지 출입구에서 출근하고 저녁에 장을 봐서 돌아오는 길을 비교하세요. 차량이 필요한 동선이라면 주차와 냉방을 포함한 월 부담도 함께 봐야 합니다.', 'Compare the commute from each project entrance and the route home with groceries. Where a car is needed, include parking and cooling in the monthly budget.', '应比较各项目出入口的通勤路线，以及晚间购物后的回家路线。需要开车时，月度预算还应包含停车和制冷费用。'),
    investor: decisionText('준공 주택과 오프플랜을 같은 수익 일정에 놓지 마세요. 분납·인도·임대 시작 시점과 소유자가 내는 서비스차지를 후보별로 맞춰 비교해야 합니다.', 'Keep ready homes and off-plan projects on separate income timelines. Compare instalments, delivery, rental start and owner-paid service charges for each candidate.', '现房与期房不能套用同一收益时间表。应按项目分别比较分期付款、交付、开始出租的时间与业主承担的服务费。'),
  },
} as const;

function originalPoint(review: PropertyReview, pointId: string | undefined): ReviewPoint | undefined {
  if (!pointId) return undefined;
  const [section, rawIndex] = pointId.split(':');
  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 0) return undefined;
  if (section === 'strengths' || section === 'tradeoffs') return review[section][index];
  return sections.includes(section as typeof sections[number]) ? review.sections[section as typeof sections[number]][index] : undefined;
}

/** Preserve ranking by the evidence topic, then put each named example back into every rendered item. */
export function getAreaDecision(review: PropertyReview, persona: DecisionPersona, locale: MarketLocale): PropertyDecision {
  const strippedPoint = (point: ReviewPoint): ReviewPoint => ({ ...point,
    title: { ko: unprefix(point.title.ko), en: unprefix(point.title.en) } });
  const analysisReview: PropertyReview = { ...review,
    strengths: review.strengths.map(strippedPoint), tradeoffs: review.tradeoffs.map(strippedPoint),
    sections: { transport: review.sections.transport.map(strippedPoint), schools: review.sections.schools.map(strippedPoint),
      daily: review.sections.daily.map(strippedPoint), costs: review.sections.costs.map(strippedPoint) } };
  const decision = getPropertyDecision(analysisReview, persona, locale);
  const name = review.name[locale === 'ko' ? 'ko' : 'en'];
  const scope = decisionText(`아래 내용은 ${name} 안에서 검토한 단지 사례입니다. 각 항목의 단지명을 기준으로 읽으세요.`,
    `These are reviewed property examples in ${name}. Each finding applies to the property named beside it.`,
    `以下为 ${name} 内已核查楼盘的具体例子，各项内容仅适用于所标注的楼盘。`)[locale];
  const lens = review.marketId === 'jp-tokyo' || review.marketId === 'ae-dubai' ? areaLenses[review.marketId][persona][locale] : decision.verdict.body;
  const verdictLabel = {
    family: decisionText('가족의 하루 동선부터 비교', 'Start with the family’s daily routine', '先比较家庭每天的生活路线'),
    couple: decisionText('출퇴근과 생활비로 후보 비교', 'Compare commuting and daily costs', '按通勤与生活成本比较备选楼盘'),
    investor: decisionText('가격과 보유 조건으로 후보 비교', 'Compare price and ownership terms', '按价格与持有条件比较备选楼盘'),
  }[persona][locale];
  const restoreName = (item: DecisionItem): DecisionItem => {
    const point = originalPoint(review, item.evidence?.pointId);
    const sourceName = point ? propertyName(point.title[locale === 'ko' ? 'ko' : 'en']) : undefined;
    if (!sourceName) return item;
    return { ...item, title: prefix(sourceName, item.title),
      ...(item.evidence && point ? { evidence: { ...item.evidence, title: point.title.en } } : {}) };
  };
  return { ...decision,
    verdict: { ...decision.verdict,
      label: verdictLabel, body: lens },
    summary: `${scope} ${lens}`,
    priorities: decision.priorities.map(restoreName), pros: decision.pros.map(restoreName), cons: decision.cons.map(restoreName),
    reversals: decision.reversals.map(restoreName), checklist: decision.checklist.map(restoreName),
    price: { ...restoreName(decision.price),
      title: decisionText('지역 가격과 개별 단지 가격을 나눠 보세요', 'Separate area prices from individual property prices', '区分区域价格与具体楼盘价格')[locale],
      body: decisionText('지역 거래는 예산을 잡는 기준입니다. 매수할 단지의 가격은 면적·층·권리·인도 상태를 맞춘 거래와 총보유비로 다시 비교해야 합니다.',
        'Area transactions help frame the budget. Assess a particular property using matched size, floor, rights and delivery status, together with total ownership costs.',
        '区域成交可用于初步确定预算；具体楼盘仍需匹配面积、楼层、权利及交付状态，并加上持有成本进行比较。')[locale] },
  };
}
