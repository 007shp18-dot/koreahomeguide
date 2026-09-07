
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { singaporeStyles as styles } from './singapore-shell';

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters.toLocaleString('en-SG')} m`
    : `${(distanceMeters / 1_000).toLocaleString('en-SG', { maximumFractionDigits: 1 })} km`;
}

export function SingaporeNearbyPlaces({ locale = 'en', proximity }: Readonly<{ locale?: MarketLocale;
  proximity?: PublicEntityProximity | null;
}>) {
  if (proximity === null || proximity === undefined
    || (proximity.nearestStation === null && proximity.nearestSchool === null)) return null;
  return <section className={`${styles.section} ${styles.nearbyPlaces}`} aria-labelledby="singapore-nearby-heading">
    <p className={styles.sectionLabel}>{sgText(locale, "Official location context")}</p>
    <h2 id="singapore-nearby-heading">{sgText(locale, "Nearby MRT/LRT and schools")}</h2>
    <p className={styles.nearbyMethod}>{sgText(locale, "Straight-line distance from the mapped property location. Walking routes can differ.")}</p>
    <dl className={styles.nearbyGrid}>
      {proximity.nearestStation === null ? null : <div>
        <dt>{sgText(locale, "Nearest rail")}</dt>
        <dd>{proximity.nearestStation.name}</dd>
        <span>{sgText(locale, proximity.nearestStation.lines.join(' · '))}{sgText(locale, " · ")}{sgText(locale, distanceLabel(proximity.nearestStation.distanceMeters))}</span>
        <small>{sgText(locale, "Land Transport Authority")}</small>
      </div>}
      {proximity.nearestSchool === null ? null : <div>
        <dt>{sgText(locale, "Nearest MOE school")}</dt>
        <dd>{proximity.nearestSchool.name}</dd>
        <span>{sgText(locale, distanceLabel(proximity.nearestSchool.distanceMeters))}</span>
        <small>{sgText(locale, "Ministry of Education")}</small>
      </div>}
    </dl>
  </section>;
}
