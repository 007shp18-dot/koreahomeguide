import Link from 'next/link';

import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import { resolveMarketNavigation, type ProductSurface } from '../../lib/navigation/market-route-resolver';
import type { SingaporeEvidenceModel } from '../../lib/singapore/route-types';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import styles from './singapore.module.css';

export const singaporeHeader: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Singapore evidence navigation',
  navigationVariant: 'supplied',
  marketLabel: 'Singapore',
  links: resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'home' }).links,
};

export const singaporeFooter: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified private residential sale evidence, with publication limits shown.',
  navigationLabel: 'Singapore footer navigation',
  links: [
    ...resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'home' }).links,
  ],
  status: 'Singapore publication remains gated by verified source rights and evidence readiness.',
};

export function SingaporePage({ children, currentHref, unframed = false }: Readonly<{
  children: React.ReactNode;
  currentHref?: string;
  unframed?: boolean;
}>) {
  const surface: ProductSurface = currentHref?.includes('/check/') ? 'check'
    : currentHref?.includes('/explore/') || currentHref?.includes('/hdb/') ? 'explore'
      : currentHref?.includes('/corrections/') ? 'corrections'
        : 'home';
  const header = currentHref === undefined ? singaporeHeader : {
    ...singaporeHeader,
    links: resolveMarketNavigation({ market: 'singapore', locale: 'en', surface }).links,
  };
  return (
    <div id="top" className={styles.page}>
      <SiteHeader copy={header} />
      <main className={unframed ? styles.mainUnframed : styles.main}>{children}</main>
      <SiteFooter copy={singaporeFooter} />
    </div>
  );
}

export function SingaporeScope() {
  return (
    <div className={styles.scope} aria-label="Singapore sale scope">
      <span>CCR</span><span>RCR</span><span>OCR</span>
      <span>New sale</span><span>Subsale</span><span>Resale</span>
    </div>
  );
}

export function SingaporeEvidence({ model }: Readonly<{ model: SingaporeEvidenceModel }>) {
  return (
    <section className={styles.section} aria-labelledby="singapore-source-heading">
      <p className={styles.sectionLabel}>Source boundary</p>
      <h2 id="singapore-source-heading">What this evidence can support.</h2>
      <EvidenceDisclosure
        model={model.descriptor}
        boundary="Private residential sale transactions; native area basis retained; publication minimum enforced."
        attribution={['Urban Redevelopment Authority (URA), Singapore']}
      />
      <ul className={styles.limitations}>
        {model.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
      </ul>
      <div className={styles.actions}>
        <Link href="/trust/">Review Global Trust</Link>
        <Link href={model.correctionHref}>Review Singapore corrections</Link>
      </div>
    </section>
  );
}

export { styles as singaporeStyles };
