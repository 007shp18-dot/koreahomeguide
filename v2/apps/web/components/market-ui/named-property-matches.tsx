import Link from 'next/link';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { actualDetailHref, reviewDirectoryForMarket } from '../../lib/research/property-review-locations';
import { propertyOverview } from '../../lib/research/property-overview';
import styles from './property-review-detail.module.css';

const normalized = (value: string) => value.normalize('NFKC').replace(/[\s\p{P}]+/gu, '').toLocaleLowerCase('en');

/** Name matches are independent of anonymous transaction filters and availability. */
export function NamedPropertyMatches({ market, query, locale }: {
  market: 'jp-tokyo' | 'ae-dubai'; query: string; locale: MarketLocale;
}) {
  const term = normalized(query);
  if (!term) return null;
  const matches = reviewDirectoryForMarket(market).filter(entry =>
    normalized(`${entry.name.ko} ${entry.name.en}`).includes(term));
  if (!matches.length) return null;
  const lang = locale === 'ko' ? 'ko' : 'en';
  const title = locale === 'ko' ? '이름으로 찾은 단지 분석' : locale === 'zh-CN' ? '按名称找到的住宅分析' : 'Matching property reviews';
  return <section className={styles.directory} aria-label={title}>
    <h2>{title}</h2>
    <ul>{matches.map(entry => {
      const href = actualDetailHref(locale, entry.id);
      const overview = propertyOverview(entry.id, locale);
      return href ? <li key={entry.id}><Link href={href}>
        <span><strong>{entry.name[lang]}</strong><small>{entry.area[lang]}</small>
          {overview && <small>{overview.impression}</small>}
        </span><span aria-hidden="true">→</span>
      </Link></li> : null;
    })}</ul>
  </section>;
}
