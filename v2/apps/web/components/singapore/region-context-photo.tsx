import Image from 'next/image';
import { SINGAPORE_REGION_PHOTOS } from '../../lib/photos/singapore-region-photos';
import styles from './singapore.module.css';

export function RegionContextPhoto({ region, locale = 'en' }: { region: keyof typeof SINGAPORE_REGION_PHOTOS; locale?: 'en' | 'ko' }) {
  const photo = SINGAPORE_REGION_PHOTOS[region];
  return <figure className={styles.regionPhoto} data-photo-scope="regional-context">
    <Image src={photo.src} alt={photo.alt} width={200} height={140} unoptimized />
    <figcaption>{photo.location} · {locale === 'ko' ? '지역 전경' : 'Area view'}
      <details><summary>{locale === 'ko' ? '사진 출처' : 'Photo credit'}</summary><a href={photo.source} rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} rel="noreferrer">{photo.license}</a><span>{locale === 'ko' ? '크기·화면 비율 조정. 현재 검색한 매물의 사진이 아닙니다.' : 'Resized and display-cropped. Not a photograph of the current search results.'}</span></details>
    </figcaption>
  </figure>;
}
