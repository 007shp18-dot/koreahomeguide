'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { MarketRepresentativePhotoProps } from './market-representative-photo';
import styles from './market-representative-photo.module.css';
import photoStyles from './maps/property-photo.module.css';

export default function MarketRepresentativePhotoFrame({ photo, eager = false, cityLabel, context = 'property', locale = 'en' }: MarketRepresentativePhotoProps) {
  const ko = locale === 'ko';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (photo == null || photo.src === failedSrc) return <figure className={photoStyles.frame} data-building-media="market-context-fallback">
    <div className={photoStyles.stage}>
    <div className={styles.fallback}>
      <strong>{ko ? (cityLabel === undefined ? '주택 시장 정보' : `${cityLabel} 주택 시장`) : (cityLabel === undefined ? 'Property market context' : `${cityLabel} market context`)}</strong>
      <span>{ko ? '사용할 수 있는 도시 사진이 없습니다.' : 'No approved market photograph is available.'}</span>
    </div>
    </div>
    <figcaption className={photoStyles.caption}>{cityLabel === undefined ? null : `${cityLabel} · `}{ko ? '지역 정보' : 'Location context'}</figcaption>
  </figure>;

  return <figure className={photoStyles.frame} data-building-media="curated-market-photo">
    <div className={photoStyles.stage}>
    {/* These are stable editorial market images, not a claim about a specific listing. */}
    <Image
      alt={photo.alt}
      src={photo.src}
      fill
      priority={eager}
      sizes="(max-width: 850px) 100vw, 55vw"
      onError={() => setFailedSrc(photo.src)}
      style={{ objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }}
    />
    </div>
    <figcaption className={photoStyles.caption}>
      {cityLabel === undefined ? null : `${cityLabel} · `}
      {context === 'city'
        ? (ko ? '도시 전경' : 'City view')
        : (ko ? '도시 참고 사진 · 해당 매물의 사진이 아닙니다' : 'Editorial city photograph · not this exact property')}
    </figcaption>
  </figure>;
}
