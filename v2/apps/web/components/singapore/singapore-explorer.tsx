import Link from 'next/link';

import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import { GooglePlaceMap } from '../maps/google-place-map';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

function SingaporeMapSection({ browserKey }: Readonly<{ browserKey: string | null }>) {
  return (
    <section className={styles.section} aria-labelledby="singapore-map-heading">
      <p className={styles.sectionLabel}>01 / Location search</p>
      <h2 id="singapore-map-heading">Find a Singapore address on Google Maps.</h2>
      <GooglePlaceMap browserKey={browserKey} />
    </section>
  );
}

export function SingaporeExplorer({
  model,
  googleMapsBrowserKey = null,
}: Readonly<{
  model: SingaporeExploreModel;
  googleMapsBrowserKey?: string | null;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage>
      <section className={styles.unavailable} data-singapore-evidence="unavailable" data-product-intro="true">
        <p className={styles.eyebrow}>Singapore · Evidence gate</p>
        <h1>{model.message}</h1>
        <p>No market figure is substituted while verified evidence is unavailable.</p>
        <div className={styles.actions}>
          <Link href="/trust/">Review Global Trust</Link>
          <Link href={model.correctionHref}>Review corrections</Link>
        </div>
      </section>
      <SingaporeMapSection browserKey={googleMapsBrowserKey} />
    </SingaporePage>
  );
  return (
    <SingaporePage>
      <header className={styles.hero} data-singapore-evidence="ready" data-product-intro="true">
        <p className={styles.eyebrow}>Singapore · URA evidence</p>
        <h1>Compare private-sale evidence across CCR, RCR, and OCR.</h1>
        <p>{model.transactionLabel} · {model.periodLabel}</p>
        <SingaporeScope />
      </header>
      <SingaporeMapSection browserKey={googleMapsBrowserKey} />
      <section className={styles.section} aria-labelledby="segment-heading">
        <p className={styles.sectionLabel}>02 / Market segments</p>
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
