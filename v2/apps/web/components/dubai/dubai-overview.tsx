import { MarketOverview } from '../market-ui/market-overview';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import { DUBAI_ANNUAL_TRANSACTIONS, DUBAI_RESEARCH_DATE, DUBAI_SOURCES } from '../../lib/dubai/research';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-research.module.css';

export function DubaiOverview({ locale = 'en' }: { locale?: MarketLocale }) {
  const t = (en: string, ko: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  const areas = repository?.listAreas() ?? [];
  const context = repository?.getContext();
  const city = t('Dubai', '두바이', '迪拜');
  const sourceChecked = t('Sources checked', '출처 확인일', '来源核查日期');
  return <main>
    <MarketOverview locale={locale} city={city}
      description={t('Compare Ready and Off-Plan prices, annual rents and estimated gross yields by area.', '지역별 완공·분양 주택 가격, 연 임대료와 비용 차감 전 추정 수익률을 비교하세요.', '按区域比较现房与期房价格、年租金及估算毛租金收益率。')}
      media={<MarketRepresentativePhoto photo={{ ...MARKET_PHOTOS.dubai, alt: t(MARKET_PHOTOS.dubai.alt, '두바이 스카이라인과 고층 건물', '迪拜天际线与高层建筑') }} cityLabel={city} eager locale={locale} />}
      available={!!context} facts={[
        { label: t('Areas covered', '수록 지역 수', '覆盖区域'), value: String(areas.length) },
        { label: t('Price comparison', '가격 비교', '价格比较'), value: t('Ready · Off-Plan', '완공 · 분양', '现房 · 期房') },
        { label: t('Rental comparison', '임대료 비교', '租金比较'), value: t('Annual rent', '연 임대료', '年租金'), detail: t('Estimated gross yields before costs', '비용 차감 전 추정 수익률', '未扣除费用的估算毛收益率') },
        { label: t('Currency', '통화', '货币'), value: 'AED' },
      ]}
      period={context ? t(
        `Comparison period: ${context.comparisonPeriod.from}–${context.comparisonPeriod.to}. Data as of ${context.asOfDate}.`,
        `비교 기간: ${context.comparisonPeriod.from}–${context.comparisonPeriod.to}. 데이터 기준일: ${context.asOfDate}.`,
        `比较期间：${context.comparisonPeriod.from}–${context.comparisonPeriod.to}。数据截至 ${context.asOfDate}。`,
      ) : undefined}
      actions={[
        { label: t('Explore reported prices', '신고 가격 탐색', '探索申报价格'), href: marketHref(locale, '/ae/dubai/explore/'), description: t('Compare Ready and Off-Plan prices by area.', '지역별 완공·분양 주택 가격을 비교하세요.', '按区域比较现房与期房价格。') },
        { label: t('Compare an asking price', '매물 가격 비교', '比较挂牌价'), href: marketHref(locale, '/ae/dubai/check/'), description: t('Compare a property with similar area transactions.', '해당 지역의 유사한 거래와 매물을 비교하세요.', '将房产与该区域相似成交进行比较。') },
        { label: t('Buying guide', '매수 가이드', '购房指南'), href: marketHref(locale, '/ae/dubai/guide/'), description: t('Plan purchase costs and property checks.', '매입 비용과 매물 확인사항을 준비하세요.', '规划购房成本与房产核查。') },
        { label: t('News and analysis', '뉴스·분석', '新闻与分析'), href: marketHref(locale, '/news/?market=dubai'), description: t('Read dated market reports and local analysis.', '기준일이 명시된 시장 보고서와 지역 분석을 읽어보세요.', '阅读注明日期的市场报告与当地分析。') },
      ]}
      notes={<>
        <p>{t('Area medians help compare locations; they do not value a specific home or show current listings. Each area shows its own sample sizes; insufficient samples are withheld.', '지역 중앙값은 지역 간 비교를 돕지만 개별 주택의 감정가격이나 현재 매물을 뜻하지 않습니다. 지역별 표본 수를 표시하며 표본이 부족하면 가격을 공개하지 않습니다.', '区域中位数用于比较位置，不是具体住宅的估值，也不代表当前房源。各区域分别显示样本数；样本不足时不发布价格。')}</p>
        <p>{t('Sale prices and annual rents may cover different properties. Estimated gross yields exclude purchase costs, service charges and vacancy costs.', '매매가격과 연 임대료는 서로 다른 주택을 포함할 수 있습니다. 추정 수익률에는 매입 비용·관리비·공실 비용이 반영되지 않습니다.', '成交价与年租金可能涵盖不同房产。估算毛收益率不包含购房成本、服务费及空置成本。')}</p>
        <p><a href={DUBAI_SOURCES.data}>{t('Dubai Land Department public data', '두바이 토지청 공개 데이터', '迪拜土地局公开数据')}</a>. {sourceChecked} {DUBAI_RESEARCH_DATE}.</p>
      </>}>
      <section className={styles.section} aria-labelledby="dubai-annual-heading">
        <h2 id="dubai-annual-heading">{t('Annual transaction activity', '연간 부동산 거래 동향', '年度成交情况')}</h2>
        <p>{t('The government reported AED 917 billion in real estate transactions for 2025, compared with AED 761 billion for 2024. These totals cover the wider property market and transaction categories; they are not residential sale-price indices.', '정부 발표에 따르면 부동산 거래금액은 2024년 7,610억 AED에서 2025년 9,170억 AED로 증가했습니다. 이 합계는 다양한 부동산 시장과 거래 유형을 포함하며 주택 매매가격 지수가 아닙니다.', '政府公布的房地产交易金额为 2025 年 9,170 亿 AED，2024 年为 7,610 亿 AED。这些总额涵盖更广泛的房地产市场及交易类别，并非住宅成交价格指数。')}</p>
        <figure className={styles.chart} aria-label={t('Dubai annual real estate transaction value in AED billions', '두바이 연간 부동산 거래금액, 십억 AED 단위', '迪拜年度房地产交易金额，单位：十亿 AED')}>
          <div><span>2024</span><i className={styles.bar} style={{ width: `${761 / 1000 * 100}%` }} /><strong>AED 761B</strong></div>
          <div><span>2025</span><i className={styles.bar} style={{ width: `${917 / 1000 * 100}%` }} /><strong>AED 917B</strong></div>
          <figcaption>{t('Zero-based scale: AED 0–1,000 billion. Sources:', '0부터 시작하는 축: 0–1조 AED. 출처:', '坐标轴从零起：0–10,000 亿 AED。来源：')} {DUBAI_ANNUAL_TRANSACTIONS.map((row, index) => <span key={row.year}>{index > 0 ? ' · ' : ''}<a href={row.source}>{row.year} {t('government release', '정부 발표', '政府公告')}</a> ({row.published})</span>)}.</figcaption>
        </figure>
      </section>
      <section className={styles.section} aria-labelledby="dubai-quarter-heading">
        <h2 id="dubai-quarter-heading">{t('Q1 2026 · a separate reporting period', '2026년 1분기 · 별도 집계 기간', '2026 年第一季度 · 独立统计期间')}</h2>
        <dl className={styles.metrics}>
          <div><dt>{t('Total transaction value', '총 거래금액', '交易总额')}</dt><dd>AED 252B</dd></div>
          <div><dt>{t('Real estate transactions', '부동산 거래 수', '房地产交易笔数')}</dt><dd>60,303</dd></div>
          <div><dt>{t('Value change · year on year', '거래금액 전년 동기 대비', '交易金额同比变化')}</dt><dd>+31%</dd></div>
        </dl>
        <p>{t('DLD’s release dated 9 April 2026 compares Q1 with the same quarter of 2025. The quarterly result is kept separate from the full-year chart. It does not establish a current price for an individual home.', '2026년 4월 9일 DLD 발표는 1분기를 2025년 같은 분기와 비교합니다. 분기 수치는 연간 차트와 구분하며 개별 주택의 현재 가격을 나타내지 않습니다.', 'DLD 于 2026 年 4 月 9 日发布的公告将第一季度与 2025 年同期比较。季度结果与全年图表分开展示，不能据此确定具体住宅的当前价格。')} <a href={DUBAI_SOURCES.quarter2026}>{t('Read the DLD release', 'DLD 발표 읽기', '阅读 DLD 公告')}</a>.</p>
      </section>
      <section className={styles.section} aria-labelledby="dubai-checks-heading">
        <h2 id="dubai-checks-heading">{t('Move from the city to the exact property', '도시에서 개별 매물까지 살펴보기', '从城市研究到具体房产')}</h2>
        <p>{t('Use the area directory to frame your search. For a shortlist, record the project number, unit identity, completion status and recurring costs. The guide brings those checks and an AED cost calculator together.', '지역 목록에서 탐색 범위를 정하세요. 관심 매물은 프로젝트 번호·호실 정보·준공 상태·반복 지출을 기록하세요. 가이드에서 확인사항과 AED 비용 계산기를 함께 제공합니다.', '利用区域目录确定搜索范围。筛选候选房产时，记录项目编号、单元身份、竣工状态及经常性支出。指南汇集了这些核查事项与 AED 成本计算器。')}</p>
        <nav className={styles.actions} aria-label={t('Official Dubai tools', '두바이 공식 조회 도구', '迪拜官方查询工具')}>
          <a href={DUBAI_SOURCES.projects}>{t('Project status', '사업 진행 상태', '项目状态')}</a>
          <a href={DUBAI_SOURCES.charges}>{t('Service charges', '관리비', '服务费')}</a>
          <a href={DUBAI_SOURCES.services}>{t('Title, broker and developer checks', '소유권·중개사·시행사 확인', '产权、中介与开发商核查')}</a>
          <a href={DUBAI_SOURCES.data}>{t('DLD public data', 'DLD 공개 데이터', 'DLD 公开数据')}</a>
        </nav>
        <p>{t('Coverage: released area-level sale prices, annual rents and estimated gross yields, alongside dated official market releases. Area medians help you compare locations; they do not value a specific home or show which homes are currently for sale.', '수록 범위: 공개된 지역별 매매가격·연 임대료·추정 수익률 및 날짜가 명시된 공식 시장 발표. 지역 중앙값은 지역 비교를 돕지만 개별 주택의 감정가격이나 현재 매물을 나타내지 않습니다.', '覆盖范围：已发布的区域成交价格、年租金、估算毛收益率，以及注明日期的官方市场公告。区域中位数用于比较位置，不是具体住宅的估值，也不显示当前在售住宅。')} {sourceChecked} {DUBAI_RESEARCH_DATE}.</p>
      </section>
    </MarketOverview>
  </main>;
}
