'use client';
import { useState } from 'react';
import Image from 'next/image';
import { dubaiAreaPhoto } from '../../lib/dubai/area-photos';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-area-photo.module.css';

const COPY = {
  en: { view: 'Area view', note: 'Area view · not a property listing', edited: 'Resized and cropped.' },
  ko: { view: '지역 전경', note: '지역 전경 · 개별 매물 사진 아님', edited: '크기 조정 및 자르기.' },
  'zh-CN': { view: '区域实景', note: '区域实景 · 非在售房源照片', edited: '已缩放和裁剪。' },
} as const;

export function DubaiAreaPhoto({ slug, locale, variant }: {
  slug: string;
  locale: MarketLocale;
  variant: 'thumbnail' | 'detail' | 'credit';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const photo = dubaiAreaPhoto(slug);
  if (!photo) return null;
  const copy = COPY[locale];
  const credit = <span className={styles.credit}>
    <a href={photo.source} target="_blank" rel="noreferrer">{photo.author}</a>
    {' · '}<a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>
    {' · '}{copy.edited}
  </span>;
  if (variant === 'credit') return credit;
  const thumbnail = variant === 'thumbnail';
  const src = thumbnail ? photo.thumbnail : photo.detail;
  if (failedSource === src) return null;
  return <figure className={thumbnail ? styles.thumbnail : styles.detail} data-dubai-area-photo={slug}>
    {/* Pre-sized static assets bypass on-demand image transformations. */}
    <Image src={src} onError={() => setFailedSource(src)} alt={`${photo.name} · ${copy.view}`}
      width={thumbnail ? 360 : 960} height={thumbnail ? 240 : 640}
      loading="lazy" decoding="async" unoptimized />
    <figcaption>{thumbnail ? `${copy.view} · ${photo.date.slice(0, 4)}` : <>{copy.note} · {photo.date}{credit}</>}</figcaption>
  </figure>;
}
