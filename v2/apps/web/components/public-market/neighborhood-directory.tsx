import type { ProductLocale } from '../../lib/locale/product-copy';
import { marketHref } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { KoreaNeighborhoodDirectoryEntry } from '@/lib/public-market/korea-building-index-policy';

import styles from './building-directory.module.css';

export function NeighborhoodDirectory({
  locale = 'en',
  districtName,
  entries,
}: Readonly<{
  locale?: ProductLocale;
  districtName: string;
  entries: readonly KoreaNeighborhoodDirectoryEntry[];
}>) {
  if (entries.length === 0) return null;

  return (
    <nav className={styles.directory} aria-labelledby="neighborhood-directory-heading">
      <h2 id="neighborhood-directory-heading">
        {locale === 'ko' ? `${districtName} 동별 건물 목록` : locale === 'zh-CN' ? `${districtName}社区楼盘目录` : `Neighborhood building directories in ${districtName}`}
      </h2>
      <p className={styles.summary}>
        {locale === 'ko' ? `${entries.length}개 동에서 신고 거래가 있는 건물을 확인할 수 있습니다.` : locale === 'zh-CN' ? `${entries.length}个社区有申报交易记录的楼盘。` : `${entries.length} neighborhoods contain buildings with reported transaction histories.`}
      </p>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.neighborhoodId}>
            <Link className={styles.link} href={marketHref(locale, entry.href)}>
              <span className={styles.identity}>
                <strong lang="ko">{entry.name}</strong>
                <span>{locale === 'ko' ? '매매·임대차 거래 이력' : locale === 'zh-CN' ? '买卖与租赁记录' : 'Sale and rental history'}</span>
              </span>
              <span className={styles.contracts}>
                {entry.buildings.toLocaleString(locale)} {locale === 'ko' ? '개 건물' : locale === 'zh-CN' ? '栋楼盘' : 'buildings'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
