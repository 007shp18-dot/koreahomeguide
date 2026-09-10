import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import styles from '@/components/operator/operator-page.module.css';
import { operatorProfileFromEnvironment } from '@/lib/operator/operator-profile.server';
import { SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';
import { homepageCopy } from '@/lib/site-copy';

export function generateMetadata(): Metadata {
  return indexableMetadata({
    path: '/privacy/',
    title: 'Privacy and data | signedprice',
    description: 'How SignedPrice handles public browsing, decision-tool inputs and structured evidence feedback.',
  });
}

export default function PrivacyPage() {
  const profile = operatorProfileFromEnvironment();
  return (
    <div id="top">
      <SiteHeader copy={homepageCopy.header} />
      <main className={styles.page}>
        <header className={styles.hero} data-product-intro="true">
          <p className={styles.eyebrow}>SignedPrice · Privacy</p>
          <h1>Privacy, in plain language.</h1>
          <p>
            What SignedPrice processes when you browse property evidence, use a decision tool,
            change privacy settings or send us a message.
          </p>
        </header>
        <section className={styles.notice} aria-labelledby="privacy-summary">
          <div>
            <p className={styles.meta}>Effective 10 September 2026 · Current public product</p>
            <h2 id="privacy-summary">We do not sell personal information.</h2>
          </div>
          <p>
            You can browse without an account. Google Analytics measures visits by default; you can turn it off
            through “Privacy choices.” Advertising loads only after you allow it. Property values entered in public tools are not sent as analytics events.
          </p>
        </section>
        <section className={styles.grid} aria-label="Privacy notice sections">
          <article>
            <p className={styles.meta}>01 · Contact</p>
            <h2>Who is responsible</h2>
            <dl>
              <div><dt>Service</dt><dd>{profile.status === 'ready' ? profile.operatorName : 'SignedPrice'}</dd></div>
              <div><dt>Privacy email</dt><dd><a href={`mailto:${profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL}`}>{profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL}</a></dd></div>
            </dl>
          </article>
          <article>
            <p className={styles.meta}>02 · Information</p>
            <h2>What we process</h2>
            <ul className={styles.plainList}>
              <li>Standard hosting and security logs, such as IP address, requested page, time, browser and device signals.</li>
              <li>Privacy choices stored in your browser.</li>
              <li>Daily tool-completion counts grouped only by tool and city, with no input values, browser identifiers or individual event records. Historical voluntary research contributions remain subject to their original deletion and expiry controls.</li>
              <li>Structured community selections and a separate opaque first-party identifier when that feature is available.</li>
              <li>Your email address and message when you contact us.</li>
            </ul>
          </article>
          <article>
            <p className={styles.meta}>03 · Purpose</p>
            <h2>Why we use it</h2>
            <p>To deliver and secure the site, return the comparison you request, improve tools through aggregate usage counts, remember your privacy choice, prevent abuse, understand permitted page usage and respond to messages.</p>
          </article>
          <article>
            <p className={styles.meta}>04 · Property tools</p>
            <h2>Your decision inputs</h2>
            <p>Contract and comparison values are processed to produce the result shown to you. Completed results increment a daily counter containing only the tool category and city. These counters do not store input values, prices, addresses, building or project identifiers, IP addresses, cookies, session or device identifiers, or raw event records. They count completions, not unique people, and can include repeat calculations. Disable analytics in Privacy choices to stop future counting; Do Not Track and Global Privacy Control are also respected. Hosting and security providers still process technical request information as described below.</p>
          </article>
          <article>
            <p className={styles.meta}>05 · Cookies</p>
            <h2>Analytics and advertising</h2>
            <p>Vercel may measure basic site delivery and usage. Google Analytics loads by default and uses cookies to measure page views, visits and site interactions. You can disable it through “Privacy choices”; a saved rejection is respected on future visits in that browser. Google advertising is separate and loads only after you allow it. You can change either choice at any time.</p>
          </article>
          <article>
            <p className={styles.meta}>06 · Community</p>
            <h2>Structured responses</h2>
            <p>Community evidence responses use structured choices rather than names, email addresses or free-text posts. An opaque, secure first-party cookie distinguishes repeat responses and can remain for up to 12 months.</p>
          </article>
          <article>
            <p className={styles.meta}>07 · Providers</p>
            <h2>Maps and infrastructure</h2>
            <p>Hosting, security, analytics, advertising and map providers may receive technical request information needed to provide their service. Google Maps and NAVER Maps are loaded only on pages that use those maps. Their own privacy terms also apply.</p>
          </article>
          <article>
            <p className={styles.meta}>08 · Retention</p>
            <h2>How long we keep it</h2>
            <p>We keep information only for the period needed for the purpose above, security, dispute handling or a legal obligation. Non-identifying daily aggregate usage counts may be retained for product planning. Historical optional product-research contributions are deleted automatically after 90 days. Their ownership cookie can remain for up to 12 months; clearing it means the browser can no longer find earlier contributions for direct deletion, but those records still expire after 90 days. Consent choices remain on your device until cleared; the separate community identifier expires after 12 months; contact messages are deleted or archived when no longer needed.</p>
          </article>
          <article>
            <p className={styles.meta}>09 · Your rights</p>
            <h2>Access, correction and deletion</h2>
            <p>You can delete every historical product-research contribution owned by the current browser from the Tools page. You may also ask what personal information we hold about you, request correction or deletion, object to or restrict processing where applicable, and withdraw consent without affecting earlier processing. Email the privacy address above.</p>
          </article>
          <article>
            <p className={styles.meta}>10 · Safeguards</p>
            <h2>Security, transfers and updates</h2>
            <p>We use access controls, secure transport and data minimisation. Service providers may process information in other countries under their contractual and legal safeguards. SignedPrice is not directed to children. Material policy changes will be dated and published here.</p>
          </article>
        </section>
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
