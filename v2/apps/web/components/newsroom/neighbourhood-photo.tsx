import Image from 'next/image';
import photos from '../../content/neighbourhood-photos.json';
import type { NeighbourhoodPhotoId } from '../../content/journey-article-photos';
import styles from './journey-article.module.css';

export { PHOTO_ESSAYS, type NeighbourhoodPhotoId } from '../../content/journey-article-photos';

export function NeighbourhoodPhoto({ id, eager = false, context = false, locale = 'en' }: Readonly<{ id: NeighbourhoodPhotoId; eager?: boolean; context?: boolean; locale?: 'en' | 'ko' | 'zh-CN' }>) {
  const photo = photos[id];
  return <figure className={styles.scenePhoto} data-neighbourhood-photo={id}>
    <Image src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} sizes="(max-width: 740px) calc(100vw - 40px), 900px" />
    <figcaption>{photo.caption}{context ? (locale === 'ko' ? ' · 도시 배경 사진' : locale === 'zh-CN' ? ' · 城市背景图片' : ' · City context') : ''}<details className={styles.photoCredit}><summary>{locale === 'ko' ? '사진 출처' : locale === 'zh-CN' ? '图片来源' : 'Photo credit'}</summary><span><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseHref} target="_blank" rel="noopener noreferrer">{photo.license}</a></span></details></figcaption>
  </figure>;
}
