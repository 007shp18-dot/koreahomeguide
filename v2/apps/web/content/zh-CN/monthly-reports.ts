import { MONTHLY_REPORTS } from '../en/monthly-reports';
import type { EditorialPortfolioRecord } from '../portfolio-types';

// Keep every source table cell and value; translate only the reader-facing labels.
const labels: Readonly<Record<string, string>> = {
  'Contract month': '合同月份', 'Brokered sales': '中介成交', 'District': '行政区',
  'June': '6月', 'July': '7月', 'August': '8月', 'Monthly change': '环比变化',
  'Median cohort change': '配对组变动中位数', 'Eligible cohorts': '合格配对组',
  'Month': '月份', 'Sales': '成交', 'Postal district': '邮政区', 'Change': '变动',
  'Small sample': '样本不足', 'Ready': '现房(Ready)', 'Off-plan': '期房(Off-Plan)', 'Off-Plan': '期房(Off-Plan)',
  'Total': '合计', 'Source area': '原始地区名称', 'Status': '登记状态', 'Matched cohorts': '配对组', 'Median change': '变动中位数',
  'Jongno': '钟路区', 'Jung': '中区', 'Guro': '九老区', 'Gwanak': '冠岳区', 'Geumcheon': '衿川区',
  'Gangbuk': '江北区', 'Dongjak': '铜雀区', 'Songpa': '松坡区', 'Eunpyeong': '恩平区', 'Seodaemun': '西大门区',
  'Yongsan': '龙山区', 'Nowon': '芦原区', 'Yangcheon': '阳川区', 'Gangseo': '江西区', 'Dobong': '道峰区',
  'Gwangjin': '广津区', 'Seongbuk': '城北区', 'Yeongdeungpo': '永登浦区', 'Jungnang': '中浪区', 'Gangdong': '江东区',
  'Mapo': '麻浦区', 'Dongdaemun': '东大门区', 'Seongdong': '城东区', 'Gangnam': '江南区', 'Seocho': '瑞草区',
};
function tables(slug: string): string[] {
  const original = MONTHLY_REPORTS.find(record => record.slug === slug)!;
  return (original.bodyMarkdown.match(/^\|[^\n]*(?:\n\|[^\n]*)*/gm) ?? []).map(table => table.split('\n').map(row => row.split('|').map(cell => {
    const content = cell.trim();
    if (labels[content]) return cell.replace(content, labels[content]);
    return cell.replace(/\[([^\]]+)\]/g, (match, label: string) => labels[label] ? `[${labels[label]}]` : match);
  }).join('|')).join('\n'));
}
const seoul = tables('seoul-monthly-2026-09');
const singapore = tables('singapore-monthly-2026-09');
const dubai = tables('dubai-monthly-2026-09');
const copy: Readonly<Record<string, readonly [string, string, string, string]>> = {
  'seoul-monthly-2026-09': [
    '首尔2026年9月月报：各区住宅成交走势分化',
    '7月中介促成的公寓成交增长4.4%，但瑞草、江南减少，九老增加。',
    '最近可比较月份中，首尔各区交易活动有何不同？',
    `## 01 · 全市概况
### 6月回落之后小幅反弹

${seoul[0]}

7月比6月增加225宗成交，但仍远低于5月的8,293宗。这支持“单月反弹”的描述，而不足以说明持续复苏。

9月7日提取的数据可能尚未包含近期合同的全部申报，因此比较排除了8月和9月。数量按所提供记录的合同月份统计，并非按官方申报日期统计的成交量序列。

## 02 · 哪些地区发生变化
### 瑞草下降40.3%；九老的成交增量最大

瑞草从176宗降至105宗，是25个行政区中降幅最大的。江南从202宗降至150宗。九老从287宗升至354宗，增加67宗，绝对增量最大。

请同时阅读百分比与数量：钟路增长34.5%，实际代表新增10宗成交。高增长率未必意味着成交量大幅增加。

${seoul[1]}

成交量包含所有面积的公寓，不衡量在售房源的售出比例，也不衡量房屋出售所需时间。

## 03 · 比较相似住宅
### 比行政区整体中位价更细致的观察

本节采用不同的比较窗口：**2026年2–4月与5–7月**。较长窗口可增加观测值。我们将专有使用面积限制为84平方米至不足85平方米，按同一公寓小区和相似面积分组，并要求每组在每个期间至少有3宗成交。

合格配对组的价格变动中位数为：西大门30组上涨5.5%，东大门25组上涨5.4%，松坡18组上涨0.5%。这是选定可比组的变化，不是这些区所有公寓的升值率。

下表仅列出至少有10个合格配对组的行政区。未列出不表示零变动。

${seoul[2]}

每组先比较两个期间的成交价中位数，再取各组百分比变化的中位数。各组采用相同权重，不按成交数量加权。配对时将面积四舍五入至小数点后一位。楼层、朝向和房屋状况未受控制，因此不是同一住宅的重复交易指数。不能把这个三个月窗口比较解读为上文月度成交量期间的价格变化。

## 04 · 本月发现
### 江南与瑞草并未带动全市反弹

江南、瑞草与松坡合计成交从**645宗降至558宗，下降13.5%**。九老、冠岳与衿川合计从**543宗升至667宗，增长22.8%**。

这种差异说明，关注特定行政区的读者不能只看全市数字。它不能证明买家在两组地区间转移，也不能解释成交走势不同的原因。

下一期报告可以检验这一走势是否延续。增长是否集中于特定小区、面积段或价格段，也是值得继续研究的问题。

## 来源与方法

来源：韩国国土交通部公寓买卖申报提取数据，共366,779行，于2026年9月7日00:44–01:30 UTC收集。25个行政区在6月和7月均有观测值。未提供可独立核实提取完整性的单独API分页采集清单。

剔除撤销记录和直接交易，仅保留被归类为中介交易的买卖。公开字段相同仍可能代表不同成交，因此保留原始行。删除完全重复行后的敏感性检查仍保留主要地区间的差异。数量可能随申报和撤销更正而变化，未作季节调整。

SignedPrice的计算不是官方价格指数或成交量指数。
`,
  ],
  'singapore-monthly-2026-09': [
    '新加坡2026年9月月报：各邮政区转售成交分化',
    '7月公寓转售记录小幅下降1.4%。D15增加，D19减少。',
    '最近可比较月份中，新加坡各区交易活动有何不同？',
    `## 01 · 整体概况
### 成交水平与6月接近

${singapore[0]}

7月的630宗与5月627宗、6月639宗相近。所选市场未出现普遍的月度成交激增。9月初的快照可能未覆盖全部迟报记录，因此排除8月。

## 02 · 地区变化
### D15增加19宗，D19减少29宗

D15从36宗升至55宗（+52.8%），D18从62宗升至76宗（+22.6%）。D19从75宗降至46宗（−38.7%），D10从54宗降至38宗（−29.6%）。关注特定邮政区的读者可能看到与全国总量很不同的市场。这不表示同一批买家在地区之间转移。

${singapore[1]}

所选子集中，有三个邮政区在两个比较月份均无观测值，故未列出。没有记录本身不能确认整个市场的成交为零。

## 03 · 谨慎解读价格
### 中位价变化不等于同一住宅的回报率

全部记录的单位价格中位数从每平方英尺S$1,747变为S$1,693.50（−3.1%）。D15则从S$1,854.50升至S$2,179（+17.5%）。两者都比较了不同的已售住宅组合，可能受到项目和户型构成的影响。

我们还在两个三个月窗口内匹配同一项目、产权形式及申报面积。只有19组满足每个期间至少3宗成交的条件，没有任何邮政区达到10个合格组。因此，我们暂不发布地区配对价格排名，避免把稀疏样本包装成市场指数。

## 04 · 本月发现
### 全国总量掩盖了地方差异

有用的发现不是所有公寓都变便宜，或D15住宅升值17.5%，而是整体成交几乎持平时，各区同时出现增长与下降。下个月应观察这些变化是否持续，以及哪些项目解释了这些变化。

## 来源与范围

来源：SignedPrice于2026年9月2日生成的URA成交快照，133,942条标准化原始记录，原始批次1–4。筛选条件为propertyType=condominium、saleType=resale、units=1、areaBasis=strata，且价格和面积为正数。排除原资料单独分类的apartments、执行共管公寓、有地住宅、新盘销售、转让和整批交易。这是严格定义的condominium子集，并非全部私人非有地住宅。8月为暂定数据，排除在月度比较外；7月也可能修订。未提供提取完整性的独立认证。

成交量为原始销售记录数。价格中位数使用原始S$/sq ft（psf），未作质量调整。配对窗口为2026年2–4月与5–7月，使用相同项目ID、产权字符串和精确申报的strata面积，要求每组在每个窗口至少3宗成交。未控制楼层和状况。仅19个合格组，没有任何邮政区达到10组，因此不发布地区配对价格排名。任一月份少于10条记录时，不显示该区成交量百分比变化。保留邮政区代码，不使用不完整的社区名称。HDB不在本报告范围内。
`,
  ],
  'dubai-monthly-2026-09': [
    '迪拜2026年9月月报：Arjan现房与期房走势分化',
    '8月Arjan现房公寓销售记录增加20.8%，期房记录下降43.5%。',
    '最近可比较月份中，迪拜各区交易活动有何不同？',
    `## 01 · 整体概况
### 8月两个类别的记录均减少

${dubai[0]}

现房（Ready）记录从2,417条降至2,079条（−14.0%）；期房（Off-Plan）从8,629条降至7,142条（−17.2%）。这个子集中，期房占8月记录的77.5%。该比例衡量的是所选记录中的交易活动，不代表买家偏好或已竣工住宅供应。

## 02 · 地区变化
### 现房与期房需要分开阅读

Arjan现房从72条增至87条，期房从184条降至104条。Jumeirah Village Circle现房从436条降至306条（−29.8%），Dubai Hills现房保持69条。这些例子不意味着某个地区的投资价值变得更好。

表格仅包含两个比较月份均至少有30条记录的地区与状态组合。保留原始地区名称。

${dubai[1]}

## 03 · 比较相似物业
### 按项目配对，解读范围更窄

配对价格采用3–5月与6–8月，而非月度成交量窗口。匹配原始数据中的同一地区、项目、卧室数、精确面积及登记状态；要求每组每个期间至少3条记录，地区汇总至少10组。

${dubai[2]}

所有达到公布门槛的地区组均为期房。现房资料覆盖较弱，包括项目名称缺失。这些数字是合格项目配对组内百分比变化的等权中位数，不是整个地区的价格指数。一个项目可能包含多栋楼，楼层、景观、优惠及付款安排未进行匹配。

## 04 · 本月发现
### 合并两个类别会掩盖Arjan现房增长

Arjan合计记录从256条降至191条（−25.4%）。只看这个数字会漏掉现房从72条增至87条。因此，关注已竣工公寓的买家与关注期房项目的买家应阅读各自的序列。

这是记录上的分化，并不证明买家切换了类别。新项目推出、季节性活动及登记时间可能有影响，但这份提取数据本身无法识别原因。

## 来源与范围

来源：迪拜土地局成交提取数据，151,921行，日期为2026年1月1日–9月6日。筛选条件为GROUP_EN=Sales、USAGE_EN=Residential、PROP_TYPE_EN=Unit、PROP_SB_TYPE_EN=Flat，且TRANS_VALUE和ACTUAL_AREA为正数。只包含普通Sale / Ready和Sell - Pre registration / Off-Plan（整体85,110行）。排除Delayed Sell、开发登记、付款计划特定程序、赠与、抵押、土地和别墅。因此，这是已定义的公寓销售子集，不是迪拜全部房地产活动。

数量为物业层面的源记录，不保证对应不同的法律合同。筛选数据中有14个交易编号重复，但没有整行完全相同的重复；一笔交易可能涉及多处物业，因此保留所提供记录。日期为INSTANCE_DATE。9月不完整，故排除。8月是此提取数据中最近完整的日历月，未获独立最终数据认证。未控制项目推出、季节性及登记时间。

单位价格为TRANS_VALUE / ACTUAL_AREA，单位AED/m²。按原始AREA_EN、PROJECT_EN、卧室数、精确申报面积及Ready/Off-Plan状态匹配2026年3–5月与6–8月；每个窗口要求>=3条记录，计算配对组百分比变化的等权中位数。地区汇总仅在合格组>=10时公布。所有达到门槛的地区汇总均为期房。项目名称不是经核实的楼栋ID；楼层、景观、优惠及付款条件未受控制。约25.4%的现房记录缺少项目名称，限制匹配覆盖。保留原始地区标签，不合并可能重叠的别名。月度地区成交量比较要求两个月均>=30条记录。
`,
  ],
};
const sourceTitles: Readonly<Record<string, string>> = {
  'kr-seoul': '首尔公寓买卖申报合同',
  'sg-singapore': '私人住宅成交',
  'ae-dubai': '房地产交易开放数据',
};
export const CHINESE_MONTHLY_REPORTS: readonly EditorialPortfolioRecord[] = Object.freeze(MONTHLY_REPORTS.map(record => {
  const [title, deck, readerQuestion, bodyMarkdown] = copy[record.slug]!;
  return Object.freeze({ ...record, id: `zh-CN:${record.slug}`, locale: 'zh-CN' as const,
    title, deck, readerQuestion, bodyMarkdown, reviewedBy: 'SignedPrice数据验证',
    sources: record.sources.map(source => ({ ...source, title: sourceTitles[record.marketId!]!,
      publisher: record.marketId === 'kr-seoul' ? '韩国国土交通部(MOLIT)' : record.marketId === 'ae-dubai' ? '迪拜土地局' : '新加坡市区重建局(URA)',
    })),
    revisionNote: '首次月报发布：核对地区汇总，并注明数据范围与暂定申报状态。',
    canonicalHref: `/zh-cn/news/${record.slug}/`, translationGroupId: record.translationGroupId ?? record.slug,
  });
}));
