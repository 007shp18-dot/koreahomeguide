import Link from 'next/link';
import { discoveryReading } from '../../lib/discovery/reading';
import type { DiscoveryMarket } from '../../lib/discovery/journal';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './discovery.module.css';

export function DiscoveryReading({ market, locale = 'en' }: { market: DiscoveryMarket; locale?: MarketLocale }) {
  const title = locale === 'ko' ? '이 도시에서의 생활과 지역 선택' : locale === 'zh-CN' ? '继续了解这座城市' : 'Life and neighbourhoods in this city';
  return <section className={styles.reading} aria-label={title} data-discovery-reading={market}>
    <h2>{title}</h2>
    <ul>{discoveryReading(market, locale).map(link => <li key={link.href}><Link href={link.href} prefetch={false}><span><small>{link.kind}</small><strong>{link.label}</strong></span></Link></li>)}</ul>
  </section>;
}
