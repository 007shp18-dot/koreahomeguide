import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import { marketHref } from '../../lib/locale/market-localization';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import type { ToolId, ToolMarket } from '../../lib/analytics/tool-events';
import { ResearchPageHeading } from '../market-ui/research-page-heading';
import { ToolEventOnMount, TrackedToolLink } from './tool-analytics';
import { ToolsShell } from './tools-shell';
import styles from './tools.module.css';
import { ToolResearchManagement } from './tool-research-share';

type ToolGroup = 'check' | 'compare' | 'returns';

type ToolDirectoryItem = Readonly<{
  group: ToolGroup;
  title: string;
  description: string;
  market: ToolMarket;
  tool: ToolId;
  href: string;
}>;

export function ToolsHub({ locale = 'en' }: Readonly<{ locale?: SiteLocale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : '';
  const items: readonly ToolDirectoryItem[] = [
    { group: 'compare', title: ko ? '같은 예산으로 네 도시 비교' : zh ? '比较四座城市的预算购买力' : 'Compare one budget across four cities', description: ko ? 'USD·KRW·SGD·AED·JPY 예산으로 서울·싱가포르·두바이·도쿄를 비교합니다.' : zh ? '选择美元、韩元、新加坡元、迪拉姆或日元预算，比较四座城市。' : 'See what a USD, KRW, SGD, AED or JPY budget could buy in Seoul, Singapore, Dubai and Tokyo, based on recorded prices.', market: 'global', tool: 'passport', href: ko ? '/ko/passport/' : zh ? '/zh-cn/passport/' : '/passport/' },
    { group: 'check', title: ko ? '서울 매물 가격 비교' : zh ? '核对首尔报价' : 'Check a Seoul asking price', description: ko ? '주택 유형과 면적이 비슷한 실거래가와 비교하세요.' : zh ? '与相同住宅类型及面积的已申报成交比较。' : 'Compare compatible reported contracts by housing type and area.', market: 'kr-seoul', tool: 'single-quote', href: `${prefix}/kr/seoul/check/` },
    { group: 'compare', title: ko ? '두 임대 조건 비교' : zh ? '比较两组租赁条件' : 'Compare two Seoul rent offers', description: ko ? '보증금과 월세를 같은 기준으로 비교합니다.' : zh ? '在同一计算基础上比较押金和月租。' : 'Compare deposits and monthly rents on one disclosed basis.', market: 'kr-seoul', tool: 'offer-compare', href: `${prefix}/kr/seoul/check/compare/` },
    { group: 'check', title: ko ? '서울 임대료 확인' : zh ? '核对首尔租金' : 'Check a Seoul rent quote', description: ko ? '보증금과 월세를 신고된 임대차 계약과 비교하세요.' : zh ? '使用公开租赁资料核对输入的条件。' : 'Compare your rent and deposit with reported rental contracts.', market: 'kr-seoul', tool: 'rent-check', href: ko ? '/ko/kr/seoul/check/?transaction=monthly' : '/kr/seoul/tools/rent-check/' },
    { group: 'returns', title: ko ? '매입 비용·임대수익 계산' : zh ? '计算购置成本与运营收益率' : 'Calculate purchase costs and operating yield', description: ko ? '매입 비용, 예상 임대료와 공실 기간을 입력해 계산하세요.' : zh ? '自行输入 KRW、SGD、AED 或 JPY 成本、租金及空置假设。' : 'Enter your own costs, rent and vacancy in KRW, SGD, AED or JPY.', market: 'global', tool: 'property-scenario', href: `${zh ? '/zh-cn' : prefix}/tools/property-scenario/` },
    { group: 'check', title: ko ? '싱가포르 매물 가격 비교' : zh ? '核对新加坡报价' : 'Check a Singapore project offer', description: ko ? '민간 주택과 HDB, 매매와 임대를 나눠 비교하세요.' : zh ? '分别使用私人住宅、HDB 转售或租赁资料。' : 'Use the matching private-home, HDB resale or rental evidence.', market: 'sg-singapore', tool: 'singapore-check', href: '/sg/singapore/check/' },
    { group: 'check', title: ko ? '두바이 매물 가격 비교' : zh ? '核对迪拜报价' : 'Check a Dubai asking price', description: ko ? '완공·분양 주택을 구분해 가격을 비교하고, 예상 임대수익률을 계산하세요.' : zh ? '比较现房与期房的区域价格，并根据预计年租金计算毛收益率。' : 'Compare an offer with Ready or Off-Plan area prices, then estimate gross yield from your annual rent assumption.', market: 'ae-dubai', tool: 'dubai-check', href: '/ae/dubai/check/' },
    { group: 'check', title: ko ? '도쿄 주택 예산 검색' : zh ? '东京住宅预算筛选' : 'Screen Tokyo condominium prices', description: ko ? '정부 공동주택 거래로 동네별 가격을 비교하고 JPY 예산을 계산하세요.' : zh ? '使用政府公寓成交资料比较街区价格，并计算日元预算。' : 'Compare official condominium transactions by neighbourhood, save areas and calculate a JPY scenario.', market: 'jp-tokyo', tool: 'tokyo-budget', href: zh ? '/zh-cn/jp/tokyo/tools/' : '/jp/tokyo/tools/' },
  ];
  const groups: readonly Readonly<{ id: ToolGroup; label: string; description: string }>[] = [
    { id: 'check', label: ko ? '가격 확인' : zh ? '核对价格' : 'Check a price', description: ko ? '제안받은 가격과 임대 조건을 같은 유형의 공개 거래 자료와 비교합니다.' : zh ? '用可比较的公开交易资料核对报价和租赁条件。' : 'Position an asking price or rent against comparable released evidence.' },
    { id: 'compare', label: ko ? '비교' : zh ? '比较' : 'Compare', description: ko ? '예산이나 두 임대 조건을 같은 기준에서 나란히 봅니다.' : zh ? '用同一基准比较预算或两组租赁条件。' : 'Put budgets or two rent offers on one consistent basis.' },
    { id: 'returns', label: ko ? '비용·수익' : zh ? '成本与收益' : 'Costs & returns', description: ko ? '직접 입력한 매입 비용, 임대료와 공실 가정으로 결과를 계산합니다.' : zh ? '根据您输入的购置成本、租金和空置假设进行计算。' : 'Calculate costs and operating yield from assumptions you control.' },
  ];

  return <ToolsShell locale={locale} href={`${zh ? '/zh-cn' : prefix}/tools/`}>
    <div className={styles.intro}>
      <ResearchPageHeading title={ko ? '도구' : zh ? '工具' : 'Tools'} description={ko ? '실거래가와 매물 가격을 비교하고, 필요한 예산과 예상 수익을 계산해 보세요.' : zh ? '核对价格、比较条件，并用自己的假设进行计算。' : 'Check a price, compare terms and calculate your own scenario.'} />
    </div>
    <ToolEventOnMount event="tools_hub_open" market="global" surface="tools-hub" tool="tools-hub" />
    <div className={styles.directory}>
      {groups.map((group) => <section className={styles.group} data-tool-group={group.id} key={group.id}>
        <div className={styles.groupHeading}><h2>{group.label}</h2><p>{group.description}</p></div>
        <ul className={styles.list}>{items.filter((item) => item.group === group.id).map((item) => <li key={item.tool} data-tool-id={item.tool} data-tool-market={item.market}>
          <div><small>{item.market === 'global' ? (item.tool === 'passport' ? 'USD · KRW · SGD · AED · JPY' : 'KRW · SGD · AED · JPY') : item.market === 'kr-seoul' ? (ko ? '서울' : 'Seoul') : item.market === 'jp-tokyo' ? (ko ? '도쿄' : 'Tokyo') : item.market === 'ae-dubai' ? (ko ? '두바이' : 'Dubai') : (ko ? '싱가포르' : 'Singapore')}{zh && !['passport','tokyo-budget','property-scenario'].includes(item.tool) ? ' · English' : ''}</small><h3>{item.title}</h3><p>{item.description}</p></div>
          <TrackedToolLink href={marketHref(ko ? 'ko' : 'en', item.href)} market={item.market} tool={item.tool} surface="tools-hub">{ko ? '열기' : zh ? '打开' : 'Open tool'}<UiIcon name="arrow-right" /></TrackedToolLink>
        </li>)}</ul>
      </section>)}
    </div>
    <ToolResearchManagement locale={locale} />
    <section className={`${styles.group} ${styles.budget}`}><div className={styles.groupHeading}><h2>{ko ? '예산으로 단지 찾기' : zh ? '按预算寻找住宅' : 'Find homes within your budget'}</h2><p>{ko ? '예산 안에서 거래된 단지를 찾아 이 브라우저에 저장할 수 있습니다. 현재 판매 중인 매물은 별도로 확인해 주세요.' : zh ? '根据已申报交易筛选住宅，并在当前浏览器保存关注列表。不是在售房源。' : 'Find places with reported prices within your budget and save a shortlist in this browser. These are transaction screens, not available listings.'}</p></div><nav className={styles.links} aria-label={ko ? '지역별 예산 검색' : 'Budget search by city'}><Link href={`${prefix}/kr/seoul/shortlist/`}>{ko ? '서울' : 'Seoul'}</Link><Link href={marketHref(ko ? 'ko' : 'en', '/sg/singapore/shortlist/')}>{ko ? '싱가포르' : 'Singapore'}</Link><Link href={marketHref(ko ? 'ko' : 'en', '/ae/dubai/shortlist/')}>{ko ? '두바이' : 'Dubai'}</Link><Link href={zh ? '/zh-cn/jp/tokyo/tools/' : marketHref(ko ? 'ko' : 'en', '/jp/tokyo/tools/')}>{ko ? '도쿄' : 'Tokyo'}</Link></nav></section>
  </ToolsShell>;
}
