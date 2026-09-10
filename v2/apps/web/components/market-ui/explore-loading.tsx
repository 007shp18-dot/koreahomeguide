import styles from './explore-loading.module.css';

export function ExploreLoading({ city, locale = 'en' }: Readonly<{ city: string; locale?: 'en' | 'ko' }>) {
  return <main className={styles.page} aria-busy="true" data-explore-loading={city}>
      <p className={styles.label}>{city}</p>
      <h1>{locale === 'ko' ? '지역 탐색 준비 중' : 'Preparing Explore'}</h1>
      <p role="status">{locale === 'ko' ? '지역과 가격 정보를 불러오는 중…' : 'Loading areas and prices…'}</p>
      <div className={styles.workspace} aria-hidden="true">
        <div className={styles.results}><i /><i /><i /></div>
        <div className={styles.map} />
      </div>
    </main>;
}
