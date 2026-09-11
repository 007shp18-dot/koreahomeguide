import Link from 'next/link';
import { ToolsShell } from '../tools/tools-shell';
import { ResearchPageHeading } from '../market-ui/research-page-heading';
import { TOKYO_WARDS, TOKYO_CONDOMINIUM_TYPE } from '@/lib/japan/query';
import { readCachedJapanCoverage } from '@/lib/japan/publication-cache.server';
import { compareTokyoPrice, parseTokyoCheck, type TokyoCheckParams } from '@/lib/japan/price-check';
import { readCachedTokyoPriceEvidence, type TokyoPriceEvidence } from '@/lib/japan/price-check.server';
import { tokyoHref, tokyoText, type TokyoLocale } from './tokyo-copy';
import styles from './tokyo-price-check.module.css';
import toolSurface from '../tools/tool-surface.module.css';

export async function TokyoPriceCheck({ searchParams, locale = 'en' }: { searchParams: Promise<TokyoCheckParams>; locale?: TokyoLocale }) {
  const params = await searchParams;
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const text = (en: string, korean: string, chinese: string) => ko ? korean : zh ? chinese : en;
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const href = tokyoHref(locale, '/jp/tokyo/tools/');
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  let input = null, invalid = false, unavailable = false;
  try { input = parseTokyoCheck(params); } catch { invalid = true; }
  const city = input?.city ?? (TOKYO_WARDS.some(([code]) => code === value('city')) ? value('city') : '13103');
  let period: { year: string; quarter: string } | undefined;
  let evidence: TokyoPriceEvidence | null = null;
  const minArea = input ? Number((input.area * 0.8).toFixed(2)) : 0;
  const maxArea = input ? Number((input.area * 1.2).toFixed(2)) : 0;
  if (input) {
    try {
      const coverage = await readCachedJapanCoverage();
      period = coverage.find(row => row.city === city);
      if (period) evidence = await readCachedTokyoPriceEvidence({ city, year:period.year, quarter:period.quarter, neighbourhood:input.neighbourhood, minArea, maxArea });
    } catch { unavailable = true; }
  }
  const comparison = input && evidence ? compareTokyoPrice(input.price, input.area, evidence) : null;
  const number = (n: number) => n.toLocaleString(ko ? 'ko-KR' : zh ? 'zh-CN' : 'en', { maximumFractionDigits: 0 });
  const exploreQuery = new URLSearchParams({ city, type:TOKYO_CONDOMINIUM_TYPE });
  if (input) { exploreQuery.set('minArea', String(minArea)); exploreQuery.set('maxArea', String(maxArea)); if (input.neighbourhood) exploreQuery.set('neighbourhood', input.neighbourhood); }
  if (period) { exploreQuery.set('year', period.year); exploreQuery.set('quarter', period.quarter); }
  const scenarioQuery = new URLSearchParams({ market:'jp-tokyo', currency:'JPY' });
  if (input) { scenarioQuery.set('price', String(input.price)); scenarioQuery.set('area', String(input.area)); }
  return <ToolsShell locale={locale} href={href}>
    <ResearchPageHeading title={text('Check a Tokyo asking price', '도쿄 매물 가격 비교', '核对东京报价')} description={text('Your offer, alongside official condominium transactions. Same ward, similar size, disclosed evidence.', '매물 가격을 같은 구·유사 면적의 정부 공동주택 거래 자료와 나란히 비교하세요.', '将报价与同区、相近面积的政府公寓成交资料比较。')} />
    <nav className={styles.markets} aria-label={text('Market tools', '국가별 도구', '各市场工具')}>
      {[[`${prefix}/kr/seoul/check/`,text('Korea','한국','韩国')],[`${prefix}/sg/singapore/check/`,text('Singapore','싱가포르','新加坡')],[`${prefix}/ae/dubai/check/`,text('Dubai','두바이','迪拜')],[href,text('Japan','일본','日本')]].map(([path,label]) => <Link key={path} href={path!} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <div className={toolSurface.surface}>
    <div className={styles.workspace} data-tool-layout>
      <form action={href} method="get" className={styles.form} data-tool-input>
        <h2>{text('Your property', '비교할 매물', '您的房产')}</h2>
        <label>{text('Ward', '구', '区')}<select name="city" defaultValue={city}>{TOKYO_WARDS.map(([code,name]) => <option key={code} value={code}>{tokyoText(locale,name)}</option>)}</select></label>
        <label>{text('Neighbourhood · optional, exact source name', '동네 · 선택 사항, 원자료 이름과 일치', '街区 · 可选，须与原始名称一致')}<input name="neighbourhood" maxLength={100} defaultValue={value('neighbourhood')} /></label>
        <label>{text('Area · m²', '면적 · ㎡', '面积 · ㎡')}<input name="area" type="number" min="0.01" max="2000" step="0.01" required defaultValue={value('area')} placeholder="60" /></label>
        <label>{text('Asking price · JPY', '매물 가격 · 엔', '报价 · 日元')}<input name="price" type="number" min="1" max="100000000000" step="1" required defaultValue={value('price')} placeholder="90000000" /></label>
        <button type="submit">{text('Compare recorded prices', '실거래가와 비교하기', '比较成交价格')}</button>
        <p>{text('Condominiums only. The comparison uses reported areas within ±20% of your input and the latest published quarter for this ward.', '공동주택만 비교합니다. 입력 면적 ±20% 범위와 해당 구의 최신 공개 분기를 사용합니다.', '仅比较公寓。采用输入面积±20%范围及本区最新已发布季度。')}</p>
      </form>
      <section className={styles.result} data-tool-result aria-label={text('Price comparison result','가격 비교 결과','价格比较结果')} aria-live="polite">
        <p className={styles.eyebrow}>{text('OFFICIAL TRANSACTIONS · JPY/m²', '정부 실거래 자료 · 엔/㎡', '政府成交资料 · 日元/㎡')}</p>
        <h2>{text('How does your offer compare?', '입력한 가격은 실거래가와 얼마나 다를까?', '您的报价与成交价有何差异？')}</h2>
        {invalid ? <p role="alert">{text('Choose a Tokyo ward and enter a valid positive area and price.', '도쿄 구를 선택하고 면적과 가격을 올바른 양수로 입력하세요.', '请选择东京的区，并输入有效的正数面积和价格。')}</p>
          : unavailable ? <p role="alert">{text('Published evidence is temporarily unavailable. Your inputs are retained; try again shortly.', '공개 자료를 불러오지 못했습니다. 입력은 유지되니 잠시 후 다시 시도하세요.', '公开资料暂不可用。已保留输入，请稍后重试。')}</p>
          : !input ? <p className={styles.empty}>{text('Enter an asking price and size to see the evidence—not a preset example or an investment recommendation.', '면적과 매물 가격을 입력하면 실제 자료로 비교합니다. 미리 정한 예시 결과나 투자 추천이 아닙니다.', '输入面积和报价以查看实际资料比较，不是预设示例或投资建议。')}</p>
          : <>
            <p>{tokyoText(locale,TOKYO_WARDS.find(([code]) => code === city)![1])}{input.neighbourhood ? ` · ${input.neighbourhood}` : ''} · {minArea}–{maxArea} m²{period ? ` · ${period.year} Q${period.quarter}` : ''}</p>
            {comparison && evidence ? <>
              <div className={styles.headline}><strong>{comparison.differencePercent > 0 ? '+' : ''}{comparison.differencePercent.toFixed(1)}%</strong><span>{text('vs. the recorded median per m²', '실거래 ㎡당 가격 중앙값 대비', '相对成交每㎡中位价')}</span></div>
              <dl className={styles.metrics}>
                <div><dt>{text('Your asking price / m²', '입력한 ㎡당 매물 가격', '您的每㎡报价')}</dt><dd>¥{number(comparison.askingPerSqm)}</dd></div>
                <div><dt>{text('Recorded median / m²', '실거래 ㎡당 가격 중앙값', '成交每㎡中位价')}</dt><dd>¥{number(evidence.median!)}</dd></div>
                <div><dt>{text('Middle 50% / m²', '㎡당 가격 중간 50% 구간', '每㎡价格中间50%区间')}</dt><dd>¥{number(evidence.lower!)}–{number(evidence.upper!)}</dd></div>
                <div><dt>{text('Matching transactions', '비교 거래 건수', '匹配成交笔数')}</dt><dd>{number(evidence.count)}</dd></div>
              </dl>
            </> : <p className={styles.empty}>{text('Not enough published evidence for a comparison. At least 5 matching transactions are required; no other ward or size range is substituted.', '비교할 공개 거래가 부족합니다. 같은 조건의 거래가 5건 이상이어야 하며, 다른 구나 면적 범위로 임의 대체하지 않습니다.', '公开成交资料不足。至少需要5笔匹配成交，不会以其他区或面积范围替代。')}{evidence ? ` (${evidence.count})` : ''}</p>}
            {evidence?.retrievedAt && <p>{text('Source retrieved', '원자료 수집일', '原始资料获取日期')} · {new Date(evidence.retrievedAt).toISOString().slice(0,10)}</p>}
          </>}
        <nav className={styles.links}>
          <Link href={tokyoHref(locale, `/jp/tokyo/explore/?${exploreQuery}`)}>{text('View the transaction evidence', '근거 거래 보기', '查看成交依据')} →</Link>
          <Link href={`${prefix}/tools/property-scenario/?${scenarioQuery}`}>{text('Calculate costs & yield', '비용·수익 계산하기', '计算成本与收益')} →</Link>
        </nav>
      </section>
    </div>
    </div>
    <section className={styles.method}><h2>{text('What this comparison can—and cannot—tell you', '비교 결과를 읽기 전에', '如何理解此比较')}</h2>
      <p>{text('The median and middle 50% use all matching published transactions, not just the first result page. Differences in age, condition, tenure and exact location remain. MLIT does not identify the individual building or unit. This is not an appraisal, a forecast, or proof that an offer is cheap or expensive.', '중앙값과 중간 50% 구간은 첫 페이지가 아닌 조건에 맞는 전체 공개 거래로 계산합니다. 준공연도·상태·권리·정확한 위치의 차이는 남아 있으며 MLIT 자료는 개별 건물이나 호실을 식별하지 않습니다. 감정평가·가격 예측이 아니며, 저평가나 고평가를 확정하지 않습니다.', '中位价及中间50%区间使用全部匹配的公开成交，而非首页结果。房龄、状况、权利及具体位置仍有差异。MLIT资料不识别具体楼盘或单元。这不是估价、预测，也不能证明报价便宜或昂贵。')}</p>
      <p>{text('Records without an exact numeric area are excluded. Prices exclude your acquisition costs, financing and holding expenses.', '정확한 숫자 면적이 없는 기록은 제외합니다. 본인의 취득 비용·대출·보유 비용은 포함하지 않습니다.', '不含缺少精确数值面积的记录。未计入您的购置费用、融资和持有成本。')}</p>
      <a href="https://www.reinfolib.mlit.go.jp/">{text('Source: MLIT Real Estate Information Library', '출처: 일본 국토교통성 부동산 정보 라이브러리', '来源：日本国土交通省不动产信息库')}</a>
    </section>
  </ToolsShell>;
}
