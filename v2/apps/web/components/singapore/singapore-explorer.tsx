import Link from 'next/link';

import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeExplorer({ model }: Readonly<{ model: SingaporeExploreModel }>) {
  if (model.status === 'unavailable') return (
    <SingaporePage>
      <section className={styles.unavailable} data-singapore-evidence="unavailable">
        <p className={styles.eyebrow}>Singapore · Evidence gate</p>
        <h1>{model.message}</h1>
        <p>No market figure is substituted while verified evidence is unavailable.</p>
        <div className={styles.actions}>
          <Link href="/trust/">Review Global Trust</Link>
          <Link href={model.correctionHref}>Review corrections</Link>
        </div>
      </section>
    </SingaporePage>
  );
  return (
    <SingaporePage>
      <header className={styles.hero} data-singapore-evidence="ready">
        <p className={styles.eyebrow}>Singapore · URA evidence</p>
        <h1>Compare private-sale evidence across CCR, RCR, and OCR.</h1>
        <p>{model.transactionLabel} · {model.periodLabel}</p>
        <SingaporeScope />
      </header>
      <section className={styles.section} aria-labelledby="segment-heading">
        <p className={styles.sectionLabel}>01 / Market segments</p>
        <h2 id="segment-heading">Native Singapore regions, kept separate.</h2>
        <div className={styles.grid}>
          {model.segments.map((segment) => (
            <article className={styles.card} key={segment.code}>
              <p>{segment.state === 'published' ? 'Published evidence' : 'Below publication minimum'}</p>
              <h2>{segment.code}</h2>
              <p>{segment.n} reported transactions · {segment.projectCount} projects</p>
              <p>{segment.medianPriceLabel ?? 'Price distribution not published'}</p>
              <p>{segment.medianPsfLabel ?? 'PSF distribution not published'}</p>
              <Link href={segment.href}>Open {segment.code} evidence</Link>
            </article>
          ))}
        </div>
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
}
