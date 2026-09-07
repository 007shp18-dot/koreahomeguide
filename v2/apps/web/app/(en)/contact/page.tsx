import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import styles from '@/components/operator/operator-page.module.css';
import { operatorProfileFromEnvironment } from '@/lib/operator/operator-profile.server';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';
import { homepageCopy } from '@/lib/site-copy';

export function generateMetadata(): Metadata {
  return indexableMetadata({
    path: '/contact/',
    title: 'Contact | signedprice',
    description: 'Contact the verified SignedPrice operator or use the evidence correction route.',
  });
}

export default function ContactPage() {
  const profile = operatorProfileFromEnvironment();
  return (
    <div id="top">
      <SiteHeader copy={homepageCopy.header} />
      <main className={styles.page}>
        <header className={styles.hero} data-product-intro="true">
          <p className={styles.eyebrow}>SignedPrice · Contact</p>
          <h1>Talk to SignedPrice.</h1>
          <p>
            Ask about a property comparison, our data or a partnership.
            Include the city and the question you could not answer on the site.
          </p>
        </header>
        <section className={styles.notice} aria-labelledby="contact-primary">
          <div>
            <p className={styles.meta}>General enquiries</p>
            <h2 id="contact-primary">Start with one email.</h2>
          </div>
          <div className={styles.actions}>
            <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
          </div>
        </section>
        <section className={styles.grid} aria-label="Property research questions">
          {(['seoul', 'singapore', 'dubai'] as const).map((city) => {
            const label = city === 'seoul' ? 'Seoul' : city === 'singapore' ? 'Singapore' : 'Dubai';
            const body = `City: ${label}\nPurpose (living / renting / investment):\nApproximate budget and currency (optional):\nProperty or area (public link, optional):\nMy question:\n\nPlease do not include identity documents, bank details or private contracts.`;
            return <article key={city} id={`research-${city}`}>
              <p className={styles.meta}>{label} · Research</p>
              <h2>A question about {label}?</h2>
              <p>Tell us your purpose, the area or property you are considering, and what you need to understand. Budget is optional.</p>
              <div className={styles.actions}><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}?subject=${encodeURIComponent(`${label} property research question`)}&body=${encodeURIComponent(body)}`}>Open an email draft</a></div>
              <p>Nothing is sent until you send the email. Please omit identity documents, bank details and private contracts.</p>
            </article>;
          })}
        </section>
        <section className={styles.notice} aria-label="Research enquiry scope">
          <div><h2>Research questions, not a booking.</h2><p>We welcome questions about the published data and comparison methods. Sending a message does not book brokerage, a valuation or personalised investment advice. We may need additional sources to answer a property-specific question.</p></div>
          <Link href="/privacy/">How we handle personal information</Link>
        </section>
        <section className={styles.grid} aria-label="SignedPrice contact routes">
          <article>
            <p className={styles.meta}>01 · Product</p>
            <h2>General and partnerships</h2>
            <p>Questions about SignedPrice, market coverage, partnerships or the public product.</p>
            <div className={styles.actions}>
              <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>Email the team</a>
            </div>
          </article>
          <article>
            <p className={styles.meta}>02 · Privacy</p>
            <h2>Personal information</h2>
            <p>Ask about access, correction, deletion, consent or how SignedPrice handles personal information.</p>
            <div className={styles.actions}>
              <a href={`mailto:${profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL}`}>{profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL}</a>
              <Link href="/privacy/">Read the privacy notice</Link>
            </div>
          </article>
          <article>
            <p className={styles.meta}>03 · Evidence</p>
            <h2>Correct a data issue</h2>
            <p>Report a Seoul evidence issue through the correction route so the affected record and review result stay traceable.</p>
            <div className={styles.actions}>
              <Link href="/kr/seoul/corrections/">Open correction route</Link>
              <Link href="/trust/">Read evidence policy</Link>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
