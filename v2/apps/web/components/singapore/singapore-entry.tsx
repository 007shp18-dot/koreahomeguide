import Link from 'next/link';

import type { SingaporeEntryModel } from '../../lib/singapore/route-types';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeEntry({ model }: Readonly<{ model: SingaporeEntryModel }>) {
  if (model.status === 'unavailable') return (
    <SingaporePage><section className={styles.unavailable} data-singapore-entry="unavailable" data-product-intro="true">
      <p className={styles.eyebrow}>Singapore · Release gate</p><h1>{model.message}</h1>
      <p>Direct access remains claim-free until verified private-sale evidence is ready.</p>
      <div className={styles.actions}><Link href="/trust/">Review Global Trust</Link><Link href={model.correctionHref}>Review corrections</Link></div>
    </section></SingaporePage>
  );
  return (
    <SingaporePage>
      <header className={styles.hero} data-singapore-entry="ready" data-product-intro="true">
        <p className={styles.eyebrow}>Singapore · Private residential sales</p>
        <h1>Official sale evidence, separated by native market segment.</h1>
        <p>{model.transactionLabel} · {model.projectLabel} · {model.periodLabel}</p>
        <SingaporeScope />
        <div className={styles.actions}><Link href={model.exploreHref}>Open Singapore Explore</Link><Link href="/trust/">Review Global Trust</Link></div>
      </header>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
}
