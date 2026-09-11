import { localizedMarketCopy } from '../../lib/locale/market-localization';
import styles from './explore-loading.module.css';

export function ExploreLoading({ city, locale = 'en' }: Readonly<{ city: string; locale?: 'en' | 'ko' | 'zh-CN' }>) {
  return <main className={styles.page} aria-busy="true" data-explore-loading={city}>
      <p className={styles.label}>{city}</p>
      <h1>{localizedMarketCopy(locale, "Preparing Explore", "지역 탐색 준비 중")}</h1>
      <p role="status">{localizedMarketCopy(locale, "Loading areas and prices…", "지역과 가격 정보를 불러오는 중…")}</p>
      <div className={styles.workspace} aria-hidden="true">
        <div className={styles.results}><i /><i /><i /></div>
        <div className={styles.map} />
      </div>
    </main>;
}
