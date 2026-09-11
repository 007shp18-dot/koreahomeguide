import type { ProductLocale } from './product-copy';
import { seoulDetailText } from './seoul-detail-copy';
const translations: Readonly<Record<string, readonly [string, string]>> = {"Building evidence is not loaded": ["건물 거래 자료를 불러오지 못했습니다", "尚未加载楼盘交易数据"], "The verified district artifact does not contain building records": ["현재 검증된 지역 자료에 건물별 기록이 없습니다", "当前已核验地区数据不包含楼盘记录"], "Use district evidence or return after a verified building snapshot is installed": ["지역 거래 자료를 확인하거나 검증된 건물 자료가 갱신된 뒤 다시 방문하세요", "请先查看地区交易数据，或在已核验楼盘数据更新后返回"], "Verified district summary unavailable": ["검증된 지역 요약 자료가 없습니다", "暂无已核验地区摘要"], "Apartment": ["아파트", "公寓"], "Officetel": ["오피스텔", "商住楼"], "Villa / multifamily": ["연립·다세대", "多户住宅"], "Detached / multifamily": ["단독·다가구", "独栋或多户住宅"],
  "01 / District finding": [
    "01 / 지역 통계",
    "01 / 地区统计"
  ],
  "01 / Sale distribution": [
    "01 / 매매 가격 분포",
    "01 / 买卖价格分布"
  ],
  "02 / Local quote": [
    "02 / 보증금 비교",
    "02 / 押金比较"
  ],
  "03 / Computed FAQ": [
    "03 / 자주 묻는 질문",
    "03 / 常见问题"
  ],
  "04 / Building evidence": [
    "04 / 건물별 거래",
    "04 / 楼盘交易"
  ],
  "A compatible neighbourhood aggregate is not attached, so district values are not copied into neighbourhood rows.": [
    "비교 가능한 동별 통계가 없어 구 단위 값을 동별 자료에 대신 표시하지 않습니다.",
    "暂无可比较的社区汇总数据，不以行政区统计代替社区数据。"
  ],
  "Back to Seoul map": [
    "서울 지도로 돌아가기",
    "返回首尔地图"
  ],
  "Breadcrumb": [
    "현재 위치",
    "当前位置"
  ],
  "Building": [
    "건물",
    "楼盘"
  ],
  "Buildings": [
    "건물",
    "楼盘"
  ],
  "Buildings connected to the selected sale cohort and identity inventory.": [
    "선택한 매매 조건과 건물 정보가 연결된 건물입니다.",
    "已关联当前买卖条件与楼盘身份数据的楼盘。"
  ],
  "Collection state, source dates and correction history stay separate from price findings.": [
    "수집 상태·자료 기준일·정정 이력을 가격 통계와 구분해 확인합니다.",
    "采集状态、数据日期和更正记录与价格统计分别展示。"
  ],
  "Comparable district distribution": [
    "비교 가능한 지역 분포",
    "可比较的地区分布"
  ],
  "Compare a contract": [
    "계약 가격 비교",
    "比较合同价格"
  ],
  "Compare one refundable deposit locally.": [
    "이 지역의 보증금과 비교하세요.",
    "与本地区可退还押金比较。"
  ],
  "Comparison counts must remain compatible": [
    "동일한 기준의 표본 비교 필요",
    "须使用可比较的样本"
  ],
  "Corrections": [
    "데이터 정정 이력",
    "数据更正记录"
  ],
  "Declared reporting period": [
    "지정된 집계 기간",
    "指定统计期间"
  ],
  "Distribution": [
    "가격 분포",
    "价格分布"
  ],
  "Distribution not published": [
    "가격 분포 자료 부족",
    "价格分布未公布"
  ],
  "District": [
    "지역",
    "行政区"
  ],
  "District Explorer": [
    "지역 탐색",
    "地区探索"
  ],
  "District context": [
    "지역 관련 정보",
    "地区相关信息"
  ],
  "District evidence navigation": [
    "지역 거래 탐색",
    "地区交易导航"
  ],
  "District evidence period": [
    "지역 거래 집계 기간",
    "地区交易统计期间"
  ],
  "District evidence unavailable": [
    "지역 거래 자료 없음",
    "暂无地区交易数据"
  ],
  "District map unavailable": [
    "지역 지도를 불러올 수 없습니다",
    "地区地图暂不可用"
  ],
  "District page sections": [
    "지역 상세 항목",
    "地区页面栏目"
  ],
  "District structure": [
    "지역 구성",
    "地区结构"
  ],
  "District summary metrics": [
    "지역 요약 통계",
    "地区摘要指标"
  ],
  "Each area cohort is recalculated from compatible reported sales; empty cohorts remain hidden.": [
    "면적별로 비교 가능한 신고 매매를 다시 집계하며 자료가 없는 조건은 표시하지 않습니다.",
    "各面积组按可比较的申报买卖重新计算；无数据的组不显示。"
  ],
  "Evidence period": [
    "집계 기간",
    "统计期间"
  ],
  "Evidence status": [
    "자료 상태",
    "数据状态"
  ],
  "Explore": [
    "실거래가 탐색",
    "探索成交价"
  ],
  "Fail-closed display": [
    "검증 전 가격 비공개",
    "核验前不显示价格"
  ],
  "Filings": [
    "신고 건수",
    "申报笔数"
  ],
  "Footer navigation": [
    "하단 메뉴",
    "页脚导航"
  ],
  "Full range": [
    "전체 범위",
    "完整范围"
  ],
  "Future supply opens only after official project identifiers are matched.": [
    "공식 사업 식별정보가 확인된 경우에만 향후 공급을 표시합니다.",
    "仅在匹配官方项目标识后展示未来供应。"
  ],
  "Global home": [
    "전체 도시 홈",
    "全球首页"
  ],
  "Home": [
    "홈",
    "首页"
  ],
  "Home types": [
    "주택 유형",
    "住宅类型"
  ],
  "Housing composition": [
    "주택 구성",
    "住房结构"
  ],
  "Leading verified buildings": [
    "확인된 주요 건물",
    "已核验主要楼盘"
  ],
  "Ledger available": [
    "정정 이력 확인 가능",
    "可查看更正记录"
  ],
  "Loading verified district map": [
    "확인된 지역 지도를 불러오는 중",
    "正在加载已核验地区地图"
  ],
  "Local comparison": [
    "주변 지역 비교",
    "周边比较"
  ],
  "Median": [
    "중앙값",
    "中位数"
  ],
  "Median deposit": [
    "보증금 중앙값",
    "押金中位数"
  ],
  "Median sale": [
    "매매 중앙값",
    "买卖中位数"
  ],
  "Median sale price": [
    "매매 가격 중앙값",
    "买卖价格中位数"
  ],
  "Middle half": [
    "중간 50% 구간",
    "中间50%区间"
  ],
  "Monthly filing volume": [
    "월별 신고 건수",
    "每月申报量"
  ],
  "Move-in / move-out": [
    "전입·전출",
    "迁入与迁出"
  ],
  "Nearby districts": [
    "인접 자치구",
    "邻近行政区"
  ],
  "Neighbourhood": [
    "동네",
    "社区"
  ],
  "Neighbourhood and buildings": [
    "동네와 건물",
    "社区与楼盘"
  ],
  "Neighbourhood comparison": [
    "동별 비교",
    "社区比较"
  ],
  "New / renewal": [
    "신규·갱신",
    "新签与续约"
  ],
  "New and renewal cohorts remain available only for rent contracts.": [
    "신규·갱신 구분은 임대차 계약에만 적용됩니다.",
    "新签与续约分组仅适用于租赁合同。"
  ],
  "No city value substituted": [
    "서울 전체 값으로 대체하지 않음",
    "不以全市数据代替"
  ],
  "No compatible district-level denominator attached": [
    "비교 가능한 지역 면적 자료 없음",
    "暂无匹配的地区面积分母"
  ],
  "No compatible migration release is attached.": [
    "비교 가능한 인구 이동 자료가 없습니다.",
    "暂无可比较的人口迁移数据。"
  ],
  "No current release": [
    "최신 자료 없음",
    "暂无最新数据版本"
  ],
  "No district housing-stock denominator is connected to this release.": [
    "이 자료에는 지역 주택 재고 통계가 연결되어 있지 않습니다.",
    "当前版本未关联地区住房存量统计。"
  ],
  "Not applicable to sale": [
    "매매에 적용되지 않음",
    "不适用于买卖"
  ],
  "Not assessable": [
    "판단 자료 부족",
    "资料不足，无法评估"
  ],
  "Not published": [
    "자료 없음",
    "未公布"
  ],
  "Not verified": [
    "확인되지 않음",
    "尚未核验"
  ],
  "Official reported contracts": [
    "공식 신고 계약",
    "官方申报合同"
  ],
  "Official reported-contract evidence for the declared period.": [
    "지정 기간의 공식 신고 계약 자료입니다.",
    "指定期间的官方申报合同数据。"
  ],
  "Open correction ledger": [
    "정정 이력 보기",
    "查看更正记录"
  ],
  "Overview": [
    "개요",
    "概览"
  ],
  "Period": [
    "기간",
    "期间"
  ],
  "Population and supply": [
    "인구와 공급",
    "人口与供应"
  ],
  "Price by home size": [
    "면적별 가격",
    "按住宅面积比较价格"
  ],
  "Price per ㎡": [
    "㎡당 가격",
    "每平方米价格"
  ],
  "Property type evidence": [
    "주택 유형별 자료",
    "住宅类型数据"
  ],
  "Publication": [
    "공개 상태",
    "公开状态"
  ],
  "Published distribution": [
    "공개된 가격 분포",
    "已公布价格分布"
  ],
  "Published evidence by home type": [
    "주택 유형별 공개 자료",
    "按住宅类型公布的数据"
  ],
  "Questions answered from this district summary.": [
    "이 지역 통계로 확인할 수 있는 질문입니다.",
    "可由地区统计解答的问题。"
  ],
  "Recent change": [
    "최근 변동",
    "近期变化"
  ],
  "Reported sale price range": [
    "신고 매매 가격 범위",
    "申报买卖价格范围"
  ],
  "Reported sales": [
    "신고 매매 건수",
    "申报买卖笔数"
  ],
  "Review Seoul evidence corrections": [
    "서울 데이터 정정 이력 보기",
    "查看首尔数据更正记录"
  ],
  "Sale distribution not published": [
    "매매 가격 분포 자료 부족",
    "买卖价格分布未公布"
  ],
  "Sample": [
    "표본",
    "样本"
  ],
  "Scheduled completions": [
    "준공 예정",
    "计划竣工"
  ],
  "Selected reported-sale cohort": [
    "선택한 신고 매매 조건",
    "所选申报买卖样本组"
  ],
  "Seoul": [
    "서울",
    "首尔"
  ],
  "Seoul market": [
    "서울 부동산",
    "首尔房地产"
  ],
  "Seoul ·": [
    "서울 ·",
    "首尔 ·"
  ],
  "Source": [
    "출처",
    "来源"
  ],
  "Spread interpretation": [
    "가격 분포 해석",
    "价格分布解读"
  ],
  "The current artifact stores a period total, not a month-by-month district series.": [
    "현재 자료는 전체 기간 합계이며 지역별 월간 시계열은 없습니다.",
    "当前数据保存期间总量，不含地区逐月序列。"
  ],
  "The range below uses the same sale cohort selected in Explore. No jeonse or monthly-rent values are mixed into this section.": [
    "아래 범위는 탐색 화면에서 선택한 동일 매매 조건을 사용합니다. 전세·월세는 포함하지 않습니다.",
    "以下范围使用探索页面所选的同一买卖样本组，不混入全租或月租数据。"
  ],
  "Trust": [
    "자료 기준",
    "数据标准"
  ],
  "Unavailable": [
    "자료 없음",
    "暂无数据"
  ],
  "Use the size filter": [
    "면적 필터로 확인",
    "使用面积筛选"
  ],
  "Verified Seoul reported-sale and rent evidence, with publication limits shown.": [
    "공개 기준과 함께 제공하는 서울 신고 매매·임대차 자료입니다.",
    "按公开标准展示的首尔申报买卖与租赁数据。"
  ],
  "Verified district evidence is required before any monetary finding can be shown.": [
    "가격을 표시하려면 검증된 지역 거래 자료가 필요합니다.",
    "显示价格前须具备已核验的地区交易数据。"
  ],
  "Verified district evidence required": [
    "검증된 지역 자료 필요",
    "需要已核验地区数据"
  ],
  "Verified only when an official identity is attached": [
    "공식 식별정보가 확인된 자료만 표시",
    "仅展示已关联官方身份信息的数据"
  ],
  "View district rankings": [
    "자치구 순위 보기",
    "查看行政区排名"
  ],
  "Volume, size and nearby context": [
    "거래량·면적·인접 지역",
    "交易量、面积与周边情况"
  ],
  "Withheld": [
    "공개 보류",
    "暂不公布"
  ]
};
export function districtText(locale: ProductLocale, value: string): string {
 if (locale === 'en') return value;
 return translations[value]?.[locale === 'ko' ? 0 : 1] ?? seoulDetailText(locale, value);
}

export function districtFaq(locale: ProductLocale, model: Extract<import('../public-market/area-route-types').PublicDistrictModel, { status: 'published' | 'withheld' }>) {
  if (locale === 'en') return model.faq;
  const ko = locale === 'ko';
  const name = model.identity.nameKo;
  const count = model.summary.n.toLocaleString(locale);
  const amount = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
  const published = model.summary.published;
  const questions = ko
    ? [`${name} 전세 보증금 중앙값은 얼마인가요?`, '입력한 보증금은 지역 중앙값과 어떻게 비교하나요?', '중간 50% 구간은 무엇인가요?', '지역 가격이 공개되지 않는 이유는 무엇인가요?', '자료 출처와 기간은 무엇인가요?']
    : [`${name}的全租押金中位数是多少？`, '输入的押金如何与地区中位数比较？', '中间50%区间是什么意思？', '为何有些地区价格不公布？', '数据来源和期间是什么？'];
  const answers = ko ? [
    published ? `${name}의 반환 가능한 전세 보증금 중앙값은 ${amount(model.summary.med)}이며, ${count}건을 기준으로 합니다.` : `${name}에서 고정된 집계 조건을 충족한 계약이 ${count}건뿐이므로 중앙값을 공개하지 않습니다.`,
    published ? '입력한 보증금이 신고 중앙값보다 낮은지, 같은지, 높은지만 설명합니다. 통계 비교이며 감정평가가 아닙니다.' : '지역 중앙값이 공개되지 않아 입력한 보증금과 비교할 수 없습니다.',
    published ? `조건을 충족한 보증금의 중간 50%는 ${amount(model.summary.p25)}~${amount(model.summary.p75)}입니다. 신고 계약을 설명하며 감정평가가 아닙니다.` : '조건을 충족한 계약이 5건 미만이면 중간 50% 구간을 계산하지 않습니다.',
    `조건을 충족한 계약이 5건 미만이면 가격을 공개하지 않습니다. ${name}의 해당 기간 계약은 ${count}건입니다.`,
    `국토교통부의 ${model.summary.period} 신고 임대차 계약 중 월세가 0원이고 신고 면적이 45~55㎡인 전세 계약을 집계합니다. 신규·갱신 계약을 합산한 일반 자료이며 법률 자문이나 감정평가가 아닙니다.`,
  ] : [
    published ? `${name}可退还全租押金中位数为${amount(model.summary.med)}，基于${count}笔合同。` : `${name}仅有${count}笔合同符合固定筛选条件，因此不公布中位数。`,
    published ? '仅说明输入押金低于、等于或高于申报中位数。这是描述性比较，不是估价。' : '地区中位数未公布，无法比较输入的押金。',
    published ? `符合条件的押金中间50%位于${amount(model.summary.p25)}至${amount(model.summary.p75)}之间。它描述申报合同，不是估价。` : '符合条件的合同不足5笔时，不计算中间50%区间。',
    `符合条件的合同不足5笔时不公布价格。${name}在该期间有${count}笔合同。`,
    `来源为韩国国土交通部${model.summary.period}申报租赁合同，仅限月租为零、申报面积45–55㎡的全租合同。新签与续约合同合并统计；属于一般数据，不是法律或估价建议。`,
  ];
  return questions.map((question, index) => ({ question, answer: answers[index]! }));
}
