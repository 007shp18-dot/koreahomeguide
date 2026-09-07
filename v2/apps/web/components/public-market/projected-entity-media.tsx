import { GooglePlacePhoto } from '../maps/google-place-photo';
import styles from './projected-entity-media.module.css';

export type ProjectedEntityMediaModel = Readonly<{
  displayUrl: string | null;
  providerReference?: string | null;
  relationship?: 'exact' | 'parent';
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
  attributionName: string | null;
  attributionUrl: string | null;
}>;

export function ProjectedEntityMedia({
  locale = 'en',
  buildingName,
  media,
  browserKey = null,
  evidenceHref = '#building-evidence',
  registryKey,
}: Readonly<{
  locale?: 'en' | 'ko';
  buildingName: string;
  media: ProjectedEntityMediaModel | null;
  browserKey?: string | null;
  evidenceHref?: string;
  registryKey?: string;
}>) {
  if (media === null || (media.displayUrl === null && !media.providerReference)) {
    if (registryKey !== undefined) return <GooglePlacePhoto
      locale={locale}
      browserKey={browserKey}
      buildingName={buildingName}
      address=""
      registryKey={registryKey}
      fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} media={null} evidenceHref={evidenceHref} />}
    />;
    return null;
  }
  if (media.displayUrl === null) return <GooglePlacePhoto
      locale={locale}
    key={media.providerReference}
    browserKey={browserKey}
    buildingName={buildingName}
    address=""
    verifiedPlaceId={media.providerReference!}
    fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} media={null} evidenceHref={evidenceHref} />}
  />;
  const focalX = media.focalX ?? 0.5;
  const focalY = media.focalY ?? 0.5;
  return <figure className={styles.frame} data-building-media="public-projection">
    {/* The server projection exposes only rights-checked, editorially approved URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={media.displayUrl}
      alt={locale === 'ko' ? `${buildingName} 건물 외관` : `${buildingName} building exterior`}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
    />
    <p className={styles.relationship}>{media.relationship === 'parent'
      ? (locale === 'ko' ? '소속 단지 사진' : 'Parent project photograph')
      : (locale === 'ko' ? '확인된 건물 사진' : 'Verified building photograph')}</p>
    {media.attributionName === null ? null : <figcaption>
      {media.attributionUrl === null
        ? media.attributionName
        : <a href={media.attributionUrl} rel="noreferrer">{media.attributionName}</a>}
    </figcaption>}
  </figure>;
}
