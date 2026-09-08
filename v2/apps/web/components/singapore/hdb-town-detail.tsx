
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { HdbTownModel } from '../../lib/singapore/hdb-route-model.server';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';

export function HdbTownDetail({ locale = 'en', model }: Readonly<{ locale?: MarketLocale; model: HdbTownModel }>) {
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
    <MarketDetailShell locale={locale}
      breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}><Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link><span>{model.town}</span></nav>}
      identity={<div className={styles.detailIdentity} data-hdb-town="ready"><p className={styles.eyebrow}>{sgText(locale, "Singapore · HDB town")}</p><h1>{model.town}</h1></div>}
      metric={<div className={styles.detailMetric}><small>{sgText(locale, "Observed blocks")}</small><strong>{sgText(locale, model.blocks.length)}</strong><span>{sgText(locale, "HDB evidence")}</span><span>{locale === 'ko' ? '재판매' : 'Resale'} · {model.resalePeriod ?? (locale === 'ko' ? '집계 기간 미제공' : 'Reporting period unavailable')}</span><span>{locale === 'ko' ? '월세' : 'Monthly rent'} · {model.rentalPeriod ?? (locale === 'ko' ? '집계 기간 미제공' : 'Reporting period unavailable')}</span></div>}
      evidence={<section className={styles.section} aria-labelledby="hdb-blocks-heading">
      <p className={styles.sectionLabel}>{sgText(locale, "01 / Observed blocks")}</p>
      <h2 id="hdb-blocks-heading">{sgText(locale, model.blocks.length)}{sgText(locale, " blocks with HDB evidence.")}</h2>
      <div className={styles.tableWrap}><table className={`${styles.table} ${styles.hdbTable}`}>
        <thead><tr><th>{sgText(locale, "Block")}</th><th>{sgText(locale, "Resale median")}</th><th>{sgText(locale, "Resale n")}</th><th>{sgText(locale, "Monthly rent median")}</th><th>{sgText(locale, "Rental n")}</th></tr></thead>
        <tbody>{model.blocks.map((block) => <tr key={block.blockId}>
          <th scope="row"><Link href={marketHref(locale, block.href)}>{block.address}</Link></th>
          <td>{sgText(locale, block.resaleMedianLabel ?? 'Not published')}</td><td>{sgText(locale, block.resaleCountLabel)}</td>
          <td>{sgText(locale, block.rentalMedianLabel ?? 'Not published')}</td><td>{sgText(locale, block.rentalCountLabel)}</td>
        </tr>)}</tbody>
      </table></div>
      </section>}
      rail={<section className={styles.section}><p className={styles.sectionLabel}>{sgText(locale, "Scope")}</p><h2>{sgText(locale, "Separate evidence")}</h2><p>{sgText(locale, "Resale and rental observations remain separate. Select a block for reported facts and nearby Google Street View.")}</p></section>}
    />
  </SingaporePage>;
}
