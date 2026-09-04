import { infographic, portfolioRecord, RELEASES, SOURCES } from '../portfolio-builders';

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
  portfolioRecord({
    slug: 'kr-rental-deposit-protection-zh', locale: 'zh-CN', type: 'policy-update', marketId: 'kr-seoul',
    title: '韩国租房押金保护：当前核验步骤', deck: '把入住占有、居住申报、确定日期和保证产品分开核验，避免把其中一步误当成全部保障。',
    question: '当前韩国租房押金保护规则如何适用？',
    points: [['先核验房屋', '付款前应核对准确地址、登记用途、所有权人、最新权利记录以及收款账户。'], ['再核验顺序', '入住占有、适用的居住申报、确定日期与保证申请各有不同作用，应按租客身份和房屋情况确认顺序。'], ['保存当前依据', '记录查询日期、官方答复、合同与付款凭证；后续规则或登记状态变化时重新核验。']],
    boundary: '本文只提供核验路径，不判断具体押金的法律优先顺位、保证资格或安全性。', sources: [SOURCES.koreaLeaseLaw], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/check/', translationGroupId: 'kr-rental-deposit-protection',
  }),
  portfolioRecord({
    slug: 'sg-absd-policy-zh', locale: 'zh-CN', type: 'policy-update', marketId: 'sg-singapore',
    title: '新加坡 ABSD：先确认买方身份与持有套数', deck: '额外买方印花税取决于买方身份、住宅持有情况、取得方式和日期，最终应以 IRAS 当前规则为准。',
    question: '新加坡额外买方印花税目前如何适用？',
    points: [['确认买方类别', '公民、永久居民、外国人或实体，以及现有住宅数量，可能改变适用的 ABSD 处理。'], ['确认取得事项', '产权份额、取得日期、取得方式及可能的减免条件也需要逐项核对。'], ['使用当前税率表', '计算前打开 IRAS 官方页面并保存所用版本与日期，不沿用旧文章中的税率。']],
    boundary: 'SignedPrice 不计算最终税额，也不判断个案是否符合减免条件。', sources: [SOURCES.singaporeAbsd], evidenceReleaseIds: [RELEASES.policySingapore], relatedHref: '/sg/singapore/check/', translationGroupId: 'sg-absd',
  }),
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
    slug: 'rent-in-korea-zh', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '外国人在韩国租房：从找房到入住', deck: '按预算、成交证据、房屋身份、合同与押金保护的顺序完成核验。', question: '外国人在韩国租房应按什么步骤核验并签约？', points: [['计算完整预算', '同时记录押金、月租、管理费、水电、仲介、搬家和应急资金。'], ['付款前核验', '匹配准确地址、登记用途、所有权人、最新权利、签约人和收款账户。'], ['安排入住步骤', '签约前确认适用于本人身份的居住申报、确定日期和保证手续，并保存所有凭证。']], boundary: '具体程序取决于身份、房屋和当前规则，重大决定应向主管机关或专业人士确认。', sources: [SOURCES.koreaLeaseLaw, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.rent], relatedHref: '/kr/seoul/check/', translationGroupId: 'rent-korea' }),
  portfolioRecord({
    slug: 'wolse-vs-jeonse-zh', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '月租与全租：使用同一成本口径比较', deck: '把押金资金成本、月租、管理费与押金返还风险同时摆在桌面上。', question: '如何在同一成本口径下比较月租与全租？', points: [['分清结构', '月租通常由较小押金和每月租金组成；全租通常锁定更大押金，月租较少或没有。'], ['公开换算假设', '使用同一换算率，加入管理费与融资成本，并测试假设变化后的结果。'], ['价格以外的核验', '成本比较不能替代房屋、所有权、权利、付款账户与押金保护核验。']], boundary: '换算只用于比较，不是法定市场利率，也不保证押金返还。', sources: [SOURCES.koreaLeaseLaw, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent, RELEASES.conversion], relatedHref: '/kr/seoul/check/', translationGroupId: 'wolse-jeonse' }),
  portfolioRecord({
    slug: 'buy-property-in-korea-zh', locale: 'zh-CN', type: 'guide', marketId: 'kr-seoul', title: '外国人在韩国买房：依次完成的核验', deck: '在承诺付款前协调房屋身份、成交证据、资金、限制、申报、合同和登记。', question: '外国人在韩国买房应依次核验哪些事项？', points: [['核验标的', '匹配具体房屋、所有权人、登记记录、建筑记录以及合同日适用的区域限制。'], ['核验资金与申报', '确认贷款、现金路径、税费与外国买方申报字段，并保存采用的官方版本。'], ['完成交割', '写明条件与期限，尾款前更新记录，并以可追踪方式完成付款、申报与登记。']], boundary: '本文是决策顺序，不构成法律、税务、贷款或投资建议。', sources: [SOURCES.koreaForeignReporting, SOURCES.seoulPermit], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.sale], relatedHref: '/kr/seoul/explore/?transaction=sale', translationGroupId: 'buy-korea' }),
] as const);
