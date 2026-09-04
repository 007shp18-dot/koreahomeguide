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
import { MarketDetailShell } from '../market-ui/market-shell';
import { EvidencePendingLink } from './evidence-pending-link';

export function SingaporeSegmentDetail({ model }: Readonly<{
  model: SingaporeSegmentModel | SingaporeUnavailableModel;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage currentHref="/sg/singapore/explore/">
      <section className={styles.unavailable} data-singapore-segment="unavailable" data-product-intro="true">
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
    <SingaporePage currentHref="/sg/singapore/explore/">
      <section className={styles.withheld} data-singapore-segment="insufficient" data-product-intro="true">
        <p className={styles.eyebrow}>Singapore · {model.identity.segment}</p>
        <h1>Distribution not published.</h1>
        <p>{model.count} reported transactions. At least {model.threshold} are required.</p>
        <p>No monetary value is substituted for sparse evidence.</p>
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
  return (
    <SingaporePage currentHref="/sg/singapore/explore/" unframed>
      <MarketDetailShell
        breadcrumb={<nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/sg/singapore/explore/">Explore</Link><span>{model.identity.segment}</span></nav>}
        identity={<div className={styles.detailIdentity} data-singapore-segment="ready"><p className={styles.eyebrow}>Singapore · Market segment</p><h1>{model.identity.segment}</h1><SingaporeScope activeSegment={model.identity.segment} /></div>}
        metric={<div className={styles.detailMetric}><small>Median price</small><strong>{model.display.medianPriceLabel}</strong><span>{model.display.sampleLabel}</span></div>}
        evidence={<><section className={styles.section} aria-labelledby="segment-distribution-heading">
        <p className={styles.sectionLabel}>01 / Published distribution</p>
        <h2 id="segment-distribution-heading">Raw transaction evidence.</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>Median price</dt><dd>{model.display.medianPriceLabel}</dd></div>
          <div className={styles.stat}><dt>Middle half</dt><dd>{model.display.middlePriceLabel}</dd></div>
          <div className={styles.stat}><dt>Median unit price</dt><dd>{model.display.medianPsfLabel}</dd></div>
        </dl>
      </section><section className={styles.section} aria-labelledby="project-list-heading">
        <p className={styles.sectionLabel}>02 / Projects</p>
        <h2 id="project-list-heading">Projects in {model.identity.segment}.</h2>
        <div className={styles.projectGrid}>
          {model.projects.map((project) => (
            <article className={styles.projectCard} key={project.id}>
              <h3>{project.name}</h3><p>{project.street} · District {project.district}</p>
              <p>{project.n} reported transactions</p>
              <p>{project.medianPriceLabel ?? 'Distribution not published'}</p>
              <p>{project.medianPsfLabel ?? 'PSF not published'}</p>
              {project.state === 'published'
                ? <EvidencePendingLink href={project.href}>Open project evidence</EvidencePendingLink>
                : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" aria-disabled="true">At least 5 transactions are required</span>}
            </article>
          ))}
        </div>
      </section></>}
        rail={<SingaporeEvidence model={model.evidence} />}
      />
    </SingaporePage>
  );
}
