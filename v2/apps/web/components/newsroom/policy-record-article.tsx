import Link from 'next/link';

import type { PolicyRecord } from '../../lib/policy/policy-types';
import { PolicyBeforeAfter } from './policy-before-after';
import { PolicyDates } from './policy-tracker';
import { PolicyTimeline } from './policy-timeline';
import styles from './newsroom.module.css';
import type { EditorialPortfolioRecord } from '../../content/portfolio-types';

export function PolicyRecordArticle({ policy, article }: Readonly<{
  policy: PolicyRecord;
  article: EditorialPortfolioRecord;
}>) {
  const market = policy.marketId === 'kr-seoul' ? 'Seoul' : 'Singapore';
  return <main
    className={styles.article}
    data-editorial-content-id={article.id}
    data-editorial-content-type={article.type}
    data-editorial-locale={article.locale}
    data-editorial-market={article.marketId ?? undefined}
  >
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <Link href="/news/">News</Link><Link href="/news/policy/">Policy Tracker</Link>
    </nav>
    <header className={styles.articleHero}>
      <p>Policy · {market} · {policy.status}</p>
      <h1>{policy.title}</h1>
      <div className={styles.deck}>{policy.summary}</div>
      <PolicyDates policy={policy} />
    </header>
    <section className={styles.leadEvidence} aria-labelledby="official-source-title">
      <p>Official source</p>
      <h2 id="official-source-title">{policy.source.publisher}</h2>
      <a href={policy.source.href} rel="noreferrer" data-editorial-event="policy_source_open">Open official record</a>
    </section>
    <div className={styles.policyDetailGrid}>
      <section aria-labelledby="policy-lifecycle-title">
        <div className={styles.sectionHeading}><p>Policy lifecycle</p><h2 id="policy-lifecycle-title">What changed, in date order</h2></div>
        <PolicyTimeline events={policy.events} />
      </section>
      <aside aria-labelledby="affected-groups-title">
        <div className={styles.sectionHeading}><p>Decision boundary</p><h2 id="affected-groups-title">Who may be affected</h2></div>
        <ul className={styles.affectedGroups}>{policy.affectedGroups.map((group) => <li key={group}>{group}</li>)}</ul>
        <p className={styles.policyNotice}>This tracker summarizes an official source for orientation. It is not legal advice and does not replace advice for a specific transaction.</p>
      </aside>
    </div>
    <PolicyBeforeAfter comparison={policy.beforeAfter} />
    <section className={styles.sources} aria-labelledby="policy-source-boundary-title" data-editorial-event="article_complete">
      <h2 id="policy-source-boundary-title">Source and verification</h2>
      <ol><li><span>Primary</span><a href={policy.source.href} rel="noreferrer">{policy.source.title}</a><small>Checked {policy.source.checkedAt}</small></li></ol>
    </section>
  </main>;
}
