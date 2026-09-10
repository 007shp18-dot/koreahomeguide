import Link from 'next/link';

import {
  GUIDES,
  GUIDE_GLOSSARY,
} from '../../lib/guide/guide-content';
import styles from './guide.module.css';

const guideStages = Object.freeze(
  [...new Set(GUIDES.map(({ stage }) => stage))].map((stage) => Object.freeze({
    stage,
    guides: Object.freeze(GUIDES.filter((guide) => guide.stage === stage)),
  })),
);

export function GuideIndex() {
  return (
    <>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p>Seoul · Decision methodology</p>
          <h1>Rent, verify, and compare with the full Korea guide library.</h1>
          <p>KoreaHomeGuide’s practical rental guides now sit beside SignedPrice’s reported-contract evidence, with current source boundaries kept visible.</p>
        </header>

        <section className={styles.guides} aria-labelledby="guide-list-heading">
          <div className={styles.sectionHeading}>
            <p>01 / Guides</p>
            <h2 id="guide-list-heading">Choose the decision stage.</h2>
          </div>
          <div className={styles.stageGroups}>
            {guideStages.map(({ stage, guides }) => (
              <section className={styles.guideStage} data-guide-stage={stage} key={stage}>
                <h3>{stage}</h3>
                <ol>
                  {guides.map((guide) => (
                    <li key={guide.slug}>
                      <p>{guide.readMinutes} min read</p>
                      <h4>{guide.title}</h4>
                      <p>{guide.summary}</p>
                      <Link href={`/kr/seoul/guide/${guide.slug}/`}>Read guide</Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
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
          <Link href="/kr/seoul/check/">Open Contract Check</Link>
          <Link href="/kr/seoul/explore/">Open District Explorer</Link>
          <Link href="/trust/">Read SignedPrice Trust</Link>
        </nav>
      </main>
    </>
  );
}
