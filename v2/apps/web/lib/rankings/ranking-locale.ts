export type RankingLocale = 'en' | 'ko' | 'zh-CN';
export function rankingPath(locale: RankingLocale, path = '/rankings/'): string {
 return (locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '') + path;
}
export function rankingCopy(locale: RankingLocale, en: string, ko: string, zh: string): string {
 return locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
}
const translations: Record<string, readonly [string,string]> = {
 "Project median prices": ["단지별 중앙값","项目价格中位数"],
 "Ready": ["준공","现房"],
 "Off-Plan": ["분양","期房"],
 "Completion": ["준공 여부","竣工状态"],
 "Ranking filters": ["순위 필터","排行筛选"],
 "Source:": ["출처:","来源："],
 "District monthly rent medians": ["지역별 월세 중앙값","区域月租中位数"],
 "Selected from 1,297 questionnaire-derived resale-condominium records across Tokyo’s 23 wards. These anonymous district records do not identify buildings and are not a complete sales registry.": ["도쿄 23구의 설문 기반 중고 맨션 거래 1,297건에서 선정했습니다. 단지가 식별되지 않는 익명 지역 자료이며 전체 매매 등기부가 아닙니다.","选自东京23区的1,297笔问卷来源二手公寓记录。匿名区域记录无法识别楼宇，也不是完整的交易登记簿。"],
 "Equal prices are ordered by area, largest first, then ward, district and source reference. Numbers show display order. Positions 10 and 11 both report JPY 450,000,000.": ["가격이 같으면 면적이 큰 순서, 구·지역·원본 참조 순으로 표시합니다. 번호는 표시 순서입니다. 10위와 11위는 모두 450,000,000엔입니다.","价格相同时先按面积从大到小，再按区、地区和来源编号排序。数字为显示次序；第10和11位均为450,000,000日元。"],
 "Observation period: 2026 Q1. Acquired 10 September 2026; checked 12 September 2026. This was the newest quarter selectable on the official source at that check. Only this highest-price snapshot is published for Tokyo.": ["관측 기간은 2026년 1분기입니다. 2026년 9월 10일 수집하고 9월 12일 확인했으며, 확인 당시 공식 출처에서 선택할 수 있는 최신 분기였습니다. 도쿄는 이 최고가 순위 자료만 제공합니다.","观察期为2026年第一季度。2026年9月10日采集、9月12日核查，当时为官方来源可选的最新季度。东京仅发布此最高价快照。"],
 "Apartments only. Areas are reported exclusive areas. Rent rankings exclude zero-monthly-rent jeonse contracts. Deposits are not converted into rent equivalents.": ["아파트만 포함하며 면적은 신고 전용면적입니다. 임대 순위에서 월세가 없는 전세 계약은 제외하고, 보증금을 월세로 환산하지 않습니다.","仅含公寓，面积为申报专用面积。租金排行不含月租为零的全租合同，押金不折算成租金。"],
 "Private condominiums only; HDB, executive condominiums, landed homes and URA-classified apartments are excluded. Sales are single-unit transactions. Rental records are limited to non-landed projects also identified as condominiums in the available sale data; unmatched projects are excluded. Rental areas remain the original reported ranges, not midpoint estimates. URA dates are shown at month precision.": ["민간 콘도만 포함합니다. HDB·EC·단독주택·URA 분류상 아파트는 제외하며 매매는 단일 주택 거래입니다. 임대는 매매 자료에서도 콘도로 확인되는 비토지형 단지에 한정하고 매칭되지 않은 단지는 제외합니다. 임대 면적은 원본 구간을 유지하며 중간값으로 추정하지 않습니다. URA 계약일은 월 단위입니다.","仅含私人共管公寓；不含HDB、EC、有地住宅及URA分类中的apartment。买卖限单套交易。租赁仅含在现有买卖资料中也被认定为共管公寓的非有地项目，不含未匹配项目。租赁面积保留原始区间，不取中点估算。URA合同日期精确到月。"],
 "Exclusive floor area uses an open lower and closed upper limit: 40 < area ≤ 60 m² or 60 < area ≤ 85 m². Deposit intervals are [0,100 million), [100 million,300 million), and [300 million,+∞) KRW. Zero-monthly-rent jeonse is excluded.": ["전용면적은 40㎡ 초과 60㎡ 이하 또는 60㎡ 초과 85㎡ 이하입니다. 보증금 구간은 1억 원 미만, 1억 원 이상 3억 원 미만, 3억 원 이상입니다. 월세가 없는 전세는 제외합니다.","专用面积区间为40㎡以上至60㎡（含），或60㎡以上至85㎡（含）。押金区间为低于1亿韩元、1亿至低于3亿韩元，以及3亿韩元及以上。不含月租为零的全租合同。"],
 "Only original URA area bands wholly within the selected interval are included; no midpoint estimates are used. Bedrooms must match exactly. Non-landed rentals are matched to condominium-classified sale evidence; unmatched projects, URA apartments, EC, landed homes and HDB are excluded.": ["선택 범위에 완전히 포함되는 URA 원본 면적 구간만 사용하고 중간값은 추정하지 않습니다. 침실 수는 정확히 일치해야 합니다. 매매 자료상 콘도로 확인되는 비토지형 임대만 포함하며 미매칭 단지·URA 아파트·EC·단독주택·HDB는 제외합니다.","仅包含完全落在所选范围内的URA原始面积区间，不估算中点。卧室数必须完全匹配。非有地租赁须与共管公寓买卖证据匹配；不含未匹配项目、URA apartment、EC、有地住宅及HDB。"],
  "City": [
    "도시",
    "城市"
  ],
  "Ranking": [
    "순위 종류",
    "排行类型"
  ],
  "Sales": [
    "매매",
    "买卖"
  ],
  "District rents": [
    "지역별 월세",
    "区域租金"
  ],
  "Order": [
    "정렬",
    "排序"
  ],
  "Highest first": [
    "높은 가격순",
    "价格从高到低"
  ],
  "Lowest first": [
    "낮은 가격순",
    "价格从低到高"
  ],
  "Show rankings": [
    "순위 보기",
    "查看排行"
  ],
  "Ready apartment project medians": [
    "준공 아파트 단지별 중앙값",
    "已竣工公寓项目中位价"
  ],
  "Seoul": [
    "서울",
    "首尔"
  ],
  "Singapore": [
    "싱가포르",
    "新加坡"
  ],
  "Dubai": [
    "두바이",
    "迪拜"
  ],
  "Tokyo": [
    "도쿄",
    "东京"
  ],
  "Rank": [
    "순위",
    "排名"
  ],
  "Property / district": [
    "단지 / 지역",
    "项目 / 区域"
  ],
  "Area, m²": [
    "면적, ㎡",
    "面积, ㎡"
  ],
  "Sale price": [
    "매매가격",
    "成交价格"
  ],
  "Rent / month": [
    "월세",
    "月租"
  ],
  "Deposit": [
    "보증금",
    "押金"
  ],
  "Contract": [
    "계약일",
    "合同日期"
  ],
  "Not disclosed": [
    "미공개",
    "未披露"
  ],
  "View property evidence →": [
    "단지 거래 보기 →",
    "查看项目成交 →"
  ],
  "One contract per property": [
    "단지당 대표 계약 1건",
    "每个项目一笔代表合同"
  ],
  "Sources, coverage and ranking rules": [
    "출처·집계 범위·순위 기준",
    "来源、覆盖范围与排名规则"
  ],
  "Floor area": [
    "면적",
    "面积"
  ],
  "Bedrooms": [
    "침실 수",
    "卧室数"
  ],
  "Compare districts": [
    "지역 비교",
    "比较区域"
  ],
  "Below ₩100 million": [
    "1억 원 미만",
    "低于1亿韩元"
  ],
  "₩100 to below ₩300 million": [
    "1억 원 이상 3억 원 미만",
    "1亿至低于3亿韩元"
  ],
  "₩300 million or more": [
    "3억 원 이상",
    "3亿韩元及以上"
  ],
  "District": [
    "지역",
    "区域"
  ],
  "Median rent / month": [
    "월세 중앙값",
    "月租中位数"
  ],
  "Median deposit": [
    "보증금 중앙값",
    "押金中位数"
  ],
  "Middle 50% / month": [
    "월세 중간 50% 구간",
    "月租中间50%区间"
  ],
  "Contracts": [
    "계약 수",
    "合同数"
  ],
  "Explore district →": [
    "지역 거래 보기 →",
    "查看区域成交 →"
  ],
  "Explore Singapore →": [
    "싱가포르 거래 보기 →",
    "查看新加坡成交 →"
  ],
  "Sources and calculation": [
    "출처·계산 방법",
    "来源与计算方法"
  ],
  "Position": [
    "순위",
    "排名"
  ],
  "District / ward": [
    "지역 / 구",
    "地区 / 区"
  ],
  "Period": [
    "기간",
    "期间"
  ],
  "Explore ward evidence →": [
    "구별 거래 보기 →",
    "查看区内成交 →"
  ],
  "Project / area": [
    "단지 / 지역",
    "项目 / 区域"
  ],
  "Median sale price": [
    "매매가격 중앙값",
    "成交价中位数"
  ],
  "Reported sales": [
    "신고 매매 건수",
    "申报成交数"
  ],
  "One row per project · Median reported sale price, not an individual contract or asking price. At least 30 sales per project; villas and off-plan sales excluded.": [
    "단지당 1행 · 개별 계약이나 호가가 아닌 신고 매매가격 중앙값입니다. 단지별 30건 이상이며 빌라·분양 거래는 제외합니다.",
    "每个项目一行，以申报成交价中位数排名，并非单笔合同或挂牌价。每个项目至少30笔成交，不含别墅和期房。"
  ],
  "Homes differ in size and condition. Equal medians share a rank. Up to 50 unique projects are shown; this is not a complete market ranking.": [
    "주택마다 면적과 상태가 다릅니다. 중앙값이 같으면 공동 순위이며 최대 50개 단지를 표시합니다. 전체 시장을 빠짐없이 집계한 순위는 아닙니다.",
    "住房面积和状况各异。中位价相同则并列，最多显示50个不同项目，并非完整市场排名。"
  ],
  "Verified Dubai rankings are temporarily unavailable. Please try again shortly.": [
    "두바이 순위를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
    "暂时无法加载迪拜排行，请稍后重试。"
  ],
  "No eligible project rankings are available for this publication.": [
    "이번 집계에서 표시 기준을 충족한 단지가 없습니다.",
    "本次发布没有符合条件的项目。"
  ],
  "Verified contract rankings are temporarily unavailable. Please try again shortly.": [
    "계약 순위를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
    "暂时无法加载成交排行，请稍后重试。"
  ],
  "No eligible contracts are available for this category yet.": [
    "이 조건에 맞는 계약이 아직 없습니다.",
    "暂无符合此类别的合同。"
  ],
  "Verified rental rankings are temporarily unavailable. Please try again shortly.": [
    "임대료 순위를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.",
    "暂时无法加载租金排行，请稍后重试。"
  ],
  "No district has 10 matching contracts in the latest source month. Adjust the area or other conditions.": [
    "최근 집계 월에 조건에 맞는 계약이 10건 이상인 지역이 없습니다. 면적이나 다른 조건을 변경해 보세요.",
    "最新数据月份没有区域达到10笔匹配合同，请调整面积或其他条件。"
  ],
  "This ranking uses individual reported contracts from the latest available completed calendar month. Building and district pages use a wider comparison period.": [
    "자료가 있는 최근 완료 월의 신고 계약을 기준으로 합니다. 단지·지역 상세 페이지는 더 넓은 비교 기간을 사용합니다.",
    "以最新有数据的完整月份申报合同为准。项目和区域详情页采用更长的比较期。"
  ],
  "₩ = South Korean won. Full amounts shown; no multiplier needed.": [
    "₩는 원화이며 금액은 축약 없이 표시합니다.",
    "₩表示韩元，显示完整金额，无需乘以倍数。"
  ],
  "S$ = Singapore dollars. Full amounts shown; no multiplier needed.": [
    "S$는 싱가포르 달러이며 금액은 축약 없이 표시합니다.",
    "S$表示新加坡元，显示完整金额，无需乘以倍数。"
  ],
  "JPY = Japanese yen. Full amounts shown; no multiplier needed.": [
    "JPY는 일본 엔이며 금액은 축약 없이 표시합니다.",
    "JPY表示日元，显示完整金额，无需乘以倍数。"
  ]
};
export function rankingText(locale: RankingLocale, text: string): string {
 const translated = translations[text];
 return !translated || locale === 'en' ? text : translated[locale === 'ko' ? 0 : 1];
}

export function rankingDate(locale: RankingLocale, value: string | Date | number | null | undefined): string {
 if (value === null || value === undefined || value === '') return '—';
 const raw = value instanceof Date ? value.toISOString() : String(value);
 const monthOnly = /^\d{4}-\d{2}$/.test(raw);
 const date = new Date(monthOnly ? raw+'-01T00:00:00Z' : raw);
 if (!Number.isFinite(date.getTime())) return raw;
 return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {year:'numeric',month:'long',...(monthOnly ? {} : {day:'numeric' as const}),timeZone:'UTC'}).format(date);
}
