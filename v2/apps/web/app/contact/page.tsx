import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import styles from '../../components/operator/operator-page.module.css';
import { operatorProfileFromEnvironment } from '../../lib/operator/operator-profile.server';
import { indexableMetadata } from '../../lib/public-metadata';
import { homepageCopy } from '../../lib/site-copy';

export function generateMetadata(): Metadata {
  if (operatorProfileFromEnvironment().status !== 'ready') {
    return {
      title: 'Contact configuration | signedprice',
      description: 'SignedPrice contact information is awaiting verified operator configuration.',
      robots: { index: false, follow: true },
    };
  }
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
        <header className={styles.hero}>
          <p className={styles.eyebrow}>SignedPrice · Contact</p>
          <h1>Contact the right route</h1>
          <p>
            Privacy questions and evidence corrections follow separate paths so a report reaches
            the right review boundary.
          </p>
        </header>

        {profile.status === 'unavailable' ? (
          <section className={styles.notice} aria-labelledby="contact-unavailable">
            <h2 id="contact-unavailable">Operator details are not configured</h2>
            <p>
              This route remains non-indexable until a verified operator and contact address are installed.
              SignedPrice does not publish an invented email, address or telephone number.
            </p>
          </section>
        ) : (
          <section className={styles.grid} aria-label="SignedPrice contact routes">
            <article>
              <h2>Operator</h2>
              <p>{profile.operatorName}</p>
              <div className={styles.actions}>
                <a href={`mailto:${profile.privacyContact}`}>Email {profile.privacyContact}</a>
              </div>
            </article>
            <article>
              <h2>Evidence corrections</h2>
              <p>
                Report a Seoul evidence issue through the correction ledger route. Published fixes
                and upheld reviews stay distinguishable.
              </p>
              <div className={styles.actions}>
                <Link href="/kr/seoul/corrections/">Open correction route</Link>
                <Link href="/trust/">Read evidence policy</Link>
              </div>
            </article>
          </section>
        )}
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
