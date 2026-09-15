import type { EditorialPortfolioRecord } from './portfolio-types';
import type { ContentLocale } from '../lib/content/content-types';

const slug = 'tokyo-apartment-buying-budget-guide';
const evidenceHref = '/jp/tokyo/explore/?city=13101&year=2026&quarter=1&release=jp-area-8820f65b-a147-46b7-9412-3c463428b5f2';
// Shared with the homepage; these are anonymous individual records, not listings.
export const TOKYO_BUDGET_EXAMPLES = [
  { cap: 30000000, area: 20, layout: '1K', built: 2005, names: { en: 'Kandaizumicho', ko: '간다이즈미초', 'zh-CN': '神田和泉町' } },
  { cap: 50000000, area: 25, layout: '1K', built: 2004, names: { en: 'Kojimachi', ko: '고지마치', 'zh-CN': '麹町' } },
  { cap: 100000000, area: 65, layout: '2LDK', built: 1977, names: { en: 'Kandasarugakucho', ko: '간다사루가쿠초', 'zh-CN': '神田猿楽町' } },
] as const;
const text = {
  en: {
    title: 'Tokyo apartment budgets: what JPY 30M, 50M and 100M looked like in recorded sales',
    deck: 'Three Chiyoda transactions put size, age and purchase price side by side. Use the September 2026 guide to start a comparison, then budget for costs beyond the home.',
    body: `## Start with the home price, then build the cash budget

JPY 30 million, 50 million and 100 million are three purchase-price checkpoints. They exclude acquisition expenses, repairs and financing costs. In this September 2026 edition, the examples below come from January–March 2026 transactions in Chiyoda. They are not September sales or homes currently available to buy.

## Three neighbourhood examples

| Purchase-price checkpoint | Recorded neighbourhood | Price | Area and layout | Built |
|---|---|---|---|---|
| JPY 30M | Kandaizumicho, Chiyoda | JPY 30,000,000 | 20 m² · 1K | 2005 |
| JPY 50M | Kojimachi, Chiyoda | JPY 50,000,000 | 25 m² · 1K | 2004 |
| JPY 100M | Kandasarugakucho, Chiyoda | JPY 100,000,000 | 65 m² · 2LDK | 1977 |

These are three individual records selected to illustrate the checkpoints, not average homes for each budget. The JPY 100M example is larger and older than the other two. It cannot establish how much extra floor area the same budget would buy elsewhere, or the price effect of age. Building names and unit identities are not disclosed.

## What to compare at each budget

**JPY 30M:** start by deciding whether a compact home meets your use. The 20 m² example can help frame the space question, but it does not prove that the unit is suitable for your intended occupation or letting. Check the actual layout and building rules for any candidate.

**JPY 50M:** the recorded example has 25 m². Paying more than the first example has not bought a proportionate increase in space. Compare location, building condition and tenure before treating the price difference as a premium for one feature.

**JPY 100M:** the 65 m² example changes the space available to consider, while the 1977 construction date introduces a different set of building questions. Ask for the repair plan, reserve balance, contributions and any proposed special assessments. A construction year alone does not establish structural condition.

## Keep a separate allowance for purchase and ownership costs

Build your cash plan from the agreed price, applicable taxes, brokerage and registration expenses, financing charges and your repair allowance. Request a written itemisation for the actual property and buyer. This guide does not apply a blanket percentage or assume a mortgage is available.

For ongoing ownership, obtain the management charge and repair-reserve contribution, then add insurance, applicable taxes and expected maintenance. If you plan to rent the home out, keep rent, vacancy and management assumptions separate. A low purchase price alone does not establish a good return.

## Make a shortlist that answers your own question

Open [the Chiyoda records](${evidenceHref}) and compare the same quarter, property type and a narrower area range. Then explore other wards using the same period where available. Note when a ward has no matching records; that is not evidence that affordable homes do not exist there.

Use [Tokyo budget search](/jp/tokyo/shortlist/) to explore published neighbourhood medians, and [the cost scenario](/tools/property-scenario/?market=jp-tokyo&currency=JPY) to enter your own amounts. A neighbourhood median is not an appraisal of an individual apartment. Keep the candidate's documents and unresolved questions beside its price.

## Edition and evidence

Editorial edition: September 2026. Examples: 2026 Q1 pre-owned condominium records in Chiyoda, as displayed by SignedPrice on 15 September from an MLIT source retrieval dated 12 September. One record per checkpoint was chosen from the published list because its price equals that checkpoint. This is an illustrative selection, not a complete budget screen or a ranking. Areas, layouts and building years retain the source precision. Anonymous records cannot identify a listing or establish like-for-like values. Late reporting and corrections may change later displays.

Source: [MLIT Real Estate Information Library](https://www.reinfolib.mlit.go.jp/), transaction information edited by SignedPrice.`,
  },
  ko: {
    title: '도쿄 아파트 예산 가이드: 3천만·5천만·1억 엔으로 거래된 집은?',
    deck: '지요다구의 실제 거래 3건으로 면적·연식·가격을 비교합니다. 2026년 9월 편집 가이드에서 출발해, 집값 외 필요한 비용까지 점검하세요.',
    body: `## 집값과 총예산을 먼저 나누세요

3천만·5천만·1억 엔은 매매가격을 비교하기 위한 세 가지 기준입니다. 취득 비용·수리비·금융 비용은 포함하지 않습니다. 이번 2026년 9월 가이드는 지요다구의 2026년 1–3월 거래를 활용합니다. 9월 거래나 지금 구매할 수 있는 매물 목록이 아닙니다.

## 예산별로 살펴볼 지역 거래 사례

| 매매가격 기준 | 거래 지역 | 거래가격 | 면적·구조 | 건축연도 |
|---|---|---|---|---|
| 3천만 엔 | 간다이즈미초 · 지요다구 | 30,000,000엔 | 20m² · 1K | 2005년 |
| 5천만 엔 | 고지마치 · 지요다구 | 50,000,000엔 | 25m² · 1K | 2004년 |
| 1억 엔 | 간다사루가쿠초 · 지요다구 | 100,000,000엔 | 65m² · 2LDK | 1977년 |

예산 기준에 맞는 개별 거래를 한 건씩 골랐습니다. 예산별 평균 주택을 뜻하지 않습니다. 1억 엔 사례는 앞선 두 사례보다 넓고 오래됐습니다. 이 차이만으로 다른 지역의 구매 가능 면적이나 연식에 따른 가격 효과를 계산할 수는 없습니다. 원자료는 건물명과 호실을 공개하지 않습니다.

## 예산마다 질문을 달리하세요

**3천만 엔:** 작은 면적이 자신의 사용 목적에 맞는지부터 판단하세요. 20m² 사례는 공간을 구체적으로 생각할 출발점이지만, 실제 후보의 평면과 건물 규정을 별도로 확인해야 합니다. 해당 거래만으로 거주·임대 적합성을 보장할 수 없습니다.

**5천만 엔:** 사례의 면적은 25m²입니다. 가격이 늘어난 만큼 면적이 비례해서 커진 것은 아닙니다. 입지·건물 상태·소유 조건을 함께 비교해야 하며, 가격 차이를 한 가지 특성의 프리미엄이라고 단정하면 안 됩니다.

**1억 엔:** 65m² 사례는 공간 선택의 범위를 넓혀 생각하게 하지만, 1977년 건축이라는 조건도 함께 봐야 합니다. 장기수선계획, 수선적립금 잔액과 납부액, 추가 부담 예정액을 요청하세요. 건축연도 하나로 구조 안전성을 판단할 수는 없습니다.

## 구매 후 남는 현금까지 계산하세요

계약가격에 해당 세금, 중개·등기 비용, 금융 비용과 수리 예산을 더해 총현금 계획을 세우세요. 실제 물건과 매수자 조건에 맞는 항목별 견적을 받아야 합니다. 이 가이드는 일률적인 비용 비율을 적용하거나 대출 가능성을 가정하지 않습니다.

보유 중에는 관리비·수선적립금에 보험료, 해당 세금과 예상 유지보수비를 더해 보세요. 임대를 계획한다면 임대료·공실·관리 비용을 각각 별도 가정으로 둡니다. 낮은 매매가격만으로 좋은 투자수익을 판단할 수 없습니다.

## 실제 비교로 이어가기

[지요다 거래 보기](/ko${evidenceHref})에서 같은 분기·주택 유형·면적대로 범위를 좁히세요. 다른 구도 가능한 한 같은 기간으로 비교하고, 일치하는 기록이 없는 경우를 구분하세요. 기록이 없다는 사실이 그 지역에 예산에 맞는 집이 없다는 뜻은 아닙니다.

[도쿄 예산 탐색](/ko/jp/tokyo/shortlist/)에서 공개된 동네별 중앙값을 보고, [비용 계산기](/ko/tools/property-scenario/?market=jp-tokyo&currency=JPY)에 자신의 조건을 넣으세요. 동네 중앙값은 특정 아파트의 감정가가 아닙니다. 실제 후보의 서류와 아직 확인하지 못한 질문을 가격 옆에 남겨두세요.

## 편집 시점과 자료 기준

편집판은 2026년 9월입니다. 사례는 9월 12일 수집한 MLIT 원자료를 바탕으로 9월 15일 SignedPrice에 표시된 지요다구의 2026년 1분기 중고 맨션 거래입니다. 각 예산 기준과 가격이 일치하는 거래 한 건씩을 설명용으로 선택했습니다. 전체 예산별 조사나 순위가 아닙니다. 면적·구조·건축연도는 원자료의 정밀도를 유지하며, 익명 기록으로 건물·매물 신원이나 동일 조건 가치를 확정할 수 없습니다. 추가 신고와 정정에 따라 이후 화면이 달라질 수 있습니다.

출처: [일본 국토교통성 부동산정보라이브러리](https://www.reinfolib.mlit.go.jp/). 거래 자료를 SignedPrice가 편집했습니다.`,
  },
  'zh-CN': {
    title: '东京公寓预算指南：3,000万、5,000万与1亿日元的成交案例',
    deck: '通过千代田区三笔成交比较面积、楼龄与价格。2026年9月编辑版，附购房费用检查与地区比较入口。',
    body: `## 先分清房价与总预算

3,000万、5,000万与1亿日元是三个房价比较点，不包含购置、维修和融资费用。本期于2026年9月编辑，案例来自千代田区2026年第一季度成交，并非9月成交或在售房源。

## 三个地区案例

| 房价比较点 | 地区 | 成交价 | 面积与户型 | 建造年份 |
|---|---|---|---|---|
| 3,000万日元 | 神田和泉町 · 千代田区 | 30,000,000日元 | 20m² · 1K | 2005 |
| 5,000万日元 | 麹町 · 千代田区 | 50,000,000日元 | 25m² · 1K | 2004 |
| 1亿日元 | 神田猿楽町 · 千代田区 | 100,000,000日元 | 65m² · 2LDK | 1977 |

每档选取一笔价格恰好对应预算点的成交，不能代表该预算的平均住宅。1亿日元案例更大，也更旧。不能由此推算其他地区可买面积，或把价差归因于楼龄。原资料不公开楼名与房号。

## 按预算提出不同问题

3,000万日元案例为20m²，应先核对实际平面与使用目的。5,000万日元案例为25m²，价格增加不代表面积同比增加，还需比较位置、楼况和产权条件。1亿日元案例为65m²，但建于1977年，应索取维修计划、储备余额、缴款和拟议额外分摊资料。建造年份本身不能证明结构状况。

## 购房后需要留下多少钱

将适用税费、中介与登记费用、融资费用和维修预算加到房价上，按具体物业与买家条件索取书面明细。这里不使用统一费用比例，也不假设可以获得贷款。持续持有成本还包括管理费、维修储备缴款、保险、适用税费和维护支出。出租计划中的租金、空置与管理成本应分别列为假设，低买价不能证明高回报。

## 继续比较

打开[千代田成交](/zh-cn${evidenceHref})，采用相同季度、住宅类型和较窄面积范围。比较其他区时尽量统一时期；没有匹配记录不等于没有预算内住宅。[东京预算搜索](/zh-cn/jp/tokyo/shortlist/)展示已发布的地区中位数，[费用计算器](/zh-cn/tools/property-scenario/?market=jp-tokyo&currency=JPY)可输入自己的假设。地区中位数不是某套公寓的估值。

## 编辑日期与资料

2026年9月编辑版。案例来自9月12日获取的MLIT资料，并于9月15日在SignedPrice展示的千代田区2026年第一季度二手公寓成交。每档仅选一笔对应价格的案例，不是完整预算筛选或排名。面积、户型和年份保留原始精度，匿名记录不能确认房源身份。补报和修订可能改变后续显示。

来源：[国土交通省不动产信息库](https://www.reinfolib.mlit.go.jp/)，成交资料由SignedPrice编辑。`,
  },
} satisfies Record<ContentLocale, { title: string; deck: string; body: string }>;

export const TOKYO_BUYING_GUIDES: readonly EditorialPortfolioRecord[] = (['en', 'ko', 'zh-CN'] as const).map(locale => {
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  return {
    id: `${locale}:${slug}`, slug, locale, marketId: 'jp-tokyo', type: 'guide',
    title: text[locale].title, deck: text[locale].deck, readerQuestion: text[locale].deck,
    bodyMarkdown: text[locale].body, status: 'published', evidenceState: 'partial', authorName: 'SignedPrice',
    reviewedBy: 'SignedPrice editorial review', reviewedAt: '2026-09-15T02:40:00Z', publishedAt: '2026-09-15T02:40:00Z', updatedAt: '2026-09-15T02:40:00Z',
    relatedHref: `${prefix}${evidenceHref}`,
    sources: [
      { id: 'mlit-real-estate-information-library', kind: 'primary', publisher: 'MLIT', title: 'Real Estate Information Library', href: 'https://www.reinfolib.mlit.go.jp/', checkedAt: '2026-09-15' },
      { id: 'signedprice-chiyoda-2026-q1', kind: 'secondary', publisher: 'SignedPrice', title: 'Chiyoda 2026 Q1 transaction display, MLIT retrieval 12 September', href: `https://www.signedprice.com${evidenceHref}`, checkedAt: '2026-09-15' },
    ],
    evidenceReleaseIds: ['jp-area-8820f65b-a147-46b7-9412-3c463428b5f2'],
    revisionNote: 'September editorial edition using three explicitly selected, anonymous Q1 records. No current inventory or financing claim.',
    canonicalHref: `${prefix}/guides/${slug}/`, translationGroupId: slug, infographic: null,
  };
});
