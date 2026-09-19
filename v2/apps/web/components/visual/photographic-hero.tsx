import type { ReactNode } from 'react';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import type { BuyingCity } from '../../lib/home/buying-journey';
import { HomeSearch } from '../home/home-search';
import styles from './visual-panels.module.css';

export function PhotographicHero({ city, title, description, media, locale }: { city?: BuyingCity; title: string; description: string; media: ReactNode; locale: SiteLocale }) {
  return <header className={styles.cityHero} data-visual-hero="city">
    <div className={styles.cityHeroMedia}>{media}</div>
    <div className={styles.cityHeroCopy}>
      <p className={styles.eyebrow}>EXPLORE CITY / SIGNEDPRICE</p>
      <h1>{title}<span>{locale === 'ko' ? '한눈에 살펴보기' : locale === 'zh-CN' ? '从成交看城市' : 'A place to call home.'}</span></h1>
      <p>{description}</p>
      {city && <div className={styles.citySearch} data-home-search="true"><HomeSearch locale={locale} initialCity={city} /></div>}
    </div>
  </header>;
}
