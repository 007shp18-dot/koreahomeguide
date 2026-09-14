import Link from 'next/link';
import { discoveryReading } from '../../lib/discovery/reading';
import type { DiscoveryMarket } from '../../lib/discovery/journal';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './discovery.module.css';

export function DiscoveryReading({ market, locale = 'en', context = 'city' }: { market: DiscoveryMarket; locale?: MarketLocale; context?: 'city' | 'building' }) {
  const links = context === 'building' ? [{ href: `${locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn'}/news/?market=${market}`, label: locale === 'ko' ? '이 도시의 가격 분석과 구매 가이드' : locale === 'zh-CN' ? '这座城市的价格分析与购房指南' : 'Price analysis and buying guides for this city', kind: locale === 'ko' ? '시장 살펴보기' : locale === 'zh-CN' ? '市场研究' : 'Market research' }] : discoveryReading(market, locale);
  const title = context === 'building' ? (locale === 'ko' ? '가격을 비교할 때 함께 읽기' : locale === 'zh-CN' ? '比较价格时的延伸阅读' : 'Further reading for your price comparison') : locale === 'ko' ? '이 도시에서의 생활과 지역 선택' : locale === 'zh-CN' ? '继续了解这座城市' : 'Life and neighbourhoods in this city';
  return <section className={styles.reading} aria-label={title} data-discovery-reading={market}>
    <h2>{title}</h2>
    <ul>{links.map(link => <li key={link.href}><Link href={link.href} prefetch={false}><span><small>{link.kind}</small><strong>{link.label}</strong></span></Link></li>)}</ul>
  </section>;
}
