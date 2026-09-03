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
        <header className={styles.hero} data-product-intro="true">
          <p className={styles.eyebrow}>SignedPrice · Contact</p>
          <h1>Contact the right route</h1>
          <p>
            Privacy questions and evidence corrections follow separate paths so a report reaches
            the right review boundary.
          </p>
        </header>

        {profile.status === 'unavailable' ? (
          <section className={styles.notice} aria-labelledby="contact-unavailable">
            <h2 id="contact-unavailable">Contact SignedPrice</h2>
            <p>
              The public operator identity is still being configured. The verified email routes below
              are available now.
            </p>
            <div className={styles.actions}>
              <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
              <a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a>
            </div>
          </section>
        ) : (
          <section className={styles.grid} aria-label="SignedPrice contact routes">
            <article>
              <h2>General enquiries</h2>
              <p>Questions about SignedPrice, partnerships and the public product.</p>
              <div className={styles.actions}>
                <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
              </div>
            </article>
            <article>
              <h2>Privacy</h2>
              <p>Questions about personal information, access, correction or deletion.</p>
              <div className={styles.actions}>
                <a href={`mailto:${profile.privacyContact}`}>{profile.privacyContact}</a>
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
