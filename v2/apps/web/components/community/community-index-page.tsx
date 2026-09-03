import Link from 'next/link';

import { homepageCopy, type SiteHeaderModel } from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import styles from './community-index.module.css';

const header: SiteHeaderModel = {
  ...homepageCopy.header,
  links: homepageCopy.header.links.map((link) => ({
    ...link,
    isCurrent: link.href === '/community/',
  })),
};

const markets = [
  {
    code: 'KR',
    city: 'Seoul',
    state: 'Foundation ready',
    description: 'District and retained-building scopes are connected to the existing evidence identity.',
    href: '/kr/seoul/community/',
  },
  {
    code: 'SG',
    city: 'Singapore',
    state: 'Preparing',
    description: 'Area and project scopes will use the same moderation and identity model.',
    href: '/sg/singapore/community/',
  },
  {
    code: 'AE',
    city: 'Dubai',
    state: 'Preparing',
    description: 'Community and building scopes remain closed until local operating review is complete.',
    href: '/ae/dubai/community/',
  },
] as const;

export function CommunityIndexPage() {
  return (
    <div id="top">
      <SiteHeader copy={header} />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p>LOCAL COMMUNITY</p>
          <h1>One community, organized by place.</h1>
          <p>Browse by market, then continue into a district, neighbourhood or building. The same conversation can appear in the global feed and in its exact local context.</p>
        </header>

        <section className={styles.directory} aria-labelledby="community-markets-heading">
          <div className={styles.sectionHeading}>
            <div><p>01 / MARKETS</p><h2 id="community-markets-heading">Choose a market first.</h2></div>
            <span>Posting opens after moderation and identity gates pass.</span>
          </div>
          <div className={styles.marketGrid}>
            {markets.map((market) => (
              <Link href={market.href} key={market.code}>
                <span>{market.code}</span>
                <h3>{market.city}</h3>
                <p>{market.description}</p>
                <strong>{market.state} →</strong>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.scope} aria-labelledby="community-scope-heading">
          <div className={styles.sectionHeading}><div><p>02 / STRUCTURE</p><h2 id="community-scope-heading">A single feed, four levels of context.</h2></div></div>
          <ol>
            <li><span>01</span><div><strong>Global</strong><p>Recent conversations and announcements across all markets.</p></div></li>
            <li><span>02</span><div><strong>Market</strong><p>Seoul, Singapore or Dubai discussions.</p></div></li>
            <li><span>03</span><div><strong>District</strong><p>Questions and local knowledge tied to a neighbourhood or area.</p></div></li>
            <li><span>04</span><div><strong>Building</strong><p>Conversation attached to the exact building identity used by price evidence.</p></div></li>
          </ol>
        </section>

        <aside className={styles.notice}>
          <strong>Read-only launch state</strong>
          <p>No public posts are fabricated. Writing, replies and alerts will open only with reporting, moderation and privacy controls in place.</p>
        </aside>
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
