import Link from 'next/link';
import { tokyoBudgetBands } from '../../content/tokyo-budget-comparison';
import snapshot from '../../content/tokyo-budget-comparison-data.json';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import styles from './visual-panels.module.css';

/** Selected anonymous source groups: not an average home, a live listing, or a price index. */
export function TokyoBudgetChart({ locale }: { locale: SiteLocale }) {
  const band = tokyoBudgetBands(locale)[1]!;
  const examples = band.examples.slice(0, 4);
  const text = (en: string, ko: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1000000);
  const heading = text('Different neighbourhoods, one budget', '같은 예산, 다른 도쿄의 동네', '相同预算，不同的东京社区');
  return <section className={styles.pulse} data-market-pulse="tokyo" aria-labelledby="tokyo-range-heading">
    <header className={styles.heading}><div><p className={styles.eyebrow}>TOKYO / RECORDED PRICE RANGES</p><h2 id="tokyo-range-heading">{heading}</h2><p>{text('Selected pre-owned condominium groups up to JPY 50M. Each bar shows the observed price range.', '5,000만 엔 이하로 거래된 선정 중고 맨션 그룹입니다. 막대는 관측된 최저·최고 거래가격을 보여줍니다.', '不超过5,000万日元的选定二手公寓成交组。横条展示观察到的最低和最高成交价。')}</p></div></header>
    <div className={styles.rangeRows}>{examples.map((item, i) => <div className={styles.rangeRow} key={item.evidenceHref}>
      <Link href={item.evidenceHref}>{item.name} →</Link>
      <svg role="img" aria-labelledby={`tokyo-range-${i}`} viewBox="0 0 400 44" preserveAspectRatio="none"><title id={`tokyo-range-${i}`}>{item.name}: JPY {number(item.price[0]!)}–{number(item.price[1]!)}M, {item.count} {text('records','건','笔')}</title><rect x="0" y="14" width="400" height="16" rx="8" fill="#eef4fc"/><rect x={item.price[0]! / band.cap * 400} y="12" width={Math.max(4, (item.price[1]! - item.price[0]!) / band.cap * 400)} height="20" rx="6" fill="#2563d8"/></svg>
      <span>JPY {number(item.price[0]!)}–{number(item.price[1]!)}M<small>{item.area[0]}–{item.area[1]} m² · {item.count} {text('records','건','笔')}</small></span>
    </div>)}</div>
    <footer className={styles.chartFooter}><span>{snapshot.period} · {text('Source checked','출처 확인','来源核实')}: {snapshot.checkedAt} · {text('Anonymous groups, not identified buildings. Axis: JPY 0–50M.','익명 거래 그룹으로 특정 건물의 가격이 아닙니다. 축 범위: 0~5,000만 엔.','匿名成交组，并非特定楼宇价格。坐标范围：0–5,000万日元。')}</span><a href={snapshot.source} target="_blank" rel="noopener noreferrer">MLIT / {text('Official source','공식 출처','官方来源')} ↗</a></footer>
  </section>;
}
