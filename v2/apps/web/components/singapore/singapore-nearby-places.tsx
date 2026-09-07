import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { singaporeStyles as styles } from './singapore-shell';

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters.toLocaleString('en-SG')} m`
    : `${(distanceMeters / 1_000).toLocaleString('en-SG', { maximumFractionDigits: 1 })} km`;
}

export function SingaporeNearbyPlaces({ proximity }: Readonly<{
  proximity?: PublicEntityProximity | null;
}>) {
  if (proximity === null || proximity === undefined
    || (proximity.nearestStation === null && proximity.nearestSchool === null)) return null;
  return <section className={`${styles.section} ${styles.nearbyPlaces}`} aria-labelledby="singapore-nearby-heading">
    <p className={styles.sectionLabel}>Official location context</p>
    <h2 id="singapore-nearby-heading">Nearby MRT/LRT and schools</h2>
    <p className={styles.nearbyMethod}>Straight-line distance from the mapped property location. Walking routes can differ.</p>
    <dl className={styles.nearbyGrid}>
      {proximity.nearestStation === null ? null : <div>
        <dt>Nearest rail</dt>
        <dd>{proximity.nearestStation.name}</dd>
        <span>{proximity.nearestStation.lines.join(' · ')} · {distanceLabel(proximity.nearestStation.distanceMeters)}</span>
        <small>Land Transport Authority</small>
      </div>}
      {proximity.nearestSchool === null ? null : <div>
        <dt>Nearest MOE school</dt>
        <dd>{proximity.nearestSchool.name}</dd>
        <span>{distanceLabel(proximity.nearestSchool.distanceMeters)}</span>
        <small>Ministry of Education</small>
      </div>}
    </dl>
  </section>;
}
