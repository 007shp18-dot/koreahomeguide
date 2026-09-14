import type { ReactNode } from 'react';
import { rankingText, rankingPath, type RankingLocale } from '../../lib/rankings/ranking-locale';
import type { RankingOrder } from '../../lib/rankings/contract-ranking-query';
import styles from './contract-rankings.module.css';
import { RankingCitySelect } from './ranking-city-select';

export function RankingFields({ city, kind, order, locale = 'en' }: { locale?: RankingLocale; city: 'seoul' | 'singapore' | 'dubai' | 'tokyo'; kind: 'sale' | 'rent'; order: RankingOrder }) {
  const t = (text: string) => rankingText(locale,text);
  return <>
    <RankingCitySelect locale={locale} city={city} kind={kind} order={order} />
    <label>{t("Ranking")}<select name="kind" defaultValue={kind}><option value="sale">{city === 'dubai' ? t("Project median prices") : t("Sales")}</option>{city !== 'tokyo' && city !== 'dubai' && <option value="rent">{t("District rents")}</option>}</select></label>
    <label>{t("Order")}<select name="order" defaultValue={city === 'tokyo' ? 'highest' : order}><option value="highest">{t("Highest first")}</option>{city !== 'tokyo' && <option value="lowest">{t("Lowest first")}</option>}</select></label>
  </>;
}

export function RankingControls(props: { children?: ReactNode; locale?: RankingLocale; city: 'seoul' | 'singapore' | 'dubai' | 'tokyo'; kind: 'sale' | 'rent'; order: RankingOrder }) {
  const locale = props.locale ?? 'en';
  const t = (text: string) => rankingText(locale,text);
  return <form key={`${props.city}-${props.kind}-${props.order}`} className={styles.filters} action={rankingPath(locale)} method="get" aria-label={t('Ranking filters')}><RankingFields {...props} />{props.children}<button type="submit">{t("Show rankings")}</button></form>;
}
