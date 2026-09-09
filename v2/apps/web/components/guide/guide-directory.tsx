import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import { guideDirectory, type GuideLocale, type GuideMarket } from '../../content/guide-directory';
import styles from './guide-directory.module.css';

export function GuideDirectory({ locale = 'en', market = 'all' }: Readonly<{ locale?: GuideLocale; market?: GuideMarket }>) {
  const ko = locale === 'ko';
  const base = ko ? '/ko' : '';
  const entries = guideDirectory(locale, market);
  const cities = { all: ko ? '전체' : 'All cities', seoul: ko ? '서울' : 'Seoul', singapore: ko ? '싱가포르' : 'Singapore', dubai: ko ? '두바이' : 'Dubai' };
  const groups = [
    { id: 'buy', title: ko ? '주택 매수' : 'Buying a home', description: ko ? '매수 자격부터 비용과 계약 절차까지.' : 'Eligibility, costs and the steps to ownership.' },
    { id: 'rent', title: ko ? '한국에서 집 구하기' : 'Renting in Korea', description: ko ? '전세·월세 선택부터 보증금과 입주 준비까지.' : 'From choosing a rental to paying the deposit and moving in.' },
  ];
  return <main className={styles.page} lang={locale}>
    <header className={styles.heading}>
      <p className={styles.eyebrow}>{ko ? 'GUIDES' : 'PRACTICAL GUIDES'}</p>
      <h1>{ko ? '매수·임대차 가이드' : 'Buying & renting guides'}</h1>
      <p>{ko ? '집을 사거나 빌리기 전, 필요한 비용과 서류부터 계약·입주 절차까지 확인하세요.' : 'Plan the costs, check the paperwork and work through the steps before signing.'}</p>
      <Link href={`${base}/news/`}>{ko ? '도시 이야기와 시장 분석은 뉴스 & 인사이트에서' : 'For city stories and market analysis, visit News & Insights'}</Link>
    </header>
    <nav className={styles.filters} aria-label={ko ? '가이드 도시' : 'Guide markets'}>{(Object.keys(cities) as GuideMarket[]).map(city => <Link key={city} href={`${base}/guides/${city === 'all' ? '' : `?market=${city}`}`} aria-current={market === city ? 'page' : undefined}>{cities[city]}</Link>)}</nav>
    {groups.map(group => {
      const selected = entries.filter(entry => entry.group === group.id);
      if (!selected.length) return null;
      return <section className={styles.section} key={group.id} aria-labelledby={`guide-${group.id}`}>
        <header><h2 id={`guide-${group.id}`}>{group.title}</h2><p>{group.description}</p></header>
        <ol className={styles.rows}>{selected.map(entry => <li key={entry.id}>
          <Link className={styles.entry} href={entry.href}>
            <span className={styles.city}>{cities[entry.city]}</span>
            <div><h3>{entry.title}</h3><p>{entry.deck}</p></div>
            <UiIcon name="arrow-right" className={styles.arrow} />
          </Link>
        </li>)}</ol>
      </section>;
    })}
  </main>;
}
