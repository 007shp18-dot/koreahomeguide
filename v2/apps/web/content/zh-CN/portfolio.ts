import { policyExplainers } from '../policy-explainers';
import { infographic, portfolioRecord, RELEASES, SOURCES } from '../portfolio-builders';


const leaseChecks = { id: 'kr-lease-checks', kind: 'primary' as const, publisher: 'Korea Ministry of Government Legislation', title: '租赁合同前的登记与身份核验', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=1&cnpClsNo=1&csmSeq=629', checkedAt: '2026-09-14', publishedAt: null };
const leaseProtection = { ...leaseChecks, id: 'kr-lease-protection', title: '押金保护的成立条件', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629' };
const foreignTenant = { ...leaseChecks, id: 'kr-foreign-tenant', title: '住宅租赁保护的适用对象', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=629' };
const leaseForms = { ...leaseChecks, id: 'kr-lease-forms', title: '全租、月租与登记权利的区别', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=629&ccfNo=1&cciNo=1&cnpClsNo=1' };
const purchaseRegistry = { ...leaseChecks, id: 'kr-purchase-registry', title: '买房前阅读登记事项', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=1&cnpClsNo=2&csmSeq=649' };
const purchaseReporting = { ...leaseChecks, id: 'kr-purchase-reporting', title: '不动产成交申报', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=4&cciNo=2&cnpClsNo=1&csmSeq=649' };
const purchaseTax = { ...leaseChecks, id: 'kr-purchase-tax', title: '取得税及附加税', href: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=4&cciNo=3&cnpClsNo=2&csmSeq=649' };

const seoulDistrictChartZh = infographic({
  id: 'seoul-district-price-distribution-chart-zh', locale: 'zh-CN', template: 'district-comparison',
  title: '首尔部分行政区租赁押金中位数',
  summary: '五个行政区中达到公开样本门槛的楼盘中位数存在差异；这些数值用于筛选，不是单套住宅估值。',
  releases: [RELEASES.publicBuildingSummary], period: { start: '2026-01-01', end: '2026-07-31' }, unit: '亿韩元', source: '韩国国土交通部申报租赁合同，经 SignedPrice 公开楼盘摘要处理',
  sample: '五个行政区中达到最低样本量的已公开楼盘组', relatedHref: '/kr/seoul/explore/',
  series: [{ id: 'median', label: '已公开楼盘中位数的中位数', values: [
    { label: '江南区', value: 5.375 }, { label: '龙山区', value: 5.475 }, { label: '江东区', value: 4.8 },
    { label: '麻浦区', value: 4.5 }, { label: '芦原区', value: 2.6 },
  ] }],
});

const singaporeRegionChartZh = infographic({
  id: 'singapore-region-comparison-chart-zh', locale: 'zh-CN', template: 'district-comparison',
  title: '新加坡私人住宅项目尺价中位数',
  summary: '本次版本中，核心中央区已公开项目尺价中位数最高，但各区项目组合、产权与销售类型并不相同。',
  releases: [RELEASES.singapore], period: { start: '2021-08-01', end: '2026-08-31' }, unit: '新元/平方英尺', source: 'URA 私人住宅成交，经 SignedPrice 公开版本处理',
  sample: 'CCR 614、RCR 745、OCR 1,053 个已公开项目摘要', relatedHref: '/sg/singapore/explore/',
  series: [{ id: 'project-median-psf', label: '已公开项目尺价中位数的中位数', values: [
    { label: 'CCR', value: 2167 }, { label: 'RCR', value: 1716 }, { label: 'OCR', value: 1462 },
  ] }],
});

export const CHINESE_PORTFOLIO = Object.freeze([
  ...policyExplainers('zh-CN'),
  portfolioRecord({
    slug: 'seoul-rent-market-brief-zh', locale: 'zh-CN', type: 'market-brief', marketId: 'kr-seoul',
    title: '首尔全租与月租：2026年8月数据简报', deck: '当前租赁版本包含 49,129 条合格申报合同；比较前必须分开全租、押金和月租结构。',
    question: '首尔全租与月租市场的最新公开数据发生了什么变化？',
    points: [['先看版本', '已安装版本覆盖 2026 年 2 月至 8 月，并保留数据期间、记录数、解析器与展示权利信息。'], ['保持同一口径', '比较行政区或楼盘时，应固定租赁结构、房屋类型、面积、期间和最低样本量。'], ['回到合同', '换算后的月度负担只用于筛选，最后仍要查看实际押金、月租、申报月份和具体房屋。']],
    boundary: '申报合同不代表当前可租房源，也不能证明具体押金安全。', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent, RELEASES.conversion], relatedHref: '/kr/seoul/explore/',
  }),
  portfolioRecord({
    slug: 'seoul-district-price-distribution-zh', locale: 'zh-CN', type: 'data-story', marketId: 'kr-seoul',
    title: '中位数相近，分布仍可能完全不同', deck: '行政区中位数只用于进入下一层；价格范围、房屋组合和楼盘样本才解释真实差异。',
    question: '首尔各区中位价相近时，价格分布为何仍会不同？',
    points: [['中位数没有形状', '中间值不能显示合同是紧密集中，还是横跨不同面积、房型与楼龄。'], ['组合会改变结论', '即使中位数相同，楼盘构成、面积带和样本深度不同，也会形成不同的选择环境。'], ['进入楼盘层', '先用行政区图表筛选，再打开已公开楼盘与原始成交记录进行同口径比较。']],
    boundary: '图表是部分已公开楼盘组中位数的汇总，不是行政区或单套住宅估值。', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.publicBuildingSummary], relatedHref: '/kr/seoul/explore/', infographic: seoulDistrictChartZh, translationGroupId: 'seoul-district-distribution',
  }),
  portfolioRecord({
    slug: 'singapore-region-comparison-zh', locale: 'zh-CN', type: 'data-story', marketId: 'sg-singapore',
    title: 'CCR、RCR 与 OCR：区域标签之后还要看项目', deck: '已公开项目尺价中位数在区域间不同，但产权、销售类型、面积和项目组合仍是必要背景。',
    question: 'CCR、RCR与OCR的成交分布有何差异？',
    points: [['区域用于导航', 'CCR、RCR 与 OCR 帮助组织地理位置，但不代表同一区域内所有项目都可直接比较。'], ['明确样本', '图表使用 614 个 CCR、745 个 RCR 和 1,053 个 OCR 已公开项目摘要中的尺价中位数。'], ['打开具体项目', '核对项目身份、产权、销售类型、面积与成交日期后，再使用区域背景。']],
    boundary: '项目中位数的汇总不同于 URA 官方价格指数，也不是估值或投资建议。', sources: [SOURCES.singaporeUra], evidenceReleaseIds: [RELEASES.singapore], relatedHref: '/sg/singapore/explore/', infographic: singaporeRegionChartZh, translationGroupId: 'singapore-region-distribution',
  }),
  portfolioRecord({
    slug: 'rent-in-korea-zh', updatedAt: '2026-09-14T00:00:00.000Z', revisionNote: '补充计算示例、文件核验和办理顺序；新增官方生活法令来源。', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '外国人在韩国租房：从找房到入住', deck: '按预算、成交证据、房屋身份、合同与押金保护的顺序完成核验。', question: '外国人在韩国租房应按什么步骤核验并签约？', points: [["先做两张预算表，再筛选房屋", "第一张表只写入住前要准备的现金：押金、首月租金、中介费、搬家费和留在账户里的应急资金。第二张表写每月支出：租金、管理费、水电燃气、网络及借款利息。押金不是每月消费，却会在租期内占用现金；不能把它从预算中删掉。\n\n例如，假设一套房的月租为70万韩元、管理费8万、水电网络预计12万，每月基本支出就是90万韩元，尚未计入贷款利息。这只是演算示例，不是首尔市场报价。看房时把管理费包含项目逐项问清，避免把不含供暖的房源与全包房源直接比较。\n\n在 Explore 中先固定月租或全租，再选择相近面积和合同月份。查看押金与月租这一整组条件，而不是只挑最低的一个数字。历史申报记录用于检查报价背景，不代表该套房仍在出租。"], ["付款前，把地址、签约人和权利记录对上", "请中介提供完整韩文地址、楼栋与室号，用它核对登记事项证明书和建筑物台账。广告中的楼盘名称不足以确认具体标的。登记资料里的所有权人应与签约人的身份相符；如由代理人办理，要核实委托权限，不能仅凭聊天记录认定其有权收款。生活法令信息网的合同前核验说明列出了登记及代理文件的检查事项。\n\n把以下问题写进看房记录：是否有抵押或查封等权利负担？谁负责未修好的漏水、供暖和设备？管理费如何结算？何时交钥匙？房东要求转入他人账户时，先查清授权及原因。无法解释的地址、签约人或收款人差异应在付款前解决。\n\n保存核验日期、文件副本、合同全部附件和每笔转账凭证。旧登记截图只能说明旧时点状态；签约与尾款之间如有间隔，应再次核对。"], ["把入住手续排进日历", "不要把拿到钥匙当成全部手续完成。提前向住所管辖机关确认本人身份适用的居住地申报方式，以及合同确定日期（확정일자）的办理材料。官方说明指出，外籍租客在符合条件并完成相当于迁入申报的居住地变更申报后，可以受到住宅租赁保护；具体身份和办理方式仍须核实。\n\n优先受偿保护涉及交付、申报和确定日期等条件。单独持有一份盖章合同，不能据此断言押金一定安全；保证产品也须另行核验资格与承保范围。\n\n入住当天逐项拍照记录门锁、表读数、墙面及设备状况，并与出租方确认遗留维修。把租金支付日、合同终止通知安排和押金返还交接事项记入日历。资料齐全的目标，是出现争议时能说明双方约定了什么、何时履行，而不是用一张检查表替代法律判断。"]], boundary: '具体程序取决于身份、房屋和当前规则，重大决定应向主管机关或专业人士确认。', sources: [leaseChecks, leaseProtection, foreignTenant, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.rent], relatedHref: '/kr/seoul/check/', translationGroupId: 'rent-korea' }),
  portfolioRecord({
    slug: 'wolse-vs-jeonse-zh', updatedAt: '2026-09-14T00:00:00.000Z', revisionNote: '补充计算示例、文件核验和办理顺序；新增官方生活法令来源。', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '月租与全租：使用同一成本口径比较', deck: '把押金资金成本、月租、管理费与押金返还风险同时摆在桌面上。', question: '如何在同一成本口径下比较月租与全租？', points: [["先分清月租、全租和现金压力", "月租（월세）通常是押金加每月租金；全租（전세）通常以较大的押金换取不付月租的居住安排。全租并不等于没有住房成本：自己的资金有机会成本，借来的资金有利息，而且都需要考虑押金返还。日常所说的全租合同，也不能自动等同于已办理登记的 전세권。\n\n比较前，把两套房的面积、房型、交通条件和租期尽量对齐。如果一套是小面积老房、另一套是新建大户型，换算结果同时包含了房屋差异，不能只归因于租赁结构。\n\n建议同时列出“入住所需现金”和“可比较的每月成本”。前者回答能否承担押金，后者回答持续负担多少；一个数字无法替代另一个。"], ["用一组明确假设做计算，再改变利率", "用于初筛的简化公式是：每月可比成本＝月租＋押金×年资金成本率÷12＋管理费。若押金全部借入，可使用实际贷款成本；若全部自有，可选择自己的机会成本假设。混合资金应分开计算，不能对同一笔钱重复计入贷款利息和机会成本。\n\n演算示例：A房押金2,000万韩元、月租80万；B房全租押金2亿、月租0。假设年资金成本率4%，且两者管理费都是10万，则A约为96.7万韩元/月，B约为76.7万韩元/月。B在这个假设下每月低20万，却需要多占用1.8亿韩元押金。\n\n将假设改为6%，A为100万韩元/月，B为110万韩元/月，排序会反过来。忽略两房其他费用差异时，平衡点约为5.33%：80万×12÷1.8亿。这个利率只是本例的数学结果，不是法定转换率、市场利率或银行报价。\n\n短期居住还应把一次性搬家和中介费用按预计居住月数摊开；对实际贷款，应另列每月还款现金流及到期安排。"], ["成本较低，不代表押金风险较低", "将成本比较和押金核验作为两个独立步骤。检查房屋及签约人身份、现有权利负担和保护手续；比较两个房源时，保留各自资料的查询日期。不能因为某栋楼有很多历史交易，便推定出租人的还款能力或自己的押金受偿顺序。\n\n还要做退出情景：如果押金不能按预期日期返还，是否仍有下一套房押金与搬家资金？如果借款利率上调，能否承受每月支出？这些问题不会被一条“更便宜”的标签回答。\n\n在 SignedPrice 查看月租记录时，同时保留押金、月租、面积和合同月份。全租押金与月租金额不能混为同一价格序列；少量不同户型的成交也不能连成某一套房的升跌趋势。"]], boundary: '换算只用于比较，不是法定市场利率，也不保证押金返还。', sources: [leaseForms, leaseChecks, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent, RELEASES.conversion], relatedHref: '/kr/seoul/check/', translationGroupId: 'wolse-jeonse' }),
  portfolioRecord({
    slug: 'buy-property-in-korea-zh', updatedAt: '2026-09-14T00:00:00.000Z', revisionNote: '补充计算示例、文件核验和办理顺序；新增官方生活法令来源。', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '外国人在韩国买房：依次完成的核验', deck: '在承诺付款前协调房屋身份、成交证据、资金、限制、申报、合同和登记。', question: '外国人在韩国买房应依次核验哪些事项？', points: [["先核对具体房屋，再判断能否签约", "准备一张标的卡：韩文地址、楼栋室号、专有面积、登记用途、当前所有权人及拟定用途。广告照片和楼盘名称只是入口，不能代替具体单元身份。\n\n登记事项证明书中的表题部记录标的，甲区记录所有权事项，乙区记录抵押等其他权利。把它与建筑物台账、现场房屋及合同地址逐一对照。存在抵押时，问清偿还和注销如何与尾款交接衔接；记录里看不懂的限制，应在承诺付款前查明。\n\n按合同拟签日期和具体地块查询土地交易许可指定情况。首尔市公开的是指定公告，不能仅凭“这个区以前可以购买”来判断今天的某套房。将国籍、居留身份、取得目的与具体标的一起向管辖机关确认，涉及许可时先厘清条件和顺序。"], ["拆开买价、现金安排和税费", "用相近面积、房型与合同月份的实际成交建立比较表，注明样本数和差异。行政区中位数只适合初筛，不能直接当作这套房的合理价；当前在售报价也不等于已经成交的金额。\n\n现金预算至少分为定金、中间款、尾款、税费、登记及中介费用、维修与预留资金。分别记录付款日期和资金何时可用。贷款“可以咨询”与正式批准不同，海外资金还应先向办理银行确认汇入路径、证明文件和换汇安排。\n\n例如，假设议定买价8亿韩元，已付定金8,000万，且贷款正式批准3亿，那么仅购房尾款还需自备4.2亿；税费和其他支出另加。这只是现金演算，不代表可获贷款额度，也不是通用定金比例。\n\n取得税及可能涉及的附加税须按本人和房屋条件核算。不要把一个统一百分比复制到所有买方，也不要把预计退税或未批准融资计作已经到手的资金。"], ["把申报和登记安排到具体负责人", "在签约前列明每一步由谁办理、交什么文件、最晚何时完成，以及未满足前提时如何处理。许可、贷款、解除现有权利和房屋交付都应有可执行的安排。若有现有租客，另核实租约、押金承担与交付条件，不能只看卖方承诺的入住日期。\n\n官方生活法令说明，一般不动产买卖成交应在合同订立后30日内申报；应确认本次交易的具体申报主体、资料和办理渠道。外国买方的适用字段或手续须按当时规则单独确认。成交申报与所有权转移登记是不同环节，拿到申报凭证不等于已经取得登记。\n\n尾款前更新权利记录，核对收款人与付款安排，并由负责登记的专业人员确认提交资料。交割后保留付款凭证、申报回执、税费收据、登记结果及钥匙交接记录。最终检查应回到准确室号和买方身份，而不是只确认“这个楼盘已经办完”。"]], boundary: '本文是决策顺序，不构成法律、税务、贷款或投资建议。', sources: [purchaseRegistry, purchaseReporting, purchaseTax, SOURCES.seoulPermit], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.sale], relatedHref: '/kr/seoul/explore/?transaction=sale', translationGroupId: 'buy-korea' }),
] as const);
