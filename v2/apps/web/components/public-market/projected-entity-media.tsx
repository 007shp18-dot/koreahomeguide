import Link from 'next/link';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import styles from './projected-entity-media.module.css';

export type ProjectedEntityMediaModel = Readonly<{
  displayUrl: string | null;
  providerReference?: string | null;
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
  attributionName: string | null;
  attributionUrl: string | null;
}>;

export function ProjectedEntityMedia({
  buildingName,
  media,
  browserKey = null,
  evidenceHref = '#building-evidence',
}: Readonly<{
  buildingName: string;
  media: ProjectedEntityMediaModel | null;
  browserKey?: string | null;
  evidenceHref?: string;
}>) {
  if (media === null || (media.displayUrl === null && !media.providerReference)) {
    return <section className={styles.unavailable} data-building-media="location-only" data-photo-state="unavailable" aria-label="Building photo unavailable">
      <strong>Building photo unavailable</strong>
      <p>No rights-cleared exterior photo is connected to this building yet.</p>
      <Link href={evidenceHref}>Continue with property evidence</Link>
    </section>;
  }
  if (media.displayUrl === null) return <GooglePlacePhoto
    key={media.providerReference}
    browserKey={browserKey}
    buildingName={buildingName}
    address=""
    verifiedPlaceId={media.providerReference!}
    fallback={<ProjectedEntityMedia buildingName={buildingName} media={null} evidenceHref={evidenceHref} />}
  />;
  const focalX = media.focalX ?? 0.5;
  const focalY = media.focalY ?? 0.5;
  return <figure className={styles.frame} data-building-media="public-projection">
    {/* The server projection exposes only rights-checked, editorially approved URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={media.displayUrl}
      alt={`${buildingName} building exterior`}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
    />
    {media.attributionName === null ? null : <figcaption>
      {media.attributionUrl === null
        ? media.attributionName
        : <a href={media.attributionUrl} rel="noreferrer">{media.attributionName}</a>}
    </figcaption>}
  </figure>;
}
