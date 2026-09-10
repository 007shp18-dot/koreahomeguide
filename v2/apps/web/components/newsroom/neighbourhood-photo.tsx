import Image from 'next/image';
import photos from '../../content/neighbourhood-photos.json';
import type { NeighbourhoodPhotoId } from '../../content/journey-article-photos';
import styles from './journey-article.module.css';

export { PHOTO_ESSAYS, type NeighbourhoodPhotoId } from '../../content/journey-article-photos';

export function NeighbourhoodPhoto({ id, eager = false }: Readonly<{ id: NeighbourhoodPhotoId; eager?: boolean }>) {
  const photo = photos[id];
  return <figure className={styles.scenePhoto} data-neighbourhood-photo={id}>
    <Image src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} sizes="(max-width: 740px) calc(100vw - 40px), 900px" />
    <figcaption>{photo.caption}<details className={styles.photoCredit}><summary>Photo credit</summary><span><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseHref} target="_blank" rel="noopener noreferrer">{photo.license}</a></span></details></figcaption>
  </figure>;
}
