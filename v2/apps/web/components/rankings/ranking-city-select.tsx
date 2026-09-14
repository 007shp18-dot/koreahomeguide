'use client';
import { rankingText, rankingPath, type RankingLocale } from '../../lib/rankings/ranking-locale';
import { useRouter } from 'next/navigation';

export function RankingCitySelect({ city, kind, order, locale = 'en' }: { locale?: RankingLocale; city: 'seoul' | 'singapore' | 'dubai' | 'tokyo'; kind: 'sale' | 'rent'; order: 'highest' | 'lowest' }) {
  const t = (text: string) => rankingText(locale,text);
  const router = useRouter();
  return <label>{t("City")}<select name="city" defaultValue={city} onChange={event => {
    const market = event.currentTarget.value;
    router.push(`${rankingPath(locale)}?city=${market}&kind=${market === 'tokyo' || market === 'dubai' ? 'sale' : kind}&order=${market === 'tokyo' ? 'highest' : order}`);
  }}><option value="seoul">{t("Seoul")}</option><option value="singapore">{t("Singapore")}</option><option value="dubai">{t("Dubai")}</option><option value="tokyo">{t("Tokyo")}</option></select></label>;
}
