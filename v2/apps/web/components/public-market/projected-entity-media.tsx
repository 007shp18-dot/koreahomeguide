import { DataStateNotice } from '../market-ui/data-state';
import styles from './projected-entity-media.module.css';

export type ProjectedEntityMediaModel = Readonly<{
  displayUrl: string;
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
}: Readonly<{
  buildingName: string;
  media: ProjectedEntityMediaModel | null;
}>) {
  if (media === null) {
    return <section className={styles.unavailable} data-building-media="location-only">
      <DataStateNotice
        state="rights-blocked"
        cause="No exact-property photo is approved for public display."
        actionLabel="Continue with property evidence"
        actionHref="#building-evidence"
      />
    </section>;
  }
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
