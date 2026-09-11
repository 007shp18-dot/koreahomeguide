import type { EditorialPortfolioRecord } from '../portfolio-types';
import { DUBAI_RENTAL_YIELD } from '../en/dubai-rental-yield';

// Translation of the existing English analysis; source review dates are inherited,
// not represented as a fresh verification of the underlying market observations.
export const CHINESE_DUBAI_RENTAL_YIELD: EditorialPortfolioRecord = Object.freeze({
  ...DUBAI_RENTAL_YIELD,
  id: 'zh-CN:dubai-rental-yield-after-costs',
  locale: 'zh-CN',
  title: '迪拜7%的租金收益率，先看这笔租金能否收到',
  deck: '2026年第二季度迪拜公寓租金下降。接受宣传收益率之前，应确认租金对应的合同，并追踪扣除经常性账单后的一年现金流。',
  readerQuestion: '这套迪拜公寓现在还能收到宣传收益率所用的租金吗？扣除有据可查的成本后还剩多少？',
  bodyMarkdown: `## 租金需要重新核实

一套AED 1,000,000的公寓要实现7%收益率，首先需要每年AED 70,000租金。眼前的问题是业主现在能否收到这笔钱。[CBRE报告](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q2-2026)指出，2026年第二季度迪拜公寓租金环比下降6.5%，同比下降2.4%。这些整体市场变化不能预测某一份租约，却意味着不能放心沿用旧的挂牌租金假设。

卖方给出的数字可能对应现有租约、刚签订的续约，或对下一位租客的预期。三者需要不同的证据。可信的收益率应基于相关租约证据和楼宇经常性账单重新计算。

## 确认宣传册中的租金依据

[DLD记录](https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/)显示，2026年第一季度迪拜全市新增租赁合同118,385份、续约135,607份。这些行政统计没有仅住宅的细分，也不能说明某位租客续约的可能性。但它们说明了为何必须标明“租金”的具体类别。

| 所列租金 | 应取得的证据 | 可以支持的判断 |
| --- | --- | --- |
| 现有租约 | 租赁/Ejari记录、合同日期、付款计划及收款凭证 | 当前合同租金和截至目前实际收到的现金 |
| 续约 | 已签订的续约条件及后续付款证据 | 所述期间内的续约金额 |
| 空置单元或未来租客 | 同类住宅近期已签租约和注明日期的招租方案 | 有依据的要价区间，而非保证收款 |

Ejari登记记录租赁关系，不证明每笔付款都已到账，也不保证下一份合同会重复相同金额。将合同与银行或付款凭证核对，并把收款时间纳入现金计划。

## 追踪一年的资金流向

假设一套已竣工公寓售价AED 1,000,000，年租金AED 70,000；一年空置一个月，年度物业服务费AED 12,000，租赁管理费为实收租金的5%，维修及其他业主运营成本AED 3,000。

| 一年现金流 | AED |
| --- | ---: |
| 潜在租金 | 70,000 |
| 空置一个月 | −5,833 |
| 实收租金 | 64,167 |
| 物业服务费 | −12,000 |
| 租赁管理费 | −3,208 |
| 维修及其他业主成本 | −3,000 |
| 扣除模型运营成本后的收入 | **45,958** |

本例假设买家经协商承担合计4%的登记费，即AED 40,000，另以AED 25,000示例预算涵盖其他购置成本。[DLD现房买卖登记服务](https://dubailand.gov.ae/en/eservices/property-sale-registration/)列出卖方2%、买方2%，另有服务合作方费用、增值税及文件费用。本例的分摊方式和AED 25,000预算是假设，并非通用买方费用套餐。模型中的购置现金总额为AED 1,065,000。

AED 45,958运营收入相当于房价的4.60%，或购置现金总额的4.32%。购置成本只在分母中计入一次。比较住宅前，应以逐项交割结算表替换示例预算。

## 经常性账单可能改变排名

空置期间仍可能需要缴纳物业服务费。取得正确项目、用途和年度的RERA核准预算，再与单元账单、计费基础及当前欠费余额核对。[DLD实际查询表单](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index)说明不包含欠费，因此公布费率不是无欠费证明。[DLD常见问题](https://dubailand.gov.ae/en/frequently-asked-questions/)将保险、储备金和公共区域成本列为服务费组成部分。增加单独业主预算前，先确认单元账单已经包含哪些费用。

保持购置现金AED 1,065,000、潜在年租金AED 70,000、实收租金5%的管理费以及AED 3,000其他业主成本不变，只调整空置期和物业服务费：

| 空置月数 | AED 8,000服务费 | AED 12,000服务费 | AED 18,000服务费 |
| --- | ---: | ---: | ---: |
| 0 | 5.21% | 4.84% | 4.27% |
| 1 | 4.69% | 4.32% | 3.75% |
| 2 | 4.17% | 3.79% | 3.23% |

每个单元格为扣除所述运营成本后的年度收入除以购置现金总额。这些是敏感性分析输入，不是迪拜平均值。在空置一个月的情况下，物业服务费增加AED 6,000，会使模型收益率从4.32%降至3.75%，约下降0.56个百分点。

## 融资改变现金结果

正的运营收益率不保证租金能够覆盖还贷。假设本例贷款AED 700,000，25年内按月摊还，固定名义年利率5%，月供约AED 4,092，还贷后的年度现金约为−AED 3,147。利率为7%时，月供约AED 4,947，年度现金约为−AED 13,411。

在空置一个月和所述运营成本下，要覆盖模型还款额，5%利率对应的年度合同租金需约AED 73,614，7%则需约AED 85,400。这些利率是情景假设，不是贷款机构报价；盈亏平衡租金是计算结果，不是租客需求的证据。贷款手续费、抵押登记、保险和投资者特定税务未计入。应采用实际贷款条款及注明日期的收付款计划。

## 让购置决定建立在证据上

依赖收益率之前，取得四组证据：附收款凭证的租约/Ejari记录；核准物业服务费预算及当前单元账单；逐项列明的管理或招租方案；逐项过户及融资结算表。用这些记录支持的租金、单元实际应付账单和交割所需全部现金重新计算。

只有当有证据支持的结果达到你要求的回报，并为空置、维修和收付款时间差留足现金时，才继续推进。如某项成本或拟议租金尚未确认，应单独运行不利情景，不要将其填为零。期房需要单独的交付和出租时间表，因为本现房示例假设购入后即可开始出租。可通过[迪拜Explore](/ae/dubai/explore/)查看已发布地区数据，通过[迪拜Check](/ae/dubai/check/)了解要价背景；两者都不能确认具体单元的租金或账单。

## 方法与证据边界

CBRE和DLD观察值是注明日期的市场背景；AED 1,000,000住宅是虚构计算案例。运营结果不含融资，而贷款段落只计入所述还款。投资者特定税务、汇率、资本价值变化及退出成本不属于本年度现金流模型。应向负责的服务机构或合格专业人士确认单元文件、交易费用和税务处理。`,
  reviewedBy: 'SignedPrice借助AI进行来源与计算核对',
  sources: DUBAI_RENTAL_YIELD.sources.map(source => ({ ...source,
    publisher: source.publisher === 'Dubai Land Department' ? '迪拜土地局' : source.publisher,
    title: ({
      'cbre-uae-q2-2026': '2026年第二季度阿联酋房地产市场回顾',
      'dld-rental-q1-2026': '迪拜2026年第一季度租赁合同活动',
      'dld-sale-registration': '房产买卖登记：费用与服务条件',
      'dld-service-charge-index': '服务费指数：共同产权物业核准费用',
      'dld-service-charge-form': '服务费指数表单：期间、产权证及欠费范围',
      'dld-service-charge-faq': '常见问题：服务费组成',
      'dld-ejari': '登记或续签租赁合同',
    } as Record<string, string>)[source.id] ?? source.title,
  })),
  revisionNote: '围绕可实际收取的租金重组分析，使用CBRE 2026年第二季度和DLD合同背景，整合运营与敏感性计算、文件检查及融资盈亏平衡结果。',
  canonicalHref: '/zh-cn/news/dubai-rental-yield-after-costs/',
  translationGroupId: DUBAI_RENTAL_YIELD.slug,
});
