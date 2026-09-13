import Link from 'next/link';
import { discoveryReading } from '../../lib/discovery/reading';
import type { DiscoveryMarket } from '../../lib/discovery/journal';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './discovery.module.css';

export function DiscoveryReading({ market, locale = 'en' }: { market: DiscoveryMarket; locale?: MarketLocale }) {
  const title = locale === 'ko' ? '이 도시에서의 생활과 지역 선택' : locale === 'zh-CN' ? '继续了解这座城市' : 'Life and neighbourhoods in this city';
  return <section className={styles.reading} aria-label={title} data-discovery-reading={market}>
    <h2>{title}</h2>
    <ul><li><Link href={`${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/living/?market=${({seoul:'kr-seoul',singapore:'sg-singapore',dubai:'ae-dubai',tokyo:'jp-tokyo'})[market]}`} prefetch={false}><span><small>{locale === 'ko' ? '생활권 조사' : locale === 'zh-CN' ? '生活环境' : 'Living context'}</small><strong>{locale === 'ko' ? '단지별 상권·교통·생활환경' : locale === 'zh-CN' ? '小区商业、交通与生活环境' : 'Property surroundings and transport'}</strong></span></Link></li>{discoveryReading(market, locale).map(link => <li key={link.href}><Link href={link.href} prefetch={false}><span><small>{link.kind}</small><strong>{link.label}</strong></span></Link></li>)}</ul>
  </section>;
}
