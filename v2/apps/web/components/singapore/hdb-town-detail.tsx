import Link from 'next/link';

import type { HdbTownModel } from '../../lib/singapore/hdb-route-model.server';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';

export function HdbTownDetail({ model }: Readonly<{ model: HdbTownModel }>) {
  return <SingaporePage>
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link href="/sg/singapore/explore/">Explore</Link><span>{model.town}</span>
    </nav>
    <header className={styles.hero} data-hdb-town="ready" data-product-intro="true">
      <p className={styles.eyebrow}>Singapore · HDB town</p>
      <h1>{model.town} block evidence.</h1>
      <p>Resale and rental observations remain separate. Select a block for reported facts and nearby Google Street View.</p>
    </header>
    <section className={styles.section} aria-labelledby="hdb-blocks-heading">
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
    </section>
  </SingaporePage>;
}
