'use client';
import { localizedMarketCopy } from '../lib/locale/market-localization';


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
      <strong>{ko ? (cityLabel === undefined ? '주택 시장 정보' : `${cityLabel} 주택 시장`) : locale === 'zh-CN' ? (cityLabel === undefined ? '房地产市场信息' : `${cityLabel} 市场信息`) : (cityLabel === undefined ? 'Property market context' : `${cityLabel} market context`)}</strong>
      <span>{localizedMarketCopy(locale, "No approved market photograph is available.", "사용할 수 있는 도시 사진이 없습니다.")}</span>
    </div>
    </div>
    <figcaption className={photoStyles.caption}>{cityLabel === undefined ? null : `${cityLabel} · `}{localizedMarketCopy(locale, "Location context", "지역 정보")}</figcaption>
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
        ? (localizedMarketCopy(locale, "City view", "도시 전경"))
        : (localizedMarketCopy(locale, "Editorial city photograph · not this exact property", "도시 참고 사진 · 해당 매물의 사진이 아닙니다"))}
    </figcaption>
  </figure>;
}
