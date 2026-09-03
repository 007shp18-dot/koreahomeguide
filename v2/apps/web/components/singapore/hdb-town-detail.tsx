import Link from 'next/link';

import type { HdbTownModel } from '../../lib/singapore/hdb-route-model.server';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';

export function HdbTownDetail({ model }: Readonly<{ model: HdbTownModel }>) {
  return <SingaporePage currentHref="/sg/singapore/explore/" unframed>
    <MarketDetailShell
      breadcrumb={<nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/sg/singapore/explore/">Explore</Link><span>{model.town}</span></nav>}
      identity={<div className={styles.detailIdentity} data-hdb-town="ready"><p className={styles.eyebrow}>Singapore · HDB town</p><h1>{model.town}</h1></div>}
      metric={<div className={styles.detailMetric}><small>Observed blocks</small><strong>{model.blocks.length}</strong><span>HDB evidence</span></div>}
      evidence={<section className={styles.section} aria-labelledby="hdb-blocks-heading">
      <p className={styles.sectionLabel}>01 / Observed blocks</p>
      <h2 id="hdb-blocks-heading">{model.blocks.length} blocks with HDB evidence.</h2>
      <div className={styles.tableWrap}><table className={`${styles.table} ${styles.hdbTable}`}>
        <thead><tr><th>Block</th><th>Resale median</th><th>Resale n</th><th>Monthly rent median</th><th>Rental n</th></tr></thead>
        <tbody>{model.blocks.map((block) => <tr key={block.blockId}>
          <th scope="row"><Link href={block.href}>{block.address}</Link></th>
          <td>{block.resaleMedianLabel ?? 'Not published'}</td><td>{block.resaleCountLabel}</td>
          <td>{block.rentalMedianLabel ?? 'Not published'}</td><td>{block.rentalCountLabel}</td>
        </tr>)}</tbody>
      </table></div>
      </section>}
      rail={<section className={styles.section}><p className={styles.sectionLabel}>Scope</p><h2>Separate evidence</h2><p>Resale and rental observations remain separate. Select a block for reported facts and nearby Google Street View.</p></section>}
    />
  </SingaporePage>;
}
