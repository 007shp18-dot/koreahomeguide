import type { ContentLocale, ContentSource } from '../lib/content/content-types';
import { portfolioRecord, RELEASES } from './portfolio-builders';
import type { EditorialPortfolioRecord } from './portfolio-types';

type PolicyCopy = Readonly<{
  title: string; deck: string; question: string;
  points: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  boundary: string;
}>;
const checkedAt = '2026-09-09';
const reviewedAt = '2026-09-09T07:05:41.000Z';
const links = {
  "priority": "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629",
  "foreign": "https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=629&popMenu=ov",
  "address": "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000026",
  "guarantee": "https://www.hf.go.kr/ko/sub02/sub02_05_01.do",
  "absd": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29",
  "bsd": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29",
  "fta": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29"
} as const;
const sources = {
  priority: { id: "kr-lease-priority", kind: 'primary', publisher: "Ministry of Government Legislation", title: "Housing tenancy: opposability and priority repayment", href: links.priority, checkedAt, publishedAt: null },
  foreign: { id: "kr-foreign-tenant", kind: 'primary', publisher: "Ministry of Government Legislation", title: "Housing Lease Protection Act: foreign tenants", href: links.foreign, checkedAt, publishedAt: null },
  address: { id: "kr-foreign-address", kind: 'primary', publisher: "Government24", title: "Registered foreigner: change of residence", href: links.address, checkedAt, publishedAt: null },
  guarantee: { id: "hf-return-guarantee", kind: 'primary', publisher: "Korea Housing Finance Corporation", title: "General Jeonse Protection Guarantee", href: links.guarantee, checkedAt, publishedAt: null },
  absd: { id: "sg-iras-absd", kind: 'primary', publisher: "Inland Revenue Authority of Singapore", title: "Additional Buyer\u2019s Stamp Duty", href: links.absd, checkedAt, publishedAt: null },
  bsd: { id: "sg-iras-bsd", kind: 'primary', publisher: "Inland Revenue Authority of Singapore", title: "Buyer\u2019s Stamp Duty", href: links.bsd, checkedAt, publishedAt: null },
  fta: { id: "sg-iras-fta", kind: 'primary', publisher: "Inland Revenue Authority of Singapore", title: "FTA remission conditions", href: links.fta, checkedAt, publishedAt: null }
} satisfies Record<keyof typeof links, ContentSource>;

const depositCopy = {
  "en": {
    "title": "Korea rental deposits: what a fixed date does—and what it cannot do",
    "deck": "Possession, residence reporting and a fixed date serve different purposes. Build a payment and move-in timetable that keeps those differences visible.",
    "question": "Does a fixed date alone protect my Korean rental deposit?",
    "points": [
      [
        "The protection depends on the sequence",
        "A fixed date alone does not establish the ordinary priority-repayment right. The tenant also needs possession and the applicable residence-registration requirements. Opposability—the ability to assert the tenancy against a new owner—normally begins the day after possession and registration are both completed. Ordinary priority repayment additionally requires the fixed date and concerns later-ranking claims. Neither step promises full recovery. [Legal requirements](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629)."
      ],
      [
        "For a foreign resident, identify the reporting route",
        "Official guidance recognises the protection route through foreigner registration and a residence-change report equivalent to resident registration. Government24 gives registered foreigners 15 days after moving to report a new address. That administrative deadline is not a reason to leave the protection requirements incomplete until day 15. This timing does not cover every overseas-Korean residence-reporting category. [Foreign-tenant guidance](https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=629&popMenu=ov); [registered-foreigner procedure](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000026).\n\nIllustrative sequence: if possession and the applicable address registration are both completed on 10 September and the fixed date is already obtained, ordinary opposability begins on 11 September. A fixed date obtained on 8 September does not bring that start forward. Earlier rights and the actual registry still matter."
      ],
      [
        "Read documents against the money you will send",
        "Use this as a preparation table for the agent, public office and any guarantee provider. The final column is SignedPrice’s recommended workflow.\n\n| Record | What to read | What the answer changes |\n| --- | --- | --- |\n| Current title register and contract | Exact unit, landlord, registered claims and payment recipient | Resolve a mismatch before transferring money |\n| Possession and address-report records | Actual handover and completed reporting dates | Establish the protection timetable |\n| Contract with a fixed date | Unit, parties, deposit and date | Check that the recorded contract is the one being funded |\n| Guarantee product and decision | Applicant eligibility, property rules, application deadline and coverage | Budget only for cover actually accepted |\n\nA return guarantee is a separate product. For example, HF’s General Jeonse Protection Guarantee has its own loan-linked eligibility and application timing, including a distinct Toss Bank deadline. Its conditions cannot be applied to all providers or used to promise a foreign applicant acceptance. [HF product conditions](https://www.hf.go.kr/ko/sub02/sub02_05_01.do)."
      ]
    ],
    "boundary": "This explains the ordinary possession/registration/fixed-date route, not every statutory exception or a ranking decision for a particular property. Resolve title or guarantee uncertainty before committing the deposit."
  },
  "ko": {
    "title": "확정일자만 받으면 전세보증금이 보호될까?",
    "deck": "입주, 전입·체류지 신고와 확정일자는 역할이 다르다. 각 절차의 날짜를 잔금 일정과 맞춰야 보증금 보호의 빈틈을 찾을 수 있다.",
    "question": "확정일자만으로 한국 임대차보증금이 보호되는가?",
    "points": [
      [
        "확정일자보다 먼저 구분할 두 권리",
        "확정일자만으로 일반적인 우선변제권을 갖추는 것은 아니다. 주택을 인도받고 필요한 주민등록 요건도 충족해야 한다. 새 소유자 등에게 임대차를 주장하는 대항력은 통상 인도와 주민등록을 모두 마친 다음 날 생긴다. 여기에 확정일자를 갖추면 후순위권리자 등에 대한 우선변제권을 확보할 수 있다. 보증금 전액의 회수가 보장된다는 뜻은 아니다. [법제처의 요건 설명](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629)."
      ],
      [
        "외국인이라면 적용되는 주소 신고부터",
        "공식 안내는 외국인등록과 전입신고에 준하는 체류지 변경신고를 통한 보호 경로를 설명한다. 정부24가 안내하는 등록외국인의 체류지 변경신고 기한은 이사한 날부터 15일 이내다. 행정상 기한이 남았다는 이유로 보증금 보호에 필요한 신고를 15일째까지 미뤄도 된다는 뜻은 아니다. 이 기한을 모든 재외동포 거소신고 유형에 적용해서도 안 된다. [외국인 임차인 안내](https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=629&popMenu=ov) · [등록외국인 신고 절차](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000026).\n\n가령 9월 10일에 인도와 해당 주소 신고를 모두 마쳤고 확정일자도 받아두었다면, 일반적인 대항력 발생일은 9월 11일이다. 확정일자를 9월 8일에 받았어도 그 날짜부터 대항력이 생기지는 않는다. 앞서 설정된 권리와 실제 등기 상태는 별도로 살펴야 한다."
      ],
      [
        "서류의 어느 항목이 지급 결정을 바꾸나",
        "중개사·담당 기관·보증기관과 확인할 내용을 아래처럼 정리한다. 마지막 열은 SignedPrice가 제안하는 확인 순서다.\n\n| 서류 | 읽을 항목 | 달라지는 결정 |\n| --- | --- | --- |\n| 최신 등기와 계약서 | 정확한 호수, 임대인, 등기된 권리, 수취인 | 불일치가 있으면 송금 전에 해소 |\n| 인도·주소 신고 기록 | 실제 인도일과 신고 완료일 | 보호 요건을 갖추는 시점 정리 |\n| 확정일자 있는 계약서 | 목적물, 당사자, 보증금, 부여일 | 실제 지급하는 계약과 일치하는지 대조 |\n| 보증 상품과 심사 결과 | 신청인 자격, 주택 조건, 신청 기한, 보장 범위 | 승인된 보장만 자금 계획에 반영 |\n\n반환보증은 별도 상품이다. 예를 들어 HF 일반전세지킴보증에는 전세자금보증과 연결된 가입 요건과 신청 시점이 있으며 토스뱅크 이용 시 기한도 따로 안내한다. 이를 모든 보증기관의 공통 조건으로 보거나 외국인 신청인의 가입 승인으로 해석하면 안 된다. [HF 상품 조건](https://www.hf.go.kr/ko/sub02/sub02_05_01.do)."
      ]
    ],
    "boundary": "일반적인 인도·신고·확정일자 경로를 설명한 글이다. 모든 법정 예외나 특정 주택의 권리 순위를 판정하지 않는다. 등기나 보증 가입에 남은 의문은 보증금을 확정하기 전에 해결한다."
  },
  "zh-CN": {
    "title": "韩国租房：取得确定日期就能保住押金吗？",
    "deck": "入住、居住申报与确定日期各有作用。把完成日期放进付款时间表，才能看见尚未落实的保护条件。",
    "question": "只有确定日期，是否足以保护韩国租房押金？",
    "points": [
      [
        "先分清两项权利",
        "确定日期本身不足以形成通常的优先受偿权，还需要交付占有房屋并满足相应的居住登记条件。可以对新业主等主张租约的对抗力，通常从交付与登记均完成的次日起产生；普通优先受偿还需要确定日期，针对的是后顺位权利等。这不等于押金一定全额返还。[法定条件说明](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629)。"
      ],
      [
        "外国租客要核对自己的申报路径",
        "官方说明承认外国人登记及相当于迁入申报的居留地变更申报路径。政府24列明，已登记外国人应在搬入后15日内申报地址变更；行政期限并不意味着可以等到第15日才落实保护条件。不能将该期限套用于所有海外韩裔居所申报类别。[外国租客说明](https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=629&popMenu=ov) · [地址申报程序](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000026)。\n\n假设9月10日完成交付及适用的地址登记，并已取得确定日期，通常的对抗力从9月11日起产生。即使确定日期是9月8日，也不会提前该起点。此前的权利及实际登记状况仍须另行判断。"
      ],
      [
        "逐份文件对应付款决定",
        "下表最后一栏是SignedPrice建议的核验顺序。\n\n| 文件 | 具体字段 | 对决定的影响 |\n| --- | --- | --- |\n| 最新产权登记与合同 | 房号、出租人、登记权利及收款人 | 不一致时先澄清再付款 |\n| 交付与地址申报记录 | 实际交付日、申报完成日 | 整理保护条件成立的时间 |\n| 有确定日期的合同 | 房屋、当事人、押金及日期 | 核对是否为实际付款的合同 |\n| 保证产品与审查结果 | 申请人、房屋、期限、保障范围 | 只把已获接受的保障列入计划 |\n\n押金返还保证是独立产品。例如HF一般全租保护保证有与其租赁贷款保证相连的资格条件和申请时点，Toss Bank渠道另有期限。不能据此推断所有机构条件相同，或某位外国申请人必然获批。[HF产品条件](https://www.hf.go.kr/ko/sub02/sub02_05_01.do)。"
      ]
    ],
    "boundary": "本文说明通常的交付、登记及确定日期路径，不涵盖所有法定例外，也不判定特定房屋的受偿顺位。应在承诺押金前解决登记或保证资格上的疑问。"
  }
} as const satisfies Record<ContentLocale, PolicyCopy>;

const absdCopy = {
  "en": {
    "title": "Singapore ABSD: the tax that can change your home budget",
    "deck": "At the same S$1.5 million price and market value, a standard foreign individual buyer’s ABSD is S$900,000 before BSD. Buyer status and relief must be established first.",
    "question": "How much does ABSD add to my Singapore purchase, and which exceptions matter?",
    "points": [
      [
        "Use the individual-buyer rate that fits the acquisition",
        "IRAS’s rates effective from 27 April 2023 remain on its current table, checked 9 September 2026. Apply the rate to the higher of consideration and market value. This summary covers individual residential buyers before remission; entities, trusts and developers need their own rules. [IRAS ABSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29).\n\n| Individual buyer | First home | Second | Third or later |\n| --- | --- | --- | --- |\n| Singapore citizen | 0% | 20% | 30% |\n| Singapore permanent resident | 5% | 30% | 35% |\n| Foreigner, standard treatment | 60% | 60% | 60% |\n\nCount Singapore residential interests, including partial holdings; overseas homes are excluded from that count. A jointly purchased home generally uses the highest applicable buyer rate, before any specific relief."
      ],
      [
        "Work out the tax before deciding the down payment",
        "Assume a single buyer acquires a residential home with both price and market value of S$1,500,000, with no remission. This is a calculation, not a listing or a finance offer.\n\n| Buyer in this example | ABSD | BSD | Combined duty |\n| --- | --- | --- | --- |\n| Citizen, first home | S$0 | S$44,600 | S$44,600 |\n| Permanent resident, first home | S$75,000 | S$44,600 | S$119,600 |\n| Foreigner, standard treatment | S$900,000 | S$44,600 | S$944,600 |\n\nBSD uses the residential bands effective from 15 February 2023: 1% of the first S$180,000, 2% of the next S$180,000, 3% of the next S$640,000 and 4% of the remaining S$500,000 here. ABSD is additional. Loan proceeds and the equity contribution need a separate cash schedule; this table omits legal, valuation and other acquisition fees. [IRAS BSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29)."
      ],
      [
        "Resolve the exception before committing",
        "FTA treatment applies to nationals and permanent residents of Iceland, Liechtenstein, Norway and Switzerland, and to US nationals: qualifying buyers receive Singapore-citizen ABSD treatment. US permanent residence alone is not on that list. Citizenship-equivalent treatment is not a blanket zero rate, since property count still matters. [IRAS FTA remission](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29).\n\nAsk the conveyancer to record buyer status at acquisition, Singapore property interests, each joint buyer, the duty base and any specific remission being claimed. A later status change does not ordinarily rewrite the original liability. Keep an unapproved refund out of the cash available for completion."
      ]
    ],
    "boundary": "Rates checked 9 September 2026. The examples assume one individual buyer and no remission; they do not establish HDB eligibility, permission to acquire restricted property or loan approval."
  },
  "ko": {
    "title": "싱가포르 ABSD, 집값 외에 얼마를 더 준비해야 할까?",
    "deck": "매매가와 시가가 모두 150만 싱가포르달러인 집에서 일반 외국인 개인의 ABSD는 90만 달러다. BSD를 더하기 전에 구매자 신분과 감면 조건부터 정리해야 한다.",
    "question": "싱가포르 주택 구매에 ABSD가 얼마나 더해지며 어떤 예외가 중요한가?",
    "points": [
      [
        "구매자 조건에 맞는 세율부터",
        "2026년 9월 9일 확인한 IRAS 현행 표에는 2023년 4월 27일부터 적용된 세율이 유지돼 있다. 과세표준은 거래대가와 시가 중 큰 금액이다. 아래는 감면 전 개인의 주거용 부동산 취득 기준이며 법인·신탁·개발사업자는 별도 규칙을 적용한다. [IRAS ABSD 안내](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29).\n\n| 개인 구매자 | 첫 주택 | 두 번째 | 세 번째 이상 |\n| --- | --- | --- | --- |\n| 싱가포르 시민 | 0% | 20% | 30% |\n| 싱가포르 영주권자 | 5% | 30% | 35% |\n| 일반 외국인 | 60% | 60% | 60% |\n\n보유 수에는 싱가포르 주거용 부동산의 일부 지분도 포함하며 해외 주택은 제외한다. 공동 구매는 특정 감면을 적용하기 전, 원칙적으로 구매자 중 가장 높은 적용 세율을 기준으로 한다."
      ],
      [
        "계약금보다 세금부터 계산하면 보이는 예산",
        "한 사람이 매매가와 시가가 모두 150만 싱가포르달러인 주택을 감면 없이 취득한다고 가정한다. 실제 매물이나 대출 제안이 아닌 계산 예시다.\n\n| 예시의 구매자 | ABSD | BSD | 두 세금 합계 |\n| --- | --- | --- | --- |\n| 시민, 첫 주택 | S$0 | S$44,600 | S$44,600 |\n| 영주권자, 첫 주택 | S$75,000 | S$44,600 | S$119,600 |\n| 일반 외국인 | S$900,000 | S$44,600 | S$944,600 |\n\nBSD는 2023년 2월 15일부터 적용된 주거용 구간별 세율로 계산했다. 첫 18만 달러에 1%, 다음 18만 달러에 2%, 다음 64만 달러에 3%, 이 예시의 나머지 50만 달러에 4%를 적용하면 44,600달러다. ABSD는 여기에 더해진다. 대출과 자기자금의 지급 일정은 따로 작성해야 하며 위 표에는 법률·평가 등 다른 취득 비용은 들어 있지 않다. [IRAS BSD 안내](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29)."
      ],
      [
        "예외는 계약 전에 확인한다",
        "FTA에 따라 아이슬란드·리히텐슈타인·노르웨이·스위스의 국민과 영주권자, 미국 국민은 요건을 충족하면 싱가포르 시민과 같은 ABSD 대우를 받는다. 미국 영주권만 가진 경우는 이 목록에 없다. 시민과 같은 대우란 보유 주택 수도 반영한다는 뜻이지 언제나 0%라는 뜻은 아니다. [IRAS FTA 감면 안내](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29).\n\n담당 법률가와 취득 시점의 신분, 싱가포르 주택 지분, 공동 구매자 각각의 조건, 과세표준과 신청할 감면을 서면으로 정리한다. 취득 후 신분이 바뀌었다고 원래 세금이 통상 자동으로 다시 계산되지는 않는다. 승인되지 않은 환급은 잔금에 쓸 수 있는 돈에서 뺀다."
      ]
    ],
    "boundary": "세율 확인일은 2026년 9월 9일이다. 계산은 개인 1명의 감면 없는 취득을 가정하며 HDB 구매 자격, 제한 부동산 취득 허가나 대출 승인을 뜻하지 않는다."
  },
  "zh-CN": {
    "title": "新加坡ABSD：房价之外还要准备多少税款？",
    "deck": "房价与市值同为150万新元时，按普通外国个人税率计算的ABSD为90万新元，另加BSD。先确认身份及减免，才能判断预算。",
    "question": "ABSD会增加多少购房成本，哪些例外会改变结果？",
    "points": [
      [
        "先选对个人买方税率",
        "截至2026年9月9日核对，IRAS现行表仍列明2023年4月27日起的税率。计税基础为交易对价与市值中的较高者。下表适用于减免前个人住宅购买；实体、信托及开发商另有规则。[IRAS ABSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29)。\n\n| 个人买方 | 首套 | 第二套 | 第三套及以后 |\n| --- | --- | --- | --- |\n| 新加坡公民 | 0% | 20% | 30% |\n| 新加坡永久居民 | 5% | 30% | 35% |\n| 普通外国人 | 60% | 60% | 60% |\n\n套数计算包括新加坡住宅的部分权益，境外住宅不计入。共同购买通常按买方中最高适用税率处理，再考虑具体减免。"
      ],
      [
        "同一房价，三种税款预算",
        "假设一位个人以150万新元购买市值同为150万的住宅，且没有减免。这是算例，不是真实房源或贷款报价。\n\n| 算例中的买方 | ABSD | BSD | 合计 |\n| --- | --- | --- | --- |\n| 公民，首套 | S$0 | S$44,600 | S$44,600 |\n| 永久居民，首套 | S$75,000 | S$44,600 | S$119,600 |\n| 普通外国人 | S$900,000 | S$44,600 | S$944,600 |\n\nBSD采用2023年2月15日起的住宅累进税率：首18万的1%、随后18万的2%、随后64万的3%，以及本例剩余50万的4%，合计44,600新元。ABSD在此之外另加。贷款与自有资金另列支付时间表；上表不含律师、估价及其他购入费用。[IRAS BSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29)。"
      ],
      [
        "承诺购买前落实例外",
        "符合FTA条件的冰岛、列支敦士登、挪威、瑞士国民及永久居民，以及美国国民，可获与新加坡公民相同的ABSD待遇。仅持美国永久居民身份不在此名单内。相同待遇仍须考虑住宅套数，并非一律0%。[IRAS FTA减免](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29)。\n\n请过户律师记录取得时身份、新加坡住宅权益、每位共同买方、计税基础及具体减免。取得后身份变化通常不会自动重算原税款。尚未批准的退款，不应计入可用于交割的现金。"
      ]
    ],
    "boundary": "税率核对日为2026年9月9日。算例假设一位个人且无减免，不代表HDB资格、受限制房产购买许可或贷款批准。"
  }
} as const satisfies Record<ContentLocale, PolicyCopy>;

export function policyExplainers(locale: ContentLocale): readonly EditorialPortfolioRecord[] {
  return (['deposit', 'absd'] as const).map(topic => {
    const deposit = topic === 'deposit';
    const slug = locale === 'zh-CN'
      ? (deposit ? 'kr-rental-deposit-protection-zh' : 'sg-absd-policy-zh')
      : (deposit ? 'korea-rental-deposit-protection-status' : 'singapore-absd-policy-status');
    const record = portfolioRecord({
      ...(deposit ? depositCopy[locale] : absdCopy[locale]), slug, locale,
      type: 'policy-update', marketId: deposit ? 'kr-seoul' : 'sg-singapore',
      sources: deposit ? [sources.priority, sources.foreign, sources.address, sources.guarantee] : [sources.absd, sources.bsd, sources.fta],
      evidenceReleaseIds: [deposit ? RELEASES.policyKorea : RELEASES.policySingapore],
      translationGroupId: deposit ? 'kr-rental-deposit-protection' : 'sg-absd',
      relatedHref: deposit ? '/kr/seoul/check/' : '/sg/singapore/check/',
    });
    return Object.freeze({
      ...record, reviewedAt, updatedAt: reviewedAt,
      canonicalHref: locale === 'ko' ? `/ko/news/${slug}/` : record.canonicalHref,
      authorName: locale === 'ko' ? 'SignedPrice 데이터팀' : 'SignedPrice Data Desk',
      reviewedBy: locale === 'ko' ? 'SignedPrice 리서치 편집자' : record.reviewedBy,
      revisionNote: locale === 'ko'
        ? '2026년 9월 9일 공식 자료를 확인해 실제 적용 조건, 계산 또는 서류 읽는 방법을 보강했습니다.'
        : locale === 'zh-CN'
          ? '2026年9月9日核对官方资料，补充实际适用条件、计算或文件核验方法。'
          : 'Official sources checked on 9 September 2026; replaced generic status copy with applicable rules, a worked example or document-reading steps.',
    });
  });
}
