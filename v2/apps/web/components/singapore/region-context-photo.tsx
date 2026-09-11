import { localizedMarketCopy } from '../../lib/locale/market-localization';
import Image from 'next/image';
import { SINGAPORE_REGION_PHOTOS } from '../../lib/photos/singapore-region-photos';
import styles from './singapore.module.css';

export function RegionContextPhoto({ region, locale = 'en' }: { region: keyof typeof SINGAPORE_REGION_PHOTOS; locale?: 'en' | 'ko' | 'zh-CN' }) {
  const photo = SINGAPORE_REGION_PHOTOS[region];
  return <figure className={styles.regionPhoto} data-photo-scope="regional-context">
    <Image src={photo.src} alt={photo.alt} width={200} height={140} unoptimized />
    <figcaption>{photo.location} · {localizedMarketCopy(locale, "Area view", "지역 전경")}
      <details><summary>{localizedMarketCopy(locale, "Photo credit", "사진 출처")}</summary><a href={photo.source} rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} rel="noreferrer">{photo.license}</a><span>{localizedMarketCopy(locale, "Resized and display-cropped. Not a photograph of the current search results.", "크기·화면 비율 조정. 현재 검색한 매물의 사진이 아닙니다.")}</span></details>
    </figcaption>
  </figure>;
}
