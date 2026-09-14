'use client';
import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { cityPaths } from '@/lib/global-shortlist/model';
import { parseGlobalSaved, readGlobalSaved, subscribeGlobalSaved } from '@/lib/global-shortlist/storage';
import { parseSavedSearch, readSavedSearch, subscribeSavedSearch } from '@/lib/seoul-shortlist/storage';
import { shortlistHref, type ShortlistLocale } from './copy';
import styles from './saved-cities.module.css';
import { ResearchNote } from '../discovery/research-note';
import { actualDetailHref, reviewLocation } from '../../lib/research/property-review-locations';
import { parseReviewSaved, readReviewSaved, subscribeReviewSaved, toggleReviewSaved } from '../../lib/research/property-review-saved';
import { RecentPlaces } from '../discovery/recent-places';

const empty = () => '';
type City = keyof typeof cityPaths;
type Place = { market: City; key: string; name: string; detailHref?: string; reviewId?: string };
const cityNames = { seoul:['Seoul','서울','首尔'], singapore:['Singapore','싱가포르','新加坡'], dubai:['Dubai','두바이','迪拜'], tokyo:['Tokyo','도쿄','东京'] } as const;
function cityName(city: City, locale: ShortlistLocale) { return cityNames[city][locale === 'ko' ? 1 : locale === 'zh-CN' ? 2 : 0]; }
function cityHref(city: City, locale: ShortlistLocale) {
  return shortlistHref(locale, cityPaths[city]);
}

export function buildSavedPlaces({ globalRaw, seoulRaw, reviewRaw, locale }: {
  globalRaw: string; seoulRaw: string; reviewRaw: string; locale: ShortlistLocale;
}): Place[] {
  const lang = locale === 'ko' ? 'ko' : 'en';
  const reviewCities: Record<string, City> = { kr: 'seoul', sg: 'singapore', ae: 'dubai', jp: 'tokyo' };
  const reviews = parseReviewSaved(reviewRaw).flatMap(reviewId => {
    const market = reviewCities[reviewId.split('-')[0]!];
    if (!market) return [];
    const location = reviewLocation(reviewId);
    const href = actualDetailHref(locale, reviewId);
    return [{
      market, key: reviewId, reviewId,
      name: location?.name?.[lang] ?? (locale === 'ko' ? '현재 제공되지 않는 단지' : locale === 'zh-CN' ? '该住宅目前不可用' : 'Property currently unavailable'),
      ...(href ? { detailHref: `${href}#property-review` } : {}),
    }];
  });
  return [
    ...parseSavedSearch(seoulRaw).buildings.map(place => ({ ...place, market: 'seoul' as const })),
    ...parseGlobalSaved(globalRaw).places,
    ...reviews,
  ];
}

export function SavedPlacesView({ locale, places, city, onCityChange }: { locale: ShortlistLocale; places: readonly Place[]; city: string; onCityChange: (city: string) => void }) {
  const ko=locale === 'ko', zh=locale === 'zh-CN';
  const visible = places.filter(place => city === 'all' || place.market === city);
  return <div className={styles.content}>
    <nav className={styles.cities} aria-label={ko ? '저장 목록 도시 선택' : zh ? '筛选收藏城市' : 'Filter saved cities'}>
      <button type="button" aria-pressed={city === 'all'} onClick={() => onCityChange('all')}>{ko ? '전체' : zh ? '全部' : 'All'} <span>{places.length}</span></button>
      {(Object.keys(cityPaths) as City[]).map(key => <button key={key} type="button" aria-pressed={city === key} onClick={() => onCityChange(key)}>{cityName(key,locale)} <span>{places.filter(place => place.market === key).length}</span></button>)}
    </nav>
    <p className={styles.note}>{ko ? '이 브라우저에 저장한 관심 목록입니다. 저장한 단지나 예산 후보를 열어 탐색을 이어가세요.' : zh ? '收藏仅保存在此浏览器。打开已收藏的住宅项目或预算候选，继续探索。' : 'Your shortlist stays in this browser. Open a saved property or budget candidate to continue exploring.'}</p>
    {visible.length ? <ul className={styles.list}>{visible.map(place => <li key={place.market+':'+place.key}><Link href={place.detailHref ?? cityHref(place.market,locale) + '#saved-title'}>
      <span><small>{cityName(place.market,locale)} · {place.reviewId ? (ko ? '단지' : zh ? '住宅项目' : 'Property') : place.market === 'tokyo' || place.market === 'dubai' ? (ko ? '지역' : zh ? '地区' : 'Area') : (ko ? '주택' : zh ? '住宅' : 'Home')}</small><strong>{place.name}</strong></span>
      <span className={styles.open}>{ko ? '보기' : zh ? '查看' : 'Review'} <span aria-hidden="true">↗</span></span>
    </Link>{place.reviewId ? <button type="button" className={styles.open} onClick={() => toggleReviewSaved(place.reviewId!)} aria-label={`${ko ? '단지 저장 해제' : zh ? '取消住宅收藏' : 'Remove saved property'}: ${place.name}`}>{ko ? '저장 해제' : zh ? '取消收藏' : 'Remove saved'}</button> : null}<ResearchNote market={place.market} placeKey={place.key} placeName={place.name} locale={locale} /></li>)}</ul> : <div className={styles.empty}>
      <span className={styles.bookmark} aria-hidden="true"><UiIcon name="bookmark" /></span>
      <h3>{ko ? '관심 있는 곳부터 모아보세요' : zh ? '尚未收藏，先找到感兴趣的地方' : 'Start with a place worth revisiting'}</h3>
      <p>{ko ? '예산으로 지역·단지를 찾아 저장하면 이곳에서 다시 볼 수 있어요.' : zh ? '按预算寻找地区或楼盘，收藏后即可在此继续查看。' : 'Find an area or project within your budget, save it, and pick up your research here.'}</p>
      <Link href={city === 'all' ? shortlistHref(locale,'/tools/') : cityHref(city as City,locale)}>{ko ? '관심 지역 찾기' : zh ? '寻找感兴趣的地区' : 'Find places to save'} →</Link>
    </div>}
  </div>;
}

export function SavedCities({ locale = 'en', initiallyOpen = false }: { locale?: ShortlistLocale; initiallyOpen?: boolean }) {
  const [city, setCity] = useState('all');
  const globalRaw = useSyncExternalStore(subscribeGlobalSaved, readGlobalSaved, empty);
  const seoulRaw = useSyncExternalStore(subscribeSavedSearch, readSavedSearch, empty);
  const reviewRaw = useSyncExternalStore(subscribeReviewSaved, readReviewSaved, empty);
  const places = useMemo(() => buildSavedPlaces({ globalRaw, seoulRaw, reviewRaw, locale }), [globalRaw,seoulRaw,reviewRaw,locale]);
  const view = <SavedPlacesView locale={locale} places={places} city={city} onCityChange={setCity} />;
  if (initiallyOpen) return <section className={styles.saved} aria-label={locale === 'ko' ? '관심 목록' : locale === 'zh-CN' ? '收藏' : 'Saved places'}><RecentPlaces locale={locale} market={city === 'all' ? undefined : city as City} />{view}</section>;
  return <details className={styles.saved}><summary>{locale === 'ko' ? '모든 도시 관심 목록' : locale === 'zh-CN' ? '所有城市的收藏' : 'Saved across cities'} · {places.length}</summary>{view}</details>;
}

export function ShortlistCities({ current, locale = 'en' }: { current: City; locale?: ShortlistLocale }) {
  return <nav className={styles.cities} aria-label={locale === 'ko' ? '도시별 예산 검색' : locale === 'zh-CN' ? '按城市筛选预算' : 'Budget search by city'}>{(Object.keys(cityPaths) as City[]).map(city => <Link key={city} href={cityHref(city,locale)} aria-current={current === city ? 'page' : undefined}>{cityName(city,locale)}</Link>)}</nav>;
}
