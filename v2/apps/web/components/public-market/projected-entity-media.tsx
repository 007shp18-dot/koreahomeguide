'use client';
import { useState } from 'react';
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
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (media?.displayUrl && media.displayUrl === failedUrl) return <ProjectedEntityMedia locale={locale} buildingName={buildingName} media={null} evidenceHref={evidenceHref} browserKey={browserKey} registryKey={registryKey} />;
  if (media === null || (media.displayUrl === null && !media.providerReference)) {
    if (registryKey !== undefined) return <GooglePlacePhoto
      locale={locale}
      browserKey={browserKey}
      buildingName={buildingName}
      address=""
      registryKey={registryKey}
      fallback={<ProjectedEntityMedia locale={locale} buildingName={buildingName} media={null} evidenceHref={evidenceHref} />}
    />;
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
      decoding="async"
      onError={() => setFailedUrl(media.displayUrl)}
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
