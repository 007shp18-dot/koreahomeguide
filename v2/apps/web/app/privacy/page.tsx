import type { Metadata } from 'next';

import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import styles from '../../components/operator/operator-page.module.css';
import { operatorProfileFromEnvironment } from '../../lib/operator/operator-profile.server';
import { indexableMetadata } from '../../lib/public-metadata';
import { homepageCopy } from '../../lib/site-copy';

export function generateMetadata(): Metadata {
  if (operatorProfileFromEnvironment().status !== 'ready') {
    return {
      title: 'Privacy configuration | signedprice',
      description: 'SignedPrice privacy information is awaiting verified operator configuration.',
      robots: { index: false, follow: true },
    };
  }
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
          <h1>Privacy and data</h1>
          <p>
            What the current public product processes, what it does not ask for,
            and where to raise a privacy question.
          </p>
        </header>

        {profile.status === 'unavailable' ? (
          <section className={styles.notice} aria-labelledby="operator-unavailable">
            <h2 id="operator-unavailable">Operator details are not configured</h2>
            <p>
              This route is intentionally excluded from search until the verified operator
              name and privacy contact are installed. No placeholder identity or email is shown.
            </p>
          </section>
        ) : (
          <>
            <section className={styles.notice} aria-labelledby="operator-details">
              <h2 id="operator-details">Verified contact boundary</h2>
              <p>
                This notice describes the current SignedPrice public product. Material changes
                to collection or advertising require this notice and the consent boundary to be updated.
              </p>
            </section>
            <section className={styles.grid} aria-label="Privacy notice sections">
              <article>
                <h2>Operator and contact</h2>
                <dl>
                  <div><dt>Operator</dt><dd>{profile.operatorName}</dd></div>
                  <div>
                    <dt>Privacy contact</dt>
                    <dd><a href={`mailto:${profile.privacyContact}`}>{profile.privacyContact}</a></dd>
                  </div>
                </dl>
              </article>
              <article>
                <h2>Public browsing</h2>
                <p>
                  SignedPrice pages can be browsed without creating an account. Hosting and security
                  infrastructure may process standard request metadata needed to deliver and protect the site.
                </p>
              </article>
              <article>
                <h2>Decision-tool inputs</h2>
                <p>
                  Values entered in a contract check are used to return the requested comparison.
                  The public interface does not ask for a name, phone number or free-text personal history.
                </p>
              </article>
              <article>
                <h2>Structured community signals</h2>
                <p>
                  Community feedback is limited to structured choices and is unavailable unless storage,
                  abuse controls and privacy thresholds are configured. It is kept separate from official evidence.
                </p>
              </article>
              <article>
                <h2>Advertising and analytics</h2>
                <p>
                  Advertising or non-essential analytics must not load before the applicable consent state.
                  Their activation requires separate configuration; this page does not imply they are active.
                </p>
              </article>
              <article>
                <h2>Your question</h2>
                <p>
                  Contact the privacy address above to ask about access, correction or deletion in relation
                  to information you submitted. A request may require enough detail to locate the relevant record.
                </p>
              </article>
            </section>
          </>
        )}
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
