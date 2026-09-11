import type { ProductLocale } from './product-copy';
const copy: Readonly<Record<string, readonly [string, string]>> = {"KRW million": ["백만원", "百万韩元"], "Monthly rent": ["월세", "月租"], "Annual rent": ["연 임대료", "年租金"], "SGD/month": ["싱가포르달러/월", "新元/月"], "AED/year": ["디르함/년", "迪拉姆/年"], "Below the typical range": ["일반적인 구간보다 낮음", "低于常见区间"], "Above the typical range": ["일반적인 구간보다 높음", "高于常见区间"], "Within the typical range": ["일반적인 구간 안", "处于常见区间"],
  "Community response": [
    "이용자 의견",
    "用户反馈"
  ],
  "Community signal": [
    "이용자 체감",
    "用户感受"
  ],
  "Compared with SignedPrice's evidence, what are you seeing now?": [
    "SignedPrice 거래 자료와 비교해 현재 현장은 어떤가요?",
    "与SignedPrice交易数据相比，您目前观察到的情况如何？"
  ],
  "Community responses are not open yet": [
    "아직 의견을 받지 않습니다",
    "暂未开放反馈"
  ],
  "Durable response storage is not configured. No response can be saved yet.": [
    "의견 저장 기능이 준비되지 않아 아직 저장할 수 없습니다.",
    "反馈存储功能尚未配置，暂时无法保存。"
  ],
  "Private response identity is not configured. No response can be saved yet.": [
    "비공개 응답 식별 기능이 준비되지 않아 아직 저장할 수 없습니다.",
    "私密反馈身份功能尚未配置，暂时无法保存。"
  ],
  "Write protection is not configured. No response can be saved yet.": [
    "응답 보호 기능이 준비되지 않아 아직 저장할 수 없습니다.",
    "反馈写入保护尚未配置，暂时无法保存。"
  ],
  "A current verified evidence scope is required before responses can open.": [
    "의견을 받으려면 현재 검증된 거래 자료 범위가 필요합니다.",
    "开放反馈前需要当前已核验的交易数据范围。"
  ],
  "Self-selected response, not a representative survey.": [
    "자발적 참여 결과이며 대표성 있는 설문이 아닙니다.",
    "结果来自自愿参与，不是具有代表性的调查。"
  ],
  "Community responses never change official evidence, Rankings, Contract Check, or News.": [
    "이용자 의견은 공식 자료·순위·계약 비교·뉴스 결과에 반영되지 않습니다.",
    "用户反馈不会改变官方数据、排名、合同比较或新闻。"
  ],
  "Specific line or block": [
    "특정 라인·동",
    "特定单元或楼栋"
  ],
  "Aspect or orientation": [
    "방향",
    "朝向"
  ],
  "Floor": [
    "층수",
    "楼层"
  ],
  "Remodeling or condition": [
    "수리·관리 상태",
    "装修或维护状况"
  ],
  "View": [
    "조망",
    "景观"
  ],
  "Noise": [
    "소음",
    "噪音"
  ],
  "Other bounded factor": [
    "기타 구체적 요인",
    "其他具体因素"
  ],
  "Higher": [
    "더 높음",
    "更高"
  ],
  "Similar": [
    "비슷함",
    "相近"
  ],
  "Lower": [
    "더 낮음",
    "更低"
  ],
  "Checking response availability…": [
    "의견 참여 가능 여부 확인 중…",
    "正在检查反馈功能…"
  ],
  "Responses are being collected": [
    "의견을 모으고 있습니다",
    "正在收集反馈"
  ],
  "Counts and direction breakdowns appear only after the privacy threshold is reached.": [
    "개인정보 보호를 위한 최소 응답 수를 충족한 뒤 건수와 응답 분포를 표시합니다.",
    "达到隐私保护所需的最低反馈数后才显示数量与分布。"
  ],
  "community responses": [
    "개 의견",
    "条用户反馈"
  ],
  "Other responses": [
    "기타 의견",
    "其他反馈"
  ],
  "Your bounded response": [
    "현재 체감 선택",
    "选择当前感受"
  ],
  "Optional reason": [
    "이유 선택(선택 사항)",
    "原因（可选）"
  ],
  "No reason selected": [
    "이유 선택 안 함",
    "未选择原因"
  ],
  "Submit response": [
    "의견 제출",
    "提交反馈"
  ],
  "Replace response": [
    "의견 수정",
    "修改反馈"
  ],
  "Delete my response": [
    "내 의견 삭제",
    "删除我的反馈"
  ],
  "Response saved.": [
    "의견을 저장했습니다.",
    "反馈已保存。"
  ],
  "Too many changes. Try again later.": [
    "변경 요청이 많습니다. 잠시 후 다시 시도하세요.",
    "修改过于频繁，请稍后重试。"
  ],
  "Response was not saved. Try again later.": [
    "의견을 저장하지 못했습니다. 잠시 후 다시 시도하세요.",
    "反馈未保存，请稍后重试。"
  ],
  "Quote position": [
    "입력 가격 위치",
    "输入价格位置"
  ],
  "Area": [
    "지역",
    "地区"
  ],
  "Your quote": [
    "입력 가격",
    "您的报价"
  ],
  "Your deposit": [
    "입력 보증금",
    "您的押金"
  ],
  "Refundable deposit": [
    "반환 보증금",
    "可退还押金"
  ],
  "Enter a non-negative amount with up to two decimal places, without commas.": [
    "쉼표 없이 0 이상의 금액을 소수점 두 자리까지 입력하세요.",
    "请输入非负金额，最多两位小数，不含逗号。"
  ],
  "Difference from the median is unavailable": [
    "중앙값과의 차이를 확인할 수 없습니다",
    "无法计算与中位数的差异"
  ],
  "Equal to the median": [
    "중앙값과 같음",
    "等于中位数"
  ],
  "Market position withheld": [
    "가격 위치 비교 보류",
    "暂不显示价格位置"
  ],
  "More reported evidence is required before comparing a quote.": [
    "입력 가격을 비교하려면 신고 거래 자료가 더 필요합니다.",
    "比较报价前需要更多申报交易数据。"
  ],
  "Below typical": [
    "낮은 가격 구간",
    "低于常见区间"
  ],
  "Within typical": [
    "일반적인 가격 구간",
    "处于常见区间"
  ],
  "Above typical": [
    "높은 가격 구간",
    "高于常见区间"
  ]
};
export function widgetText(locale: ProductLocale, text: string): string { return locale === 'en' ? text : copy[text]?.[locale === 'ko' ? 0 : 1] ?? text; }
