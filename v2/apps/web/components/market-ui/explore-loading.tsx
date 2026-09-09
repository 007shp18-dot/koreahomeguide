import { SiteHeader } from '../site-header';
import { homepageCopy } from '../../lib/site-copy';
import styles from './explore-loading.module.css';

export function ExploreLoading({ city, locale = 'en' }: Readonly<{ city: string; locale?: 'en' | 'ko' }>) {
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, homeHref: locale === 'ko' ? '/ko/' : '/', marketLabel: city, languageLabel: locale === 'ko' ? 'KO' : 'EN' }} />
    <main className={styles.page} aria-busy="true" data-explore-loading={city}>
      <p className={styles.label}>{city}</p>
      <h1>{locale === 'ko' ? '지역 탐색' : 'Explore'}</h1>
      <p role="status">{locale === 'ko' ? '지역과 가격 정보를 불러오는 중…' : 'Loading areas and prices…'}</p>
      <div className={styles.workspace} aria-hidden="true">
        <div className={styles.results}><i /><i /><i /></div>
        <div className={styles.map} />
      </div>
    </main>
  </>;
}
