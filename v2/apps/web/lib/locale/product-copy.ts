export type ProductLocale = 'en' | 'ko';

export type ContractCheckCopy = Readonly<{
  primaryNavigation: string;
  planned: string;
  wordmarkLabel: string;
  navigation: Readonly<Record<'check' | 'explore' | 'news' | 'guide', string>>;
  offer: Readonly<{
    title: string;
    label: string;
    optional: string;
    deposit: string;
    monthlyRent: string;
    zeroAllowed: string;
    firstPlaceholder: string;
    secondPlaceholder: string;
  }>;
  range: Readonly<{
    observed: string;
    held: string;
  }>;
  empty: Readonly<{
    invalidTitle: string;
    blankTitle: string;
    invalidReason: string;
    blankReason: string;
    invalidAction: string;
    blankAction: string;
  }>;
  result: Readonly<{
    heading: string;
    equal: string;
    lowerPrefix: string;
    lowerSuffix: string;
    differenceSuffix: string;
    monthlyEquivalent: string;
    perMonth: string;
    flipped: string;
    traceCaption: string;
    calculation: string;
    rows: readonly [string, string, string, string];
    principalBoundary: string;
  }>;
  hero: Readonly<{
    eyebrow: string;
    headingLead: string;
    headingTail: string;
    description: string;
  }>;
  mode: Readonly<{
    ariaLabel: string;
    budget: string;
    budgetDescription: string;
    compare: string;
    compareDescription: string;
  }>;
  housingType: string;
  apartment: string;
  officetel: string;
  reset: string;
  evidence: Readonly<{
    heading: string;
    source: string;
    basis: string;
    period: string;
    methodBoundary: string;
  }>;
  moreEvidence: string;
  localDistribution: string;
  explore: string;
  footer: readonly [string, string, string];
  unavailable: Readonly<{
    eyebrow: string;
    title: string;
    actionLead: string;
    actionLink: string;
  }>;
  curve: Readonly<{
    ariaLabel: string;
    heading: string;
    description: string;
    heldNotice: string;
  }>;
}>;

const englishContractCheckCopy = Object.freeze({
  primaryNavigation: 'Primary',
  planned: 'Planned',
  wordmarkLabel: 'SignedPrice home',
  navigation: {
    check: 'Check',
    explore: 'Explore',
    news: 'News',
    guide: 'Guide',
  },
  offer: {
    title: 'Offer',
    label: 'Label',
    optional: 'Optional',
    deposit: 'Deposit',
    monthlyRent: 'Monthly rent',
    zeroAllowed: '0 allowed',
    firstPlaceholder: 'Near the station',
    secondPlaceholder: 'More space',
  },
  range: {
    observed: 'Within measured range',
    held: 'Outside measured range — held, not extended.',
  },
  empty: {
    invalidTitle: 'Review the highlighted terms.',
    blankTitle: 'Enter both filed offers.',
    invalidReason: 'Each deposit must be positive; monthly rent may be zero and must not be negative.',
    blankReason: 'Enter both deposits. Monthly rent can be left empty for a jeonse offer.',
    invalidAction: 'Correct the invalid field; the comparison will update immediately.',
    blankAction: 'Start with Offer A, then enter Offer B. No submission step is needed.',
  },
  result: {
    heading: 'Result',
    equal: 'The offers are effectively equal.',
    lowerPrefix: 'Offer',
    lowerSuffix: 'has the lower normalized cost.',
    differenceSuffix: '/ month difference',
    monthlyEquivalent: 'Equivalent cost · Offer',
    perMonth: ' / month',
    flipped: 'The lower listed rent is not the lower normalized cost.',
    traceCaption: 'Four-row calculation trace',
    calculation: 'Calculation',
    rows: [
      'Deposit as filed',
      'Monthly rent as filed',
      'Verified annual rate',
      'Monthly equivalent',
    ],
    principalBoundary: 'The refundable principal is not charged as rent; its full opportunity cost is converted with the verified annual rate.',
  },
  hero: {
    eyebrow: 'Seoul · Contract decision',
    headingLead: 'Which rent offer',
    headingTail: 'actually costs less?',
    description: 'Compare two deposit-and-rent offers on the same monthly basis.',
  },
  mode: {
    ariaLabel: 'Check mode',
    budget: 'My budget',
    budgetDescription: 'Requires private affordability inputs · not available yet',
    compare: 'Compare two offers',
    compareDescription: 'Verified curve · updates as you type',
  },
  housingType: 'Housing type',
  apartment: 'Apartment',
  officetel: 'Officetel',
  reset: 'Reset',
  evidence: {
    heading: 'Evidence boundary',
    source: 'Source',
    basis: 'Basis',
    period: 'Period',
    methodBoundary: 'Method / boundary',
  },
  moreEvidence: 'More market evidence',
  localDistribution: 'Check one offer against its local distribution',
  explore: 'Explore Seoul market evidence',
  footer: [
    'Both deposits are converted independently, so a low listed rent does not automatically mean a lower monthly equivalent.',
    'The conversion curve is measured from filed contract pairs in the same building and floor-area band with different deposits.',
    'This is not an appraisal and must not be used for lending, tax, or litigation.',
  ],
  unavailable: {
    eyebrow: 'Seoul · Contract decision',
    title: 'Contract Check needs verified conversion evidence.',
    actionLead: 'Explore the public Seoul evidence while a verified curve artifact is unavailable.',
    actionLink: 'Open Seoul Explorer',
  },
  curve: {
    ariaLabel: 'Measured annual conversion curve',
    heading: 'Measured conversion curve',
    description: 'Markers use each offer’s filed deposit.',
    heldNotice: 'Outside measured range — held, not extended.',
  },
} as const satisfies ContractCheckCopy);

const koreanContractCheckCopy = Object.freeze({
  primaryNavigation: '주요 메뉴',
  planned: '준비 중',
  wordmarkLabel: 'signedprice 홈',
  navigation: {
    check: '계약 비교',
    explore: '구별 탐색',
    news: '뉴스',
    guide: '가이드',
  },
  offer: {
    title: '계약 조건',
    label: '메모',
    optional: '선택',
    deposit: '보증금',
    monthlyRent: '월세',
    zeroAllowed: '0 가능',
    firstPlaceholder: '역과 가까움',
    secondPlaceholder: '면적이 더 넓음',
  },
  range: {
    observed: '실측 구간 안',
    held: '실측 구간 밖 — 연장하지 않고 최근접 값을 유지합니다.',
  },
  empty: {
    invalidTitle: '표시된 계약 조건을 확인하세요.',
    blankTitle: '두 신고 계약 조건을 입력하세요.',
    invalidReason: '보증금은 양수여야 하며 월세는 0 이상이어야 합니다.',
    blankReason: '두 보증금을 입력하세요. 전세 조건은 월세를 비워도 됩니다.',
    invalidAction: '잘못된 항목을 고치면 비교 결과가 즉시 갱신됩니다.',
    blankAction: '계약 조건 A부터 입력한 뒤 B를 입력하세요. 제출 단계는 없습니다.',
  },
  result: {
    heading: '결과',
    equal: '두 계약 조건의 환산 월 비용이 같습니다.',
    lowerPrefix: '계약 조건',
    lowerSuffix: '의 환산 월 비용이 더 낮습니다.',
    differenceSuffix: '/ 월 차이',
    monthlyEquivalent: '환산 비용 · 계약 조건',
    perMonth: ' / 월',
    flipped: '표시 월세가 낮은 계약과 환산 월 비용이 낮은 계약이 다릅니다.',
    traceCaption: '4단계 산출 과정',
    calculation: '산출 과정',
    rows: [
      '신고 보증금',
      '신고 월세',
      '검증된 연 전환율',
      '월 환산 비용',
    ],
    principalBoundary: '반환되는 보증금 원금 자체를 월세로 더하지 않고, 전체 보증금의 기회비용만 검증된 연 전환율로 환산합니다.',
  },
  hero: {
    eyebrow: '서울 · 계약 조건 비교',
    headingLead: '어느 계약 조건의',
    headingTail: '월 비용이 더 낮을까요?',
    description: '보증금과 월세가 다른 두 신고 계약을 같은 월 비용 기준으로 비교합니다.',
  },
  mode: {
    ariaLabel: '비교 방식',
    budget: '내 예산',
    budgetDescription: '개인 자금 입력이 필요해 아직 제공하지 않습니다',
    compare: '두 계약 비교',
    compareDescription: '검증 전환율 · 입력 즉시 갱신',
  },
  housingType: '주택 유형',
  apartment: '아파트',
  officetel: '오피스텔',
  reset: '초기화',
  evidence: {
    heading: '근거 범위',
    source: '출처',
    basis: '산출 근거',
    period: '기간',
    methodBoundary: '방법과 한계',
  },
  moreEvidence: '다른 시장 근거',
  localDistribution: '한 계약 조건을 해당 지역 분포와 비교',
  explore: '서울 구별 신고 계약 근거 보기',
  footer: [
    '두 보증금을 각각 환산하므로 표시 월세가 낮다고 반드시 월 환산 비용도 낮은 것은 아닙니다.',
    '전환율은 같은 단지와 같은 전용면적에서 보증금만 다른 신고 계약 쌍으로 측정했습니다.',
    '이 비교는 감정평가가 아니며 담보·과세·소송 목적으로 사용할 수 없습니다.',
  ],
  unavailable: {
    eyebrow: '서울 · 계약 조건 비교',
    title: '검증된 전환율 근거가 필요합니다.',
    actionLead: '전환율 자료가 준비될 때까지 공개된 서울 신고 계약 근거를 확인하세요.',
    actionLink: '서울 구별 탐색 열기',
  },
  curve: {
    ariaLabel: '실측 연 전환율 곡선',
    heading: '실측 전환율 곡선',
    description: '표식은 각 계약의 신고 보증금 위치입니다.',
    heldNotice: '실측 구간 밖 — 연장하지 않고 최근접 값을 유지합니다.',
  },
} as const satisfies ContractCheckCopy);

export const CONTRACT_CHECK_COPY: Readonly<Record<ProductLocale, ContractCheckCopy>> =
  Object.freeze({
    en: englishContractCheckCopy,
    ko: koreanContractCheckCopy,
  });

const KOREAN_LOCAL_ROUTES = new Set([
  '/kr/seoul/',
  '/kr/seoul/check/',
  '/kr/seoul/explore/',
  '/kr/seoul/rankings/',
]);

export function localizedSeoulHref(href: string, locale: ProductLocale): string {
  if (locale === 'en') return href;
  const [path, query] = href.split('?', 2);
  if (!KOREAN_LOCAL_ROUTES.has(path ?? '')) return href;
  return `/ko${path}${query === undefined ? '' : `?${query}`}`;
}

export function contractNavigationLabel(
  href: string | null,
  fallback: string,
  copy: ContractCheckCopy,
): string {
  if (href?.includes('/check/') || href === '/kr/seoul/check/') return copy.navigation.check;
  if (href?.includes('/explore/')) return copy.navigation.explore;
  if (href?.includes('/news/')) return copy.navigation.news;
  if (href?.includes('/guide/')) return copy.navigation.guide;
  return fallback;
}

const koreanContractErrors: Readonly<Record<string, string>> = Object.freeze({
  'Enter a deposit.': '보증금을 입력하세요.',
  'Enter monthly rent.': '월세를 입력하세요.',
  'Deposit must be a positive whole-won amount.': '보증금은 원 단위의 양의 정수여야 합니다.',
  'Monthly rent must be a positive whole-won amount.': '월세는 원 단위의 양의 정수여야 합니다.',
  'Monthly rent must be a non-negative whole-won amount.': '월세는 원 단위의 0 이상 정수여야 합니다.',
  'Deposit must be ₩20,000,000,000 or less.': '보증금은 200억원 이하여야 합니다.',
  'Monthly rent must be ₩100,000,000 or less.': '월세는 1억원 이하여야 합니다.',
  'Verified evidence for the selected housing type is unavailable.': '선택한 주택 유형의 검증 근거가 없습니다.',
  'These offers could not be compared with verified evidence.': '검증된 근거로 두 계약 조건을 비교할 수 없습니다.',
  'Deposit falls outside the measured range. No comparison is produced.': '보증금이 실측 구간을 벗어나 비교 결과를 만들지 않습니다.',
});

export function localizeContractText(value: string, locale: ProductLocale): string {
  return locale === 'ko' ? koreanContractErrors[value] ?? value : value;
}

export type PublicMarketCopy = Readonly<{
  tabs: Readonly<{
    ariaLabel: string;
    labels: Readonly<Record<'check' | 'explore' | 'news' | 'guide', string>>;
  }>;
  area: Readonly<{
    heroEyebrow: string;
    heroHeading: string;
    heroDescription: string;
    rankingsLink: string;
    coverageEyebrow: string;
    coverageHeading: string;
    districtsPublished: string;
    buildingsPublished: string;
    eligibleContracts: string;
    unavailable: string;
    of: string;
    eligibleSuffix: string;
    districtsBelowMinimum: string;
    retainedBuildingsBelowMinimum: string;
    buildingArtifactMissing: string;
    sourceCandidatesMissing: string;
    mapEyebrow: string;
    mapHeading: string;
    mapTitle: string;
    mapDescription: string;
    mapLegend: string;
    districtCount: string;
    notPublished: string;
    fewerThan: string;
    contracts: string;
    selected: string;
    buildingsEyebrow: string;
    buildingEvidence: string;
    noPublishedBuildings: string;
    noSyntheticBuildings: string;
    buildingArtifactReason: string;
    neighborhoodFilter: string;
    all: string;
    showMore: string;
    completeTableEyebrow: string;
    completeTableHeading: string;
    tableCaption: string;
    district: string;
    median: string;
    sample: string;
    evidence: string;
    open: string;
    selectedBuilding: string;
    new: string;
    renewal: string;
    unclassified: string;
    fullBuildingEvidence: string;
    unavailableEyebrow: string;
    unavailableReason: string;
    unavailableAction: string;
    unavailableActionLink: string;
  }>;
  summary: Readonly<{
    seoul: string;
    groups: Readonly<Record<'all' | 'new' | 'renewal', string>>;
    median: string;
    evidencePeriodSuffix: string;
    middleHalf: string;
    fullRange: string;
    spread: string;
    recentChange: string;
    sample: string;
    notPublished: string;
    minimumLead: string;
    minimumTail: string;
    withheldAction: string;
    snapshotReason: string;
    snapshotAction: string;
    unavailableReason: string;
    unavailableAction: string;
    unknownContract: string;
    sameDistrictPeriod: string;
    comparisonHeading: string;
    comparisonAria: string;
    sampleUnavailable: string;
    snapshotUnavailable: string;
    allLowerThanNew: string;
    reportedPeriod: string;
    openEvidence: string;
    selectorAria: string;
    splitUnavailable: string;
  }>;
  source: Readonly<{
    eyebrow: string;
    heading: string;
    disclosureAria: string;
    disclosureLabels: readonly [string, string, string, string, string, string, string, string];
    boundary: string;
    registry: string;
    registryValue: string;
    declaredPeriod: string;
    unavailablePeriod: string;
    filedArea: string;
    fixedFilter: string;
    fixedFilterValue: string;
    publicationRule: string;
    publicationRuleValue: string;
    nextUpdate: string;
    geometry: string;
    combinedBoundary: string;
    legalBoundary: string;
    unavailableTitle: string;
    unavailableReason: string;
    unavailableAction: string;
  }>;
  rankings: Readonly<{
    empty: string;
    rank: string;
    distribution: string;
    eyebrow: string;
    heading: string;
    descriptionLead: string;
    descriptionMiddle: string;
    descriptionTail: string;
    exclusionTail: string;
    periodLabel: string;
    lowerEyebrow: string;
    lowerTitle: string;
    lowerDefinition: string;
    lowerNote: string;
    changeEyebrow: string;
    changeTitle: string;
    changeDefinition: string;
    changeNote: string;
    excluded: string;
    noFall: string;
    spreadEyebrow: string;
    spreadTitle: string;
    spreadDefinition: string;
    spreadNote: string;
    sampleEyebrow: string;
    sampleTitle: string;
    sampleDefinition: string;
    sampleNote: string;
    limitationAria: string;
    limitation: string;
    unavailableEyebrow: string;
    unavailableMessage: string;
    unavailableReason: string;
    unavailableAction: string;
  }>;
  period: Readonly<{
    legendAria: string;
    complete: string;
    filing: string;
    unavailable: string;
    filingCaveat: string;
  }>;
  plot: Readonly<{
    countOne: string;
    countMany: string;
    withheld: string;
    minimum: string;
    minimumShort: string;
    p25: string;
    median: string;
    p75: string;
    maximum: string;
    maximumShort: string;
    middleHalf: string;
    marked: string;
  }>;
}>;

const englishPublicMarketCopy = Object.freeze({
  tabs: {
    ariaLabel: 'Public evidence sections',
    labels: { check: 'Check', explore: 'Explore', news: 'News', guide: 'Guide' },
  },
  area: {
    heroEyebrow: 'Seoul · Verified district evidence',
    heroHeading: 'Compare refundable jeonse deposits by district.',
    heroDescription: 'One official-data boundary, 25 districts and the same 45–55㎡ filter. Select a district to read its published evidence or explicit refusal.',
    rankingsLink: 'View district rankings',
    coverageEyebrow: 'Verified coverage',
    coverageHeading: 'What this snapshot can actually show',
    districtsPublished: 'Districts published',
    buildingsPublished: 'Buildings published',
    eligibleContracts: 'Eligible contracts',
    unavailable: 'Unavailable',
    of: 'of',
    eligibleSuffix: 'eligible contracts',
    districtsBelowMinimum: 'districts below publication minimum.',
    retainedBuildingsBelowMinimum: 'retained buildings below publication minimum.',
    buildingArtifactMissing: 'Verified building artifact is not loaded.',
    sourceCandidatesMissing: 'Source candidate building counts are not retained in this verified artifact.',
    mapEyebrow: '01 / District map',
    mapHeading: 'District median refundable jeonse deposit',
    mapTitle: 'Seoul district refundable jeonse deposit map',
    mapDescription: 'Five ranked median steps. Hatched districts are not published. The adjacent district table provides keyboard controls and exact values.',
    mapLegend: 'District median refundable jeonse deposit',
    districtCount: 'district',
    notPublished: 'Not published',
    fewerThan: 'fewer than',
    contracts: 'contracts',
    selected: 'Selected',
    buildingsEyebrow: '02 / Neighborhoods & buildings',
    buildingEvidence: 'building evidence',
    noPublishedBuildings: 'No building passes the five-contract publication rule here yet.',
    noSyntheticBuildings: 'Nothing synthetic is substituted.',
    buildingArtifactReason: 'District evidence stays available while the building snapshot is installed.',
    neighborhoodFilter: 'Neighborhood filter',
    all: 'All',
    showMore: 'Show 10 more buildings',
    completeTableEyebrow: '03 / Complete table',
    completeTableHeading: 'All 25 districts',
    tableCaption: 'Seoul district evidence in legal-code order',
    district: 'District',
    median: 'Median',
    sample: 'Sample',
    evidence: 'Evidence',
    open: 'Open',
    selectedBuilding: 'Selected building',
    new: 'New',
    renewal: 'Renewal',
    unclassified: 'Unclassified',
    fullBuildingEvidence: 'Open full building evidence',
    unavailableEyebrow: 'Seoul · District evidence',
    unavailableReason: 'The verified district artifact failed closed. No district money is substituted.',
    unavailableAction: 'Verified evidence is required before this map can publish figures.',
    unavailableActionLink: 'Return to Seoul evidence',
  },
  summary: {
    seoul: 'Seoul',
    groups: { all: 'All contracts', new: 'New contracts', renewal: 'Renewal contracts' },
    median: 'Median refundable jeonse deposit',
    evidencePeriodSuffix: 'in this reported evidence period.',
    middleHalf: 'Middle half',
    fullRange: 'Full range',
    spread: 'Spread interpretation',
    recentChange: 'Recent change',
    sample: 'Sample',
    notPublished: 'Not published',
    minimumLead: 'At least',
    minimumTail: 'are required before any district money is published.',
    withheldAction: 'Compare another contract group or return after the next completed update.',
    snapshotReason: 'The installed v1 snapshot remains available as combined All evidence.',
    snapshotAction: 'Select All or return after the v2 artifact is installed.',
    unavailableReason: 'No district figure is substituted when the verified artifact is unavailable.',
    unavailableAction: 'Return to Explore and choose another district.',
    unknownContract: 'Contract type unknown',
    sameDistrictPeriod: 'Same district · same period',
    comparisonHeading: 'New, renewal and combined',
    comparisonAria: 'Contract evidence comparison',
    sampleUnavailable: 'Sample unavailable',
    snapshotUnavailable: 'Snapshot unavailable',
    allLowerThanNew: 'Combined All is lower than New in this snapshot.',
    reportedPeriod: 'Reported evidence period',
    openEvidence: 'Open evidence',
    selectorAria: 'Contract type evidence',
    splitUnavailable: 'New/renewal split not available in this snapshot',
  },
  source: {
    eyebrow: 'Source and limits',
    heading: 'Read the evidence with its boundary.',
    disclosureAria: 'Evidence disclosure',
    disclosureLabels: ['Source', 'Dataset', 'Period', 'Generated', 'Method', 'Rights', 'Publication minimum', 'Boundary'],
    boundary: 'Reported contracts in the declared period, not current listings.',
    registry: 'Registry',
    registryValue: 'MOLIT reported rental contracts',
    declaredPeriod: 'Declared period',
    unavailablePeriod: 'Configured period unavailable',
    filedArea: 'Filed area',
    fixedFilter: 'Fixed filter',
    fixedFilterValue: 'Refundable zero-rent jeonse. Canceled records are excluded.',
    publicationRule: 'Publication rule',
    publicationRuleValue: 'Money is not published when n <',
    nextUpdate: 'Next update',
    geometry: 'Geometry',
    combinedBoundary: 'New and renewal contracts are combined. Unknown contract type and Unknown record status are included when the other fixed filters pass.',
    legalBoundary: 'Official reported contracts are not current listings, not an appraisal, and not legal advice.',
    unavailableTitle: 'Evidence source is unavailable',
    unavailableReason: 'The verified source descriptor could not be loaded.',
    unavailableAction: 'Try again after the source recovers.',
  },
  rankings: {
    empty: 'No eligible districts for this metric.',
    rank: 'Rank',
    distribution: 'reported deposit distribution',
    eyebrow: 'Seoul · Explore',
    heading: 'Seoul district rankings',
    descriptionLead: 'Four evidence views from MOLIT reported zero-rent jeonse contracts, the fixed 45–55㎡ filed-area band and declared period',
    descriptionMiddle: 'Money appears only when at least',
    descriptionTail: 'contracts qualify.',
    exclusionTail: 'districts excluded from monetary rankings because fewer qualifying contracts were available.',
    periodLabel: 'Ranking evidence period',
    lowerEyebrow: '01 / Lower reported deposits',
    lowerTitle: 'Median refundable jeonse deposit',
    lowerDefinition: 'Lowest filed median first for the displayed fixed filter. This is not a ranking of cheapest homes or affordability.',
    lowerNote: 'Published district summaries only.',
    changeEyebrow: '02 / Recent comparison',
    changeTitle: 'Three-month change not assessable',
    changeDefinition: 'Prior/latest sample counts were not retained in this snapshot.',
    changeNote: 'Stored change values are excluded from rankings until both comparison counts are retained.',
    excluded: 'districts excluded.',
    noFall: 'No eligible district fell in the latest comparison.',
    spreadEyebrow: '03 / Central dispersion',
    spreadTitle: 'Middle-half spread (P75 − P25)',
    spreadDefinition: 'Widest central-half deposit spread first. This is dispersion, not volatility, risk or negotiation room.',
    spreadNote: 'Calculated from raw P75 minus P25, not the full range.',
    sampleEyebrow: '04 / Evidence depth',
    sampleTitle: 'Qualifying reported contracts',
    sampleDefinition: 'Deepest qualifying sample first. Count is evidence depth under this filter, not market size, demand, liquidity or quality.',
    sampleNote: 'Counts are qualifying reported contracts in the declared aggregate period.',
    limitationAria: 'Ranking limitations',
    limitation: 'These ranks compare only the displayed fixed filter. They do not rank neighbourhoods, individual homes, legal safety, condition, transit, schools or future price movement.',
    unavailableEyebrow: 'Seoul · Explore',
    unavailableMessage: 'Verified district summary unavailable',
    unavailableReason: 'The verified district artifact failed closed. No district money is substituted.',
    unavailableAction: 'Return to District Explorer',
  },
  period: {
    legendAria: 'Period status legend',
    complete: 'Complete',
    filing: 'Filing in progress',
    unavailable: 'Declared period classification unavailable.',
    filingCaveat: 'The aggregate period distribution includes filing-in-progress months. It remains published, but no change comparison uses those months as anchors.',
  },
  plot: {
    countOne: 'reported contract',
    countMany: 'reported contracts',
    withheld: 'At least 5 are required before any market range is published.',
    minimum: 'Minimum',
    minimumShort: 'Min',
    p25: '25th percentile',
    median: 'Median',
    p75: '75th percentile',
    maximum: 'Maximum',
    maximumShort: 'Max',
    middleHalf: 'Middle half',
    marked: 'is marked on the same axis.',
  },
} as const satisfies PublicMarketCopy);

const koreanPublicMarketCopy = Object.freeze({
  tabs: {
    ariaLabel: '공개 계약 근거 메뉴',
    labels: { check: '계약 비교', explore: '구별 탐색', news: '뉴스', guide: '가이드' },
  },
  area: {
    heroEyebrow: '서울 · 검증된 구별 계약 근거',
    heroHeading: '서울 구별 전세보증금을 같은 기준으로 비교합니다.',
    heroDescription: '하나의 공식 자료 경계와 같은 45–55㎡ 필터로 서울 25개 구를 비교합니다. 구를 선택하면 게시된 근거나 게시하지 않는 이유를 확인할 수 있습니다.',
    rankingsLink: '구별 근거 순위 보기',
    coverageEyebrow: '검증된 커버리지',
    coverageHeading: '현재 자료가 실제로 보여주는 범위',
    districtsPublished: '게시된 구',
    buildingsPublished: '게시된 건물',
    eligibleContracts: '조건에 맞는 계약',
    unavailable: '확인되지 않음',
    of: '/',
    eligibleSuffix: '건',
    districtsBelowMinimum: '개 구가 게시 기준 미만입니다.',
    retainedBuildingsBelowMinimum: '개 보유 건물이 게시 기준 미만입니다.',
    buildingArtifactMissing: '검증된 건물 자료가 연결되지 않았습니다.',
    sourceCandidatesMissing: '원자료의 건물 후보 수는 현재 검증 자료에 보존되지 않았습니다.',
    mapEyebrow: '01 / 구 지도',
    mapHeading: '구 중앙값 전세보증금',
    mapTitle: '서울 구별 전세보증금 지도',
    mapDescription: '중앙값을 다섯 단계로 구분합니다. 빗금은 미게시 구이며, 옆 표에서 키보드로 구를 선택하고 정확한 값을 확인할 수 있습니다.',
    mapLegend: '구 중앙값 전세보증금',
    districtCount: '개 구',
    notPublished: '미게시',
    fewerThan: '표본',
    contracts: '건 미만',
    selected: '선택',
    buildingsEyebrow: '02 / 동과 건물',
    buildingEvidence: '건물 근거',
    noPublishedBuildings: '아직 5건 게시 기준을 통과한 건물이 없습니다.',
    noSyntheticBuildings: '가상의 건물이나 값을 대신 표시하지 않습니다.',
    buildingArtifactReason: '건물 자료가 연결되는 동안에도 구별 근거는 계속 볼 수 있습니다.',
    neighborhoodFilter: '동 필터',
    all: '전체',
    showMore: '건물 10개 더 보기',
    completeTableEyebrow: '03 / 전체 표',
    completeTableHeading: '서울 25개 구',
    tableCaption: '법정동 코드 순 서울 구별 계약 근거',
    district: '구',
    median: '중앙값',
    sample: '표본',
    evidence: '근거',
    open: '열기',
    selectedBuilding: '선택한 건물',
    new: '신규',
    renewal: '갱신',
    unclassified: '미분류',
    fullBuildingEvidence: '건물 상세 근거 열기',
    unavailableEyebrow: '서울 · 구별 계약 근거',
    unavailableReason: '검증된 구 자료를 불러오지 못했습니다. 다른 구의 금액으로 대체하지 않습니다.',
    unavailableAction: '검증 근거가 준비되어야 지도에 금액을 게시할 수 있습니다.',
    unavailableActionLink: '서울 계약 근거로 돌아가기',
  },
  summary: {
    seoul: '서울',
    groups: { all: '전체 계약', new: '신규 계약', renewal: '갱신 계약' },
    median: '전세보증금 중앙값',
    evidencePeriodSuffix: '신고 계약 근거 기간 기준입니다.',
    middleHalf: '중간 절반',
    fullRange: '전체 범위',
    spread: '분포 폭 해석',
    recentChange: '최근 변화',
    sample: '표본',
    notPublished: '미게시',
    minimumLead: '구별 금액을 게시하려면 최소',
    minimumTail: '건이 필요합니다.',
    withheldAction: '다른 계약 유형을 비교하거나 다음 완료 자료 이후 다시 확인하세요.',
    snapshotReason: '설치된 v1 자료에서는 전체 계약 근거만 확인할 수 있습니다.',
    snapshotAction: '전체를 선택하거나 v2 자료 연결 이후 다시 확인하세요.',
    unavailableReason: '검증 자료가 없을 때 다른 구의 값을 대신 표시하지 않습니다.',
    unavailableAction: '구별 탐색으로 돌아가 다른 구를 선택하세요.',
    unknownContract: '계약 유형 미분류',
    sameDistrictPeriod: '같은 구 · 같은 기간',
    comparisonHeading: '신규·갱신·전체 비교',
    comparisonAria: '계약 유형별 근거 비교',
    sampleUnavailable: '표본 확인 불가',
    snapshotUnavailable: '자료 없음',
    allLowerThanNew: '이 자료에서 전체 계약 중앙값이 신규 계약 중앙값보다 낮습니다.',
    reportedPeriod: '신고 계약 근거 기간',
    openEvidence: '상세 근거 열기',
    selectorAria: '계약 유형별 근거',
    splitUnavailable: '이 자료에는 신규·갱신 구분이 없습니다.',
  },
  source: {
    eyebrow: '출처와 한계',
    heading: '근거와 적용 범위를 함께 확인하세요.',
    disclosureAria: '근거 공개 정보',
    disclosureLabels: ['출처', '데이터셋', '기간', '생성 시각', '방법', '이용 권리', '게시 최소 표본', '적용 범위'],
    boundary: '표시 기간의 신고 계약이며 현재 매물 정보가 아닙니다.',
    registry: '신고 자료',
    registryValue: '국토교통부 신고 임대차 계약',
    declaredPeriod: '표시 기간',
    unavailablePeriod: '설정된 기간을 확인할 수 없음',
    filedArea: '신고 전용면적',
    fixedFilter: '고정 필터',
    fixedFilterValue: '월세 0원의 전세 계약이며 취소 건은 제외합니다.',
    publicationRule: '게시 기준',
    publicationRuleValue: '표본 수 n이 다음보다 작으면 금액을 게시하지 않습니다:',
    nextUpdate: '다음 갱신',
    geometry: '지도 경계',
    combinedBoundary: '신규와 갱신 계약을 함께 볼 수 있습니다. 다른 고정 필터를 통과하면 계약 유형 미분류와 상태 미분류 기록도 포함합니다.',
    legalBoundary: '공식 신고 계약은 현재 매물이 아니며 감정평가나 법률 자문이 아닙니다.',
    unavailableTitle: '근거 출처를 확인할 수 없습니다.',
    unavailableReason: '검증된 출처 정보를 불러오지 못했습니다.',
    unavailableAction: '출처가 복구된 뒤 다시 확인하세요.',
  },
  rankings: {
    empty: '이 지표에 게시할 수 있는 구가 없습니다.',
    rank: '순위',
    distribution: '신고 전세보증금 분포',
    eyebrow: '서울 · 구별 탐색',
    heading: '서울 구별 근거 순위',
    descriptionLead: '국토교통부 신고 전세 계약, 45–55㎡ 고정 면적과 표시 기간',
    descriptionMiddle: '금액은 조건에 맞는 계약이 최소',
    descriptionTail: '건일 때만 표시합니다.',
    exclusionTail: '개 구는 표본 부족으로 금액 순위에서 제외했습니다.',
    periodLabel: '순위 근거 기간',
    lowerEyebrow: '01 / 낮은 신고 보증금',
    lowerTitle: '신고 전세보증금 중앙값',
    lowerDefinition: '같은 고정 필터에서 신고 중앙값이 낮은 순서입니다. 주택 가격이나 주거비 부담 순위가 아닙니다.',
    lowerNote: '게시 기준을 통과한 구만 포함합니다.',
    changeEyebrow: '02 / 최근 비교',
    changeTitle: '3개월 변화 확인 불가',
    changeDefinition: '이 자료에는 이전·최근 비교 표본 수가 보존되지 않았습니다.',
    changeNote: '두 비교 표본 수가 모두 보존될 때까지 저장된 변화율을 순위에서 제외합니다.',
    excluded: '개 구 제외',
    noFall: '최근 비교에서 하락한 적격 구가 없습니다.',
    spreadEyebrow: '03 / 중간 분포',
    spreadTitle: '중간 절반 분포 폭',
    spreadDefinition: 'P75에서 P25를 뺀 폭이 넓은 순서입니다. 변동성·위험·협상 여지를 뜻하지 않습니다.',
    spreadNote: '전체 범위가 아니라 P75−P25 원자료로 계산합니다.',
    sampleEyebrow: '04 / 근거 깊이',
    sampleTitle: '신고 계약 표본 수',
    sampleDefinition: '조건에 맞는 표본이 많은 순서입니다. 시장 규모·수요·유동성·품질 순위가 아닙니다.',
    sampleNote: '표시된 집계 기간과 고정 필터에 맞는 신고 계약 수입니다.',
    limitationAria: '순위 해석의 한계',
    limitation: '이 순위는 표시된 고정 필터만 비교합니다. 동네·개별 주택·법적 안전성·상태·교통·학교·향후 가격을 순위화하지 않습니다.',
    unavailableEyebrow: '서울 · 구별 탐색',
    unavailableMessage: '검증된 구별 자료를 확인할 수 없습니다.',
    unavailableReason: '검증 자료를 불러오지 못했으며 다른 구의 금액으로 대체하지 않습니다.',
    unavailableAction: '구별 탐색으로 돌아가기',
  },
  period: {
    legendAria: '기간 상태 범례',
    complete: '완료',
    filing: '신고 진행 중',
    unavailable: '표시 기간의 완료 여부를 확인할 수 없습니다.',
    filingCaveat: '집계 기간에 신고 진행 중인 월이 포함됩니다. 분포는 표시하지만 해당 월을 변화 비교 기준으로 사용하지 않습니다.',
  },
  plot: {
    countOne: '건의 신고 계약',
    countMany: '건의 신고 계약',
    withheld: '시장 범위를 게시하려면 최소 5건이 필요합니다.',
    minimum: '최솟값',
    minimumShort: '최소',
    p25: '25백분위',
    median: '중앙값',
    p75: '75백분위',
    maximum: '최댓값',
    maximumShort: '최대',
    middleHalf: '중간 절반',
    marked: '같은 축에 표시했습니다.',
  },
} as const satisfies PublicMarketCopy);

export const PUBLIC_MARKET_COPY: Readonly<Record<ProductLocale, PublicMarketCopy>> =
  Object.freeze({ en: englishPublicMarketCopy, ko: koreanPublicMarketCopy });

export function localizedGroupLabel(
  group: 'all' | 'new' | 'renewal',
  locale: ProductLocale,
): string {
  return PUBLIC_MARKET_COPY[locale].summary.groups[group];
}

export function localizeSampleLabel(value: string, locale: ProductLocale): string {
  if (locale === 'en') return value;
  const match = /^(\d[\d,]*) reported contracts?$/.exec(value);
  return match === null ? value : `${match[1]}건의 신고 계약`;
}

export function localizeEvidenceMessage(value: string, locale: ProductLocale): string {
  if (locale === 'en') return value;
  const translations: Readonly<Record<string, string>> = {
    'Verified district summary unavailable': '검증된 구별 자료를 확인할 수 없습니다.',
    'New/renewal split not available in this snapshot': '이 자료에는 신규·갱신 구분이 없습니다.',
    '3-month change not assessable': '3개월 변화 확인 불가',
    'Prior/latest sample counts were not retained in this snapshot.': '이 자료에는 이전·최근 비교 표본 수가 보존되지 않았습니다.',
    'A three-month change was not retained in this snapshot.': '이 자료에는 3개월 변화가 보존되지 않았습니다.',
    'Retained prior/latest sample counts were invalid.': '보존된 이전·최근 표본 수를 사용할 수 없습니다.',
    'The absolute change is at least 10%.': '변화율의 절댓값이 10% 이상입니다.',
    'The prior three-month sample is below 30.': '이전 3개월 표본이 30건 미만입니다.',
    'The latest three-month sample is below 30.': '최근 3개월 표본이 30건 미만입니다.',
    'The sample size changed by at least 25%.': '표본 수가 25% 이상 달라졌습니다.',
  };
  return translations[value] ?? value;
}
