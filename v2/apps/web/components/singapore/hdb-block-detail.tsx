
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { HdbBlockDisplay } from '../../lib/singapore/hdb-route-model.server';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import { ProjectedEntityMedia } from '../public-market/projected-entity-media';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';
import { SingaporeNearbyPlaces } from './singapore-nearby-places';

export function HdbBlockDetail({ locale = 'en',
  block,
  town,
  townHref,
  googleMapsBrowserKey,
  proximity = null,
}: Readonly<{ locale?: MarketLocale;
  block: HdbBlockDisplay;
  town: string;
  townHref: string;
  googleMapsBrowserKey: string | null;
  proximity?: PublicEntityProximity | null;
}>) {
  const address = `${block.address}, Singapore`;
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
    <MarketDetailShell locale={locale}
      breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}><Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link><Link href={marketHref(locale, townHref)}>{town}</Link><span>{block.address}</span></nav>}
      identity={<div className={styles.detailIdentity} data-hdb-block="ready"><p className={styles.eyebrow}>{sgText(locale, "Singapore · HDB block")}</p><h1>{block.address}</h1><p>{town}{sgText(locale, " · official transaction and property records")}</p></div>}
      metric={<div className={styles.detailMetric}><small>{sgText(locale, "Resale median")}</small><strong>{sgText(locale, block.resaleMedianLabel ?? 'Not published')}</strong><span>{sgText(locale, block.resaleCountLabel)}{sgText(locale, " records")} · {block.resalePeriod ?? (locale === 'ko' ? '집계 기간 미제공' : 'Reporting period unavailable')}</span></div>}
      media={<GooglePlacePhoto locale={locale}
        browserKey={googleMapsBrowserKey}
        buildingName={block.address}
        address={address}
        registryKey={`sg-hdb:${town}:${block.address}`}
        fallback={<ProjectedEntityMedia locale={locale} buildingName={block.address} media={null} evidenceHref="#hdb-block-evidence-heading" />}
      />}
      evidence={<><section className={styles.section} aria-labelledby="hdb-block-evidence-heading">
      <p className={styles.sectionLabel}>{sgText(locale, "02 / Separate distributions")}</p><h2 id="hdb-block-evidence-heading">{sgText(locale, "Reported HDB evidence.")}</h2>
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Monthly rent median")}</dt><dd>{sgText(locale, block.rentalMedianLabel ?? 'Not published')}</dd><small>{sgText(locale, block.rentalCountLabel)}{sgText(locale, " records")} · {block.rentalPeriod ?? (locale === 'ko' ? '집계 기간 미제공' : 'Reporting period unavailable')}</small></div>
        <div className={styles.stat}><dt>{sgText(locale, "Publication minimum")}</dt><dd>{sgText(locale, "5")}</dd><small>{sgText(locale, "per transaction type")}</small></div>
      </dl>
    </section><SingaporeNearbyPlaces locale={locale} proximity={proximity} /></>}
      rail={<section className={styles.section} aria-labelledby="hdb-block-facts-heading">
      <p className={styles.sectionLabel}>{sgText(locale, "03 / Property facts")}</p><h2 id="hdb-block-facts-heading">{sgText(locale, "HDB property information.")}</h2>
      {block.property === null ? <p>{sgText(locale, "Matched property facts are unavailable for this observed block.")}</p> : <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Year completed")}</dt><dd>{sgText(locale, block.property.yearCompleted)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Maximum floor")}</dt><dd>{sgText(locale, block.property.maxFloorLevel)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Dwelling units")}</dt><dd>{sgText(locale, block.property.totalDwellingUnits)}</dd></div>
      </dl>}
    </section>}
    />
  </SingaporePage>;
}
