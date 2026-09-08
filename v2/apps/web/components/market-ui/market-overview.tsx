import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { MarketHero } from '../market-hero';
import styles from './market-overview.module.css';

export type MarketOverviewProps = Readonly<{
  locale: 'en' | 'ko';
  city: string;
  description: string;
  media: ReactNode;
  facts: readonly Readonly<{ label: string; value: string; detail?: string }>[];
  available: boolean;
  period?: string;
  actions: readonly Readonly<{ label: string; href: string; description: string }>[];
  notes: ReactNode;
  children?: ReactNode;
}>;

export function MarketOverview({ locale, city, description, media, facts, available, period, actions, notes, children }: MarketOverviewProps) {
  const ko = locale === 'ko';
  return <div className={styles.overview} lang={locale} data-market-overview="true">
    <MarketHero model={{ sectionLabel: city, eyebrow: ko ? '시장 개요' : 'Market overview', heading: city, description, facts: [], layout: 'overview' }} media={media} />
    <div className={styles.content}>
      <section aria-label={ko ? '주요 수치' : 'Market facts'}>
        {available ? <>
          <dl className={styles.facts} style={{ '--overview-columns': Math.max(1, Math.min(facts.length, 4)) } as CSSProperties}>{facts.slice(0, 4).map(fact => <div key={fact.label}>
            <dt>{fact.label}</dt><dd>{fact.value}{fact.detail ? <small>{fact.detail}</small> : null}</dd>
          </div>)}</dl>
          {period ? <p className={styles.period}>{period}</p> : null}
        </> : <p role="status">{ko ? '지금은 거래 자료를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.' : 'Transaction data is temporarily unavailable. Please try again shortly.'}</p>}
      </section>
      <section aria-labelledby="market-overview-actions">
        <h2 id="market-overview-actions">{ko ? '탐색과 가격 비교' : 'Explore and compare'}</h2>
        <nav className={styles.actions} style={{ '--overview-columns': Math.max(1, Math.min(actions.length, 4)) } as CSSProperties} aria-label={ko ? '이어서 살펴보기' : 'Where to go next'}>{actions.map((action, index) => <Link key={action.href} href={action.href} data-primary-action={index < 2 ? 'true' : undefined}>
          <h3>{action.label}</h3><p>{action.description}</p>
        </Link>)}</nav>
      </section>
      <section className={styles.notes} aria-labelledby="market-overview-sources">
        <h2 id="market-overview-sources">{ko ? '출처와 집계 범위' : 'Sources and coverage'}</h2>
        {notes}
      </section>
      {children}
    </div>
  </div>;
}
