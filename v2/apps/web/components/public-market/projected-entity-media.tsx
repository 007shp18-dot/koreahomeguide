'use client';
import { useState } from 'react';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import type { MARKET_PHOTOS } from '../market-representative-photo';
import styles from './projected-entity-media.module.css';
import photoStyles from '../maps/property-photo.module.css';

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
  sourcePageUrl?: string | null;
}>;

export function ProjectedEntityMedia({
  locale = 'en',
  buildingName,
  displayBuildingName = buildingName,
  address = '',
  buildingKey,
  media,
  browserKey = null,
  evidenceHref = '#building-evidence',
  registryKey,
  fallbackMarket,
  locationHref,
}: Readonly<{
  locale?: 'en' | 'ko';
  buildingName: string;
  displayBuildingName?: string;
  address?: string;
  buildingKey?: string;
  media: ProjectedEntityMediaModel | null;
  browserKey?: string | null;
  evidenceHref?: string;
  registryKey?: string;
  fallbackMarket?: keyof typeof MARKET_PHOTOS;
  locationHref?: string;
}>) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (media?.displayUrl && media.displayUrl === failedUrl) return <ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} address={address} buildingKey={buildingKey} media={null} evidenceHref={evidenceHref} browserKey={browserKey} registryKey={registryKey} fallbackMarket={fallbackMarket} locationHref={locationHref} />;
  if (media === null || (media.displayUrl === null && !media.providerReference)) {
    if (registryKey !== undefined) return <GooglePlacePhoto
      locale={locale}
      browserKey={browserKey}
      buildingName={buildingName}
      displayBuildingName={displayBuildingName}
      address={address}
      expectedBuildingKey={buildingKey}
      registryKey={registryKey}
      fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} address={address} media={null} evidenceHref={evidenceHref} fallbackMarket={fallbackMarket} locationHref={locationHref} />}
    />;
    const city = fallbackMarket ? { seoul: 'Seoul', singapore: 'Singapore', dubai: 'Dubai', tokyo: 'Tokyo' }[fallbackMarket] : '';
    const mapHref = locationHref ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([buildingName, address, city].filter(Boolean).join(', '))}`;
    return <div className={styles.unavailable} data-photo-state="unavailable" data-location-fallback="true">
      <div>
        <strong>{displayBuildingName}</strong>
        {address ? <p>{address}</p> : null}
        <p>{locale === 'ko' ? '확인된 건물 사진이 아직 없습니다.' : 'A verified building photograph is not available yet.'}</p>
      </div>
      <a href={mapHref}>{locale === 'ko' ? '지도에서 위치 확인' : 'View location on map'}</a>
    </div>;
  }
  if (media.displayUrl === null) return <GooglePlacePhoto
      locale={locale}
    key={media.providerReference}
    browserKey={browserKey}
    buildingName={buildingName}
    displayBuildingName={displayBuildingName}
    address={address}
    expectedBuildingKey={buildingKey}
    verifiedSubjectKind={media.relationship === 'parent' ? 'site-aerial' : 'building-exterior'}
    verifiedPlaceId={media.providerReference!}
    fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} address={address} media={null} evidenceHref={evidenceHref} fallbackMarket={fallbackMarket} locationHref={locationHref} />}
  />;
  const focalX = media.focalX ?? 0.5;
  const focalY = media.focalY ?? 0.5;
  return <figure className={photoStyles.frame} data-building-media="public-projection">
    <div className={photoStyles.stage}>
    {/* The server projection exposes only rights-checked, editorially approved URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={media.displayUrl}
      decoding="async"
      onError={() => setFailedUrl(media.displayUrl)}
      alt={media.relationship === 'parent'
        ? (locale === 'ko' ? `${displayBuildingName} 단지 전경` : `${displayBuildingName} project view`)
        : (locale === 'ko' ? `${displayBuildingName} 건물 외관` : `${displayBuildingName} building exterior`)}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
    />
    </div>
    <figcaption className={photoStyles.caption}>
    <span className={photoStyles.relationship}>{media.relationship === 'parent'
      ? (locale === 'ko' ? '소속 단지 사진' : 'Parent project photograph')
      : (locale === 'ko' ? '확인된 건물 사진' : 'Verified building photograph')}</span>
    <span className={photoStyles.credit}>
      {media.attributionName === null ? null : media.attributionUrl === null
        ? media.attributionName
        : <a href={media.attributionUrl} rel="noreferrer">{media.attributionName}</a>}
      {media.sourcePageUrl && media.sourcePageUrl !== media.attributionUrl
        ? <a href={media.sourcePageUrl} rel="noreferrer">{locale === 'ko' ? '원본 사진' : 'Photo source'}</a> : null}
    </span>
    </figcaption>
  </figure>;
}
