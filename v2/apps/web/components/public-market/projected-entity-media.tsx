'use client';
import { useState } from 'react';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
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
}>) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (media?.displayUrl && media.displayUrl === failedUrl) return <ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} address={address} buildingKey={buildingKey} media={null} evidenceHref={evidenceHref} browserKey={browserKey} registryKey={registryKey} fallbackMarket={fallbackMarket} />;
  if (media === null || (media.displayUrl === null && !media.providerReference)) {
    if (registryKey !== undefined) return <GooglePlacePhoto
      locale={locale}
      browserKey={browserKey}
      buildingName={buildingName}
      displayBuildingName={displayBuildingName}
      address={address}
      expectedBuildingKey={buildingKey}
      registryKey={registryKey}
      fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} media={null} evidenceHref={evidenceHref} fallbackMarket={fallbackMarket} />}
    />;
    if (fallbackMarket) return <MarketRepresentativePhoto locale={locale} photo={MARKET_PHOTOS[fallbackMarket]} cityLabel={locale === 'ko'
      ? { seoul: '서울', singapore: '싱가포르', dubai: '두바이', tokyo: '도쿄' }[fallbackMarket]
      : { seoul: 'Seoul', singapore: 'Singapore', dubai: 'Dubai', tokyo: 'Tokyo' }[fallbackMarket]} />;
    return <div className={styles.unavailable} data-photo-state="unavailable">
      <strong>{locale === 'ko' ? '건물 사진 확인 중' : 'Building photo unavailable'}</strong>
      <p>{locale === 'ko' ? '이 건물로 확인된 사진만 제공합니다. 실거래와 건물 정보는 아래에서 확인하세요.' : 'Only photographs verified for this building are shown. Recorded prices and property details are available below.'}</p>
      <a href={evidenceHref}>{locale === 'ko' ? '실거래 보기' : 'View transactions'}</a>
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
    fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} displayBuildingName={displayBuildingName} media={null} evidenceHref={evidenceHref} fallbackMarket={fallbackMarket} />}
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
