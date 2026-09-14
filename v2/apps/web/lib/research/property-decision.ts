import asia from '../../content/property-reviews/asia-decision-lenses.json';
import gulfJapan from '../../content/property-reviews/gulf-japan-decision-lenses.json';
import gulfTitles from '../../content/property-reviews/gulf-decision-titles.json';
import type { MarketLocale } from '../locale/market-localization';
import type { PropertyReview, ReviewPoint } from './property-review';
import { decisionText, decisionTopics, type DecisionPersona, type DecisionText, type DecisionTopic } from './property-decision-topics';

export { DECISION_PERSONAS, type DecisionPersona } from './property-decision-topics';

export type DecisionItem = {
  id: string;
  title: string;
  body: string;
  status: ReviewPoint['status'];
  sourceIds: string[];
  /** Retain the evidence link and its status without repeating citations in prose. */
  evidence?: { pointId: string; status: ReviewPoint['status']; title: string };
  originalLanguage?: 'en';
};

export type PropertyDecision = {
  propertyId: string;
  persona: DecisionPersona;
  checkedOn: string;
  verdict: { label: string; body: string; tone: 'positive' | 'caution' | 'neutral' };
  summary: string;
  priorities: DecisionItem[];
  pros: DecisionItem[];
  cons: DecisionItem[];
  price: DecisionItem;
  reversals: DecisionItem[];
  checklist: DecisionItem[];
  comparisons: { name: string; reason: string; condition: string }[];
};

type Lens = Record<DecisionPersona, DecisionText> & { titlesZh?: Record<string, string> };
const lenses = { ...asia, ...gulfJapan } as Record<string, Lens>;
const translatedGulfTitles: Record<string, Record<string, string>> = gulfTitles;
type Section = keyof PropertyReview['sections'] | 'strengths' | 'tradeoffs';
type Candidate = { id: string; section: Section; point: ReviewPoint; topic: DecisionTopic };

function topicFor(point: ReviewPoint, section: Section): DecisionTopic {
  const title = point.title.en.toLowerCase();
  if (/different project|different scopes|similarly named|identity|officetel|same estate|residential-home count|different from|separate eight buildings|not park 1|hayat and hayat 1/.test(title)) return 'identity';
  if (section === 'transport' && /blue line|construction and operation|future connectivity|future airport/.test(title)) return 'transfer';
  if (/handover|delivery|progress|target|cash schedule|instalment|deposit|funding|2028|2029|construction/.test(title)) return 'handover';
  if (/lease|tenure|land right|demolition|rights/.test(title)) return 'tenure';
  if (/flood|hazard|seismic|isolation|backup|storm|structural|emergency/.test(title)) return 'hazard';
  if (/parking|spaces|car registration|mechanical parking/.test(title)) return 'parking';
  if (/noise|acoustic|expressway|road exposure|windows open|rail-facing/.test(title)) return 'noise';
  if (/window|glazing|outlook|view|façade|orientation|bay premium/.test(title) && section !== 'costs') return 'view';
  if (/repair|defect|reserve|maintenance|equipment|renewal|renovation|interior condition|boiler|refurbishment|current condition|current running/.test(title)) return 'repair';
  if (section === 'costs' && /price|sale|transaction|valuation|psf|sample|yield|compare|match|area type|layouts/.test(title)) return 'price';
  if (/bill|charge|fee|cost|upkeep|heating|cooling|utility|common fund/.test(title)) return 'fees';
  if (section === 'schools') {
    return /walk|journey|route|travel|escort|crossing|pickup|school morning|return|gate|longer/.test(title) ? 'schoolRoute' : 'school';
  }
  if (/school|catchment|nursery|admission|allocation|primary|classroom/.test(title)) return 'school';
  if (section === 'transport') {
    if (/transfer|express|shuttle|brt|bus|departure|airport|operating line|service|line 3|line 5|line 9|four rail|four line/.test(title)) return 'transfer';
    if (/entrance|gate|door|platform|block|tower|starting|internal|circulation|stairs|slope|uphill/.test(title)) return 'entrance';
    return 'transit';
  }
  if (/grocer|retail|mall|shop|store|errand|pharmacy|hospital|healthcare|atre|supermarket|lincos|daiei|bunkado/.test(title)) return 'retail';
  if (/walk|route|access|station|entrance|gate|passage|stairs|slope/.test(title)) return 'entrance';
  if (section === 'costs') return 'fees';
  return 'amenities';
}

function candidates(review: PropertyReview): Candidate[] {
  return (Object.entries(review.sections) as [keyof PropertyReview['sections'], ReviewPoint[]][])
    .flatMap(([section, points]) => points.map((point, index) => ({
      id: `${section}:${index}`, section, point, topic: topicFor(point, section),
    })));
}

const sectionWeight: Record<DecisionPersona, Record<Section, number>> = {
  family: { schools: 30, transport: 20, daily: 17, costs: 16, strengths: 18, tradeoffs: 18 },
  couple: { schools: 7, transport: 30, daily: 25, costs: 22, strengths: 21, tradeoffs: 20 },
  investor: { schools: 12, transport: 24, daily: 15, costs: 34, strengths: 18, tradeoffs: 25 },
};

function weight(candidate: Candidate, persona: DecisionPersona, market: PropertyReview['marketId']): number {
  let score = sectionWeight[persona][candidate.section];
  if (candidate.topic === 'handover' && market === 'ae-dubai') score += persona === 'investor' ? 18 : 13;
  if (candidate.topic === 'tenure' && (market === 'sg-singapore' || market === 'jp-tokyo')) score += persona === 'investor' ? 16 : 5;
  if (candidate.topic === 'repair' && market === 'jp-tokyo') score += persona === 'investor' ? 13 : 8;
  if (candidate.topic === 'schoolRoute' && persona === 'family') score += 4;
  if (candidate.topic === 'noise' && persona === 'couple') score += 10;
  if (candidate.topic === 'identity' && market === 'ae-dubai') score += 9;
  if (candidate.topic === 'price' && persona === 'investor') score += 4;
  // Tie-breaking follows the reviewed evidence order, never popularity or a score.
  return score;
}

function ranked(values: Candidate[], persona: DecisionPersona, market: PropertyReview['marketId']): Candidate[] {
  return values.map((value, index) => ({ value, index }))
    .sort((a, b) => weight(b.value, persona, market) - weight(a.value, persona, market) || a.index - b.index)
    .map(entry => entry.value);
}

function diverse(values: Candidate[], limit: number): Candidate[] {
  const selected: Candidate[] = [];
  const topics = new Set<DecisionTopic>();
  for (const value of values) {
    if (topics.has(value.topic)) continue;
    selected.push(value);
    topics.add(value.topic);
    if (selected.length === limit) return selected;
  }
  // Some profiles have fewer distinct documented topics. Keep useful distinct
  // evidence, without inventing a fifth issue when fewer than five points exist.
  for (const value of values) {
    if (selected.some(item => item.id === value.id)) continue;
    selected.push(value);
    if (selected.length === limit) break;
  }
  return selected;
}

function titleFor(value: Candidate, review: PropertyReview, locale: MarketLocale): string {
  if (locale !== 'zh-CN') return value.point.title[locale];
  return lenses[review.id]?.titlesZh?.[value.id] ?? translatedGulfTitles[review.id]?.[value.id] ?? decisionTopics[value.topic].title['zh-CN'];
}

function evidenceProse(value: Candidate, locale: Exclude<MarketLocale, 'zh-CN'>): string {
  // Keep the full evidence sentence group: cutting after a number can drop its
  // period, estimate qualification or an explicit limit in the next sentence.
  return value.point.body[locale];
}

function item(value: Candidate, review: PropertyReview, persona: DecisionPersona, locale: MarketLocale, kind: 'priority' | 'pro' | 'con' | 'reversal' | 'check' = 'priority'): DecisionItem {
  const copy = decisionTopics[value.topic];
  const title = titleFor(value, review, locale);
  const interpretation = copy[persona][locale];
  const fact = locale === 'zh-CN' ? title : evidenceProse(value, locale);
  // Property descriptions already explain their practical implications. Keep
  // general persona advice in the checklist instead of appending it to every fact.
  const groundedBody = locale === 'zh-CN' ? `${fact}。${interpretation}` : fact;
  return {
    id: `${kind}:${value.id}`,
    title: kind === 'check' ? copy.question[locale] : locale === 'zh-CN' ? copy.title[locale] : title,
    body: kind === 'reversal' ? `${title} — ${copy.reversal[locale]}` : kind === 'check' ? `${title} — ${interpretation}` : groundedBody,
    // The body is an editorial interpretation, even when its evidence is documented.
    status: kind === 'reversal' || kind === 'check' || value.point.status === 'needs-check' ? 'needs-check' : 'interpretation',
    sourceIds: [...value.point.sourceIds],
    evidence: { pointId: value.id, status: value.point.status, title: value.point.title.en },
  };
}

const verdicts = {
  family: {
    label: decisionText('실거주 후보로 검토', 'A candidate for family living', '可列入家庭自住备选'),
    body: decisionText('배정과 하루 동선이 맞는지 확인한 뒤, 가족에게 남는 이점만 가격과 비교합니다.', 'Establish admission and the daily routine, then weigh the benefits the family would actually use against price.', '先核实入学条件和日常路线，再把家庭真正用得上的优势与价格比较。'),
  },
  couple: {
    label: decisionText('생활 동선이 맞으면 검토', 'Consider if the daily routine fits', '日常路线合适时可考虑'),
    body: decisionText('출근·귀가·장보기의 편의가 추가 비용과 맞는지 살펴봅니다.', 'Weigh the convenience of commuting, returning home and errands against the extra cost.', '衡量通勤、回家和购物的便利，是否值得增加的费用。'),
  },
  investor: {
    label: decisionText('보유 비용까지 맞으면 검토', 'Consider after ownership costs', '持有成本合适时再考虑'),
    body: decisionText('매입가와 소유자 부담 비용을 함께 비교해야 투자 조건이 드러납니다.', 'The investment case depends on the purchase price together with the costs that remain with the owner.', '把购入价与业主实际承担的费用放在一起，才能判断投资条件。'),
  },
};

/** This model selects relevant questions. It never fabricates scores, price
 * bands, yields or a buy signal from a qualitative property profile. */
export function getPropertyDecision(review: PropertyReview, persona: DecisionPersona, locale: MarketLocale): PropertyDecision {
  const all = candidates(review);
  const order = ranked(all, persona, review.marketId);
  const priorities = diverse(order, 5);
  const extra = (['strengths', 'tradeoffs'] as const).flatMap(section => review[section].map((point, index) => ({
    id: `${section}:${index}`, section, point, topic: topicFor(point, section),
  })));
  const pros = diverse(ranked([...extra.filter(value => value.section === 'strengths'), ...all]
    .filter(value => value.point.status !== 'needs-check'), persona, review.marketId), 2);
  const cons = diverse(ranked([...extra.filter(value => value.section === 'tradeoffs'), ...all.filter(value => value.point.status === 'needs-check')], persona, review.marketId), 2);
  const costs = all.filter(value => value.section === 'costs');
  const priceEvidence = costs.find(value => value.topic === 'price') ?? costs[0];
  const verdict = verdicts[persona];
  const futureHome = review.marketId === 'ae-dubai' && [...all, ...extra].some(value => value.section !== 'transport' && value.topic === 'handover');
  const summary = lenses[review.id]?.[persona]?.[locale] ?? (locale === 'zh-CN'
    ? decisionText('', '', '这份资料还不足以判断买价是否合适。请先按下面的具体条件缩小选择，再与相同面积、楼栋及状态的房源比较。')['zh-CN']
    : review.editorial?.paragraphs[locale][0] ?? review.summary[locale]);
  return {
    propertyId: review.id,
    persona,
    checkedOn: review.checkedOn,
    verdict: {
      label: futureHome && persona === 'family' ? decisionText('입주 일정이 맞으면 검토', 'Consider if the handover timing fits', '交付时间合适时可考虑')[locale] : verdict.label[locale],
      body: verdict.body[locale],
      tone: persona === 'investor' || futureHome ? 'caution' : 'neutral',
    },
    summary,
    priorities: priorities.map(value => item(value, review, persona, locale)),
    pros: pros.map(value => item(value, review, persona, locale, 'pro')),
    cons: cons.map(value => item(value, review, persona, locale, 'con')),
    price: {
      id: 'matched-price-pending',
      title: decisionText('같은 조건의 거래와 총입주비로 비교하세요', 'Compare matched sales and the full cost of entry', '按相同条件成交与总购入成本比较')[locale],
      body: (review.marketId === 'jp-tokyo'
        ? decisionText('동·면적·층·권리 형태를 맞춘 가격에 수선적립금과 남은 공사 부담을 더해 비교하세요. 지역 단위 익명 거래는 동네의 가격 맥락이며, 이 건물의 성사 거래로 읽을 수는 없습니다.', 'Match building, size, floor and rights, then compare reserve contributions and remaining works. Anonymous area sales provide neighbourhood price context; they do not identify completed sales in this building.', '先匹配楼栋、面积、楼层及权利性质，再比较维修储备金与剩余工程负担。地区匿名成交只能提供周边价格背景，不能当作这栋楼的成交。')
        : decisionText('같은 면적이라도 동·층·방향·수리 상태가 다르면 더 싼 거래가 그대로 대안이 되지는 않습니다. 비교 조건을 맞춘 뒤 수리비와 실제 보유비를 더하면, 눈앞의 가격 차이가 남는지 판단할 수 있습니다.', 'A cheaper sale at the same size may still differ in building, floor, orientation or repair condition. Match those terms and add repairs and actual ownership costs to see whether the apparent saving survives.', '面积相同的低价成交，仍可能在楼栋、楼层、朝向或维修状态上不同。匹配条件后加入维修与实际持有费用，才能判断表面的价差是否仍然存在。'))[locale],
      status: 'needs-check',
      sourceIds: [...new Set(costs.flatMap(value => value.point.sourceIds))],
      ...(priceEvidence ? { evidence: { pointId: priceEvidence.id, status: priceEvidence.point.status, title: priceEvidence.point.title.en } } : {}),
    },
    reversals: diverse([...cons, ...priorities], 3).map(value => item(value, review, persona, locale, 'reversal')),
    checklist: diverse([...cons, ...priorities], 5).map(value => item(value, review, persona, locale, 'check')),
    comparisons: review.comparisons.map(comparison => ({
      name: comparison.name[locale === 'ko' ? 'ko' : 'en'],
      reason: locale === 'zh-CN' ? decisionText('', '', '可作为生活条件的对照。先按当前购房目的比较日常路线、房屋条件和持有成本。')['zh-CN'] : comparison.reason[locale],
      condition: locale === 'zh-CN' ? '尚未确认它是同一预算下的替代房源，也未得出价格高低的结论。' : comparison.condition[locale],
    })),
  };
}
