import Link from 'next/link';

import type {
  SingaporeSegmentModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeSegmentDetail({ model }: Readonly<{
  model: SingaporeSegmentModel | SingaporeUnavailableModel;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage>
      <section className={styles.unavailable} data-singapore-segment="unavailable">
        <h1>{model.message}</h1>
        <p>No segment value is substituted.</p>
        <div className={styles.actions}>
          <Link href="/sg/singapore/explore/">Return to Explore</Link>
          <Link href={model.correctionHref}>Review corrections</Link>
        </div>
      </section>
    </SingaporePage>
  );
  if (model.status === 'insufficient') return (
    <SingaporePage>
      <section className={styles.withheld} data-singapore-segment="insufficient">
        <p className={styles.eyebrow}>Singapore · {model.identity.segment}</p>
        <h1>Distribution not published.</h1>
        <p>{model.count} reported transactions. At least {model.threshold} are required.</p>
        <p>No monetary value is substituted for sparse evidence.</p>
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
  return (
    <SingaporePage>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/sg/singapore/explore/">Explore</Link><span>{model.identity.segment}</span>
      </nav>
      <header className={styles.hero} data-singapore-segment="ready">
        <p className={styles.eyebrow}>Singapore · {model.identity.segment}</p>
        <h1>{model.display.medianPriceLabel} median from {model.display.sampleLabel}.</h1>
        <SingaporeScope />
      </header>
      <section className={styles.section} aria-labelledby="segment-distribution-heading">
        <p className={styles.sectionLabel}>01 / Published distribution</p>
        <h2 id="segment-distribution-heading">Raw transaction evidence.</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>Median price</dt><dd>{model.display.medianPriceLabel}</dd></div>
          <div className={styles.stat}><dt>Middle half</dt><dd>{model.display.middlePriceLabel}</dd></div>
          <div className={styles.stat}><dt>Median unit price</dt><dd>{model.display.medianPsfLabel}</dd></div>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="project-list-heading">
        <p className={styles.sectionLabel}>02 / Projects</p>
        <h2 id="project-list-heading">Projects in {model.identity.segment}.</h2>
        <div className={styles.projectGrid}>
          {model.projects.map((project) => (
            <article className={styles.projectCard} key={project.id}>
              <h3>{project.name}</h3><p>{project.street} · District {project.district}</p>
              <p>{project.n} reported transactions</p>
              <p>{project.medianPriceLabel ?? 'Distribution not published'}</p>
              <p>{project.medianPsfLabel ?? 'PSF not published'}</p>
              <Link href={project.href}>Open project evidence</Link>
            </article>
          ))}
        </div>
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
}
