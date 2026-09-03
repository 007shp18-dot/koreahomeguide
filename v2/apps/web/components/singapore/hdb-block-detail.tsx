import Link from 'next/link';

import type { HdbBlockDisplay } from '../../lib/singapore/hdb-route-model.server';
import { GoogleBuildingStreetView } from '../maps/google-building-street-view';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';

export function HdbBlockDetail({
  block,
  town,
  townHref,
  googleMapsBrowserKey,
}: Readonly<{
  block: HdbBlockDisplay;
  town: string;
  townHref: string;
  googleMapsBrowserKey: string | null;
}>) {
  const address = `${block.address}, Singapore`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return <SingaporePage currentHref="/sg/singapore/explore/" unframed>
    <MarketDetailShell
      breadcrumb={<nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/sg/singapore/explore/">Explore</Link><Link href={townHref}>{town}</Link><span>{block.address}</span></nav>}
      identity={<div className={styles.detailIdentity} data-hdb-block="ready"><p className={styles.eyebrow}>Singapore · HDB block</p><h1>{block.address}</h1><p>{town} · official transaction and property records</p></div>}
      metric={<div className={styles.detailMetric}><small>Resale median</small><strong>{block.resaleMedianLabel ?? 'Not published'}</strong><span>{block.resaleCountLabel} records</span></div>}
      evidence={<><section className={styles.section} aria-labelledby="hdb-block-media-heading">
      <p className={styles.sectionLabel}>01 / Place media</p><h2 id="hdb-block-media-heading">Verified place photo or nearby street context.</h2>
      <GooglePlacePhoto
        browserKey={googleMapsBrowserKey}
        buildingName={block.address}
        address={address}
        fallback={<GoogleBuildingStreetView
          browserKey={googleMapsBrowserKey}
          buildingName={block.address}
          address={address}
          mapHref={mapHref}
        />}
      />
    </section><section className={styles.section} aria-labelledby="hdb-block-evidence-heading">
      <p className={styles.sectionLabel}>02 / Separate distributions</p><h2 id="hdb-block-evidence-heading">Reported HDB evidence.</h2>
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>Resale median</dt><dd>{block.resaleMedianLabel ?? 'Not published'}</dd><small>{block.resaleCountLabel} records</small></div>
        <div className={styles.stat}><dt>Monthly rent median</dt><dd>{block.rentalMedianLabel ?? 'Not published'}</dd><small>{block.rentalCountLabel} records</small></div>
        <div className={styles.stat}><dt>Publication minimum</dt><dd>5</dd><small>per transaction type</small></div>
      </dl>
    </section></>}
      rail={<section className={styles.section} aria-labelledby="hdb-block-facts-heading">
      <p className={styles.sectionLabel}>03 / Property facts</p><h2 id="hdb-block-facts-heading">HDB property information.</h2>
      {block.property === null ? <p>Matched property facts are unavailable for this observed block.</p> : <dl className={styles.stats}>
        <div className={styles.stat}><dt>Year completed</dt><dd>{block.property.yearCompleted}</dd></div>
        <div className={styles.stat}><dt>Maximum floor</dt><dd>{block.property.maxFloorLevel}</dd></div>
        <div className={styles.stat}><dt>Dwelling units</dt><dd>{block.property.totalDwellingUnits}</dd></div>
      </dl>}
    </section>}
    />
  </SingaporePage>;
}
