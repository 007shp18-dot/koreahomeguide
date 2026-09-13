import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ResearchPageHeading } from './market-ui/research-page-heading';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { PriceMarketSearch } from './price-market-search';
import { homepageCopy } from '@/lib/site-copy';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { priceMarkets, pricesCopy, pricesLocalePrefix } from '@/lib/locale/prices-copy';
import styles from './global-product-hub.module.css';

export async function PricesPage({ locale = 'en', searchParams }: { locale?: SiteLocale; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const prefix = pricesLocalePrefix(locale);
  const t = pricesCopy(locale);
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const selected = priceMarkets.find(item => item.id === query.market) ?? priceMarkets[0];
  if (q) redirect(`${prefix}${selected.href}?q=${encodeURIComponent(q)}`);
  return <div id="top">
    <SiteHeader copy={{ ...homepageCopy.header, homeHref: `${prefix}/`, languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', links: [{ label: t.title, href: `${prefix}/prices/`, isCurrent: true }] }} />
    <main className={styles.main}>
      <ResearchPageHeading title={t.title} description={t.description} actions={<><Link href={`${prefix}/passport/`}>{t.budget}</Link><Link href={`${prefix}/tools/`}>{t.tools}</Link></>} />
      <PriceMarketSearch locale={locale} />
      <section className={styles.section} aria-labelledby="read-prices-title">
        <div className={styles.sectionHeading}><p>{t.comparison}</p><h2 id="read-prices-title">{t.check}</h2></div>
        <div className={styles.productGrid}>{t.tips.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
        <p className={styles.researchSources}>{t.source} <Link href="/trust/">{t.trust}</Link> · <Link href={`${prefix}/tools/property-scenario/`}>{t.calculate}</Link></p>
      </section>
      <section className={styles.section} aria-labelledby="price-products-title">
        <div className={styles.sectionHeading}><p>{t.choose}</p><h2 id="price-products-title">{t.find}</h2></div>
        <div className={styles.productGrid}>{priceMarkets.map((market, i) => <Link key={market.id} href={`${prefix}${market.href}`}><span>{t.markets[i]![0]} · {market.currency}</span><h3>{t.markets[i]![1]}</h3><p>{t.markets[i]![2]}</p><strong>{t.explore} →</strong></Link>)}</div>
      </section>
    </main>
    <SiteFooter copy={homepageCopy.footer} locale={locale} />
  </div>;
}
