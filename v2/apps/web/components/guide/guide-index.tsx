import Link from 'next/link';

import {
  GUIDES,
  GUIDE_GLOSSARY,
} from '../../lib/guide/guide-content';
import { PublicSectionTabs } from '../public-market/public-section-tabs';
import styles from './guide.module.css';

export function GuideIndex() {
  return (
    <>
      <PublicSectionTabs current="guide" />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p>Seoul · Decision methodology</p>
          <h1>Use property evidence without losing its boundary.</h1>
          <p>Short guides for comparing contracts, reading district evidence, and understanding why SignedPrice sometimes refuses to publish a figure.</p>
        </header>

        <section className={styles.guides} aria-labelledby="guide-list-heading">
          <div className={styles.sectionHeading}>
            <p>01 / Guides</p>
            <h2 id="guide-list-heading">Choose the decision stage.</h2>
          </div>
          <ol>
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <p>{guide.stage} · {guide.readMinutes} min</p>
                <h3>{guide.title}</h3>
                <p>{guide.summary}</p>
                <Link href={`/kr/seoul/guide/${guide.slug}/`}>Read guide</Link>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.glossary} aria-labelledby="guide-glossary-heading">
          <div className={styles.sectionHeading}>
            <p>02 / Glossary</p>
            <h2 id="guide-glossary-heading">Terms used across SignedPrice evidence.</h2>
          </div>
          <dl>
            {GUIDE_GLOSSARY.map((entry) => (
              <div key={entry.term}>
                <dt>{entry.term}</dt>
                <dd>{entry.definition}</dd>
                <dd><strong>Why it matters:</strong> {entry.whyItMatters}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav className={styles.actions} aria-label="Guide evidence links">
          <Link href="/kr/">Open Contract Check</Link>
          <Link href="/kr/seoul/explore/">Open District Explorer</Link>
          <Link href="/trust/">Read SignedPrice Trust</Link>
        </nav>
      </main>
    </>
  );
}
