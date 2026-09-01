import Link from 'next/link';

import type { GuideDocument as GuideDocumentModel } from '../../lib/guide/guide-content';
import { PublicSectionTabs } from '../public-market/public-section-tabs';
import styles from './guide.module.css';

export function GuideDocument({ guide }: Readonly<{ guide: GuideDocumentModel }>) {
  const [primaryLink] = guide.links;
  return (
    <>
      <PublicSectionTabs current="guide" />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol>
            <li><Link href="/kr/seoul/guide/">Guide</Link></li>
            <li aria-current="page">{guide.title}</li>
          </ol>
        </nav>
        <article className={styles.document}>
          <header className={styles.documentHero}>
            <p>{guide.stage} · {guide.readMinutes} min read</p>
            <h1>{guide.title}</h1>
            <p>{guide.summary}</p>
            <p>Last verified <time dateTime={guide.lastVerified}>{guide.lastVerified}</time></p>
          </header>
          <div className={styles.readingLayout}>
            <div className={styles.readingColumn}>
              <ol className={styles.steps}>
                {guide.steps.map((step, index) => (
                  <li key={step.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h2>{step.title}</h2><p>{step.body}</p></div>
                  </li>
                ))}
              </ol>
              <aside className={styles.boundary} aria-label="Evidence boundary">
                <h2>Evidence boundary</h2>
                <p>{guide.evidenceBoundary}</p>
              </aside>
            </div>
            {primaryLink === undefined ? null : (
              <aside className={styles.nextStep} aria-label="Guide next step">
                <p>Next step</p>
                <strong>Apply this guide to the live evidence.</strong>
                <Link href={primaryLink.href}>{primaryLink.label}</Link>
              </aside>
            )}
          </div>
          <nav className={styles.actions} aria-label="Related evidence">
            {guide.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
        </article>
      </main>
    </>
  );
}
