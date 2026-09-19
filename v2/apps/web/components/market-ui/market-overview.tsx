import { PhotographicHero } from '../visual/photographic-hero';
import { MarketPulse } from '../visual/market-pulse';
import { LocalLifeGallery } from '../visual/local-life-gallery';
import { IllustratedCta } from '../visual/illustrated-cta';
import type { BuyingCity } from '../../lib/home/buying-journey';
import { localizedMarketCopy } from '../../lib/locale/market-localization';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import styles from './market-overview.module.css';

export type MarketOverviewProps = Readonly<{
  locale: 'en' | 'ko' | 'zh-CN';
  city: string;
  buyingCity?: BuyingCity;
  description: string;
  media: ReactNode;
  facts: readonly Readonly<{ label: string; value: string; detail?: string }>[];
  available: boolean;
  period?: string;
  actions: readonly Readonly<{ label: string; href: string; description: string }>[];
  notes: ReactNode;
  children?: ReactNode;
}>;

export function MarketOverview({ locale, city, buyingCity, description, media, facts, available, period, actions, notes, children }: MarketOverviewProps) {
  return <div className={styles.overview} lang={locale} data-market-overview="true">
    <PhotographicHero city={buyingCity} title={city} description={description} media={media} locale={locale} />
    <div className={styles.content}>
      <section aria-label={localizedMarketCopy(locale, "Market facts", "주요 수치")}>
        {available ? <>
          <dl className={styles.facts} style={{ '--overview-columns': Math.max(1, Math.min(facts.length, 4)) } as CSSProperties}>{facts.slice(0, 4).map(fact => <div key={fact.label}>
            <dt>{fact.label}</dt><dd>{fact.value}{fact.detail ? <small>{fact.detail}</small> : null}</dd>
          </div>)}</dl>
          {period ? <p className={styles.period}>{period}</p> : null}
        </> : <p role="status">{localizedMarketCopy(locale, "Transaction data is temporarily unavailable. Please try again shortly.", "지금은 거래 자료를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.")}</p>}
      </section>
      {buyingCity && buyingCity !== 'tokyo' ? <MarketPulse locale={locale} city={buyingCity} /> : null}
      {buyingCity ? <LocalLifeGallery city={buyingCity} locale={locale} /> : null}
      <section aria-labelledby="market-overview-actions">
        <h2 id="market-overview-actions">{localizedMarketCopy(locale, "Explore and compare", "탐색과 가격 비교")}</h2>
        <nav className={styles.actions} style={{ '--overview-columns': Math.max(1, Math.min(actions.length, 4)) } as CSSProperties} aria-label={localizedMarketCopy(locale, "Where to go next", "이어서 살펴보기")}>{actions.map((action, index) => <Link key={action.href} href={action.href} data-primary-action={index < 2 ? 'true' : undefined}>
          <h3>{action.label}</h3><p>{action.description}</p>
        </Link>)}</nav>
      </section>
      <section className={styles.notes} aria-labelledby="market-overview-sources">
        <h2 id="market-overview-sources">{localizedMarketCopy(locale, "Sources and coverage", "출처와 집계 범위")}</h2>
        {notes}
      </section>
      {children}
      <IllustratedCta locale={locale} />
    </div>
  </div>;
}
