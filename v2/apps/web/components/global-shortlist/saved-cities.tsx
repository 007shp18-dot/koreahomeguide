'use client';
import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { cityPaths } from '@/lib/global-shortlist/model';
import { parseGlobalSaved, readGlobalSaved, subscribeGlobalSaved } from '@/lib/global-shortlist/storage';
import { parseSavedSearch, readSavedSearch, subscribeSavedSearch } from '@/lib/seoul-shortlist/storage';
import { shortlistHref, type ShortlistLocale } from './copy';
import styles from '../seoul-shortlist/shortlist.module.css';
const empty = () => '';
export function SavedCities({ locale = 'en', initiallyOpen = false }: { locale?: ShortlistLocale; initiallyOpen?: boolean }) {
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const [city, setCity] = useState('all');
  const globalRaw = useSyncExternalStore(subscribeGlobalSaved, readGlobalSaved, empty);
  const seoulRaw = useSyncExternalStore(subscribeSavedSearch, readSavedSearch, empty);
  const places = useMemo(() => [...parseSavedSearch(seoulRaw).buildings.map(p => ({ ...p, market: 'seoul' as const })), ...parseGlobalSaved(globalRaw).places], [globalRaw, seoulRaw]);
  return <details className={styles.savedCities} open={initiallyOpen}><summary>{ko ? '모든 도시 관심 목록' : zh ? '所有城市的收藏' : 'Saved across cities'} · {places.length}</summary>
    <label>{ko ? '도시 선택' : zh ? '城市' : 'City'} <select value={city} onChange={e => setCity(e.target.value)}><option value="all">{ko ? '전체' : zh ? '所有城市' : 'All cities'}</option>{Object.keys(cityPaths).map(c => <option key={c} value={c}>{c === 'seoul' ? 'Seoul' : c === 'singapore' ? 'Singapore' : c === 'tokyo' ? 'Tokyo' : 'Dubai'}</option>)}</select></label>
    <p className={styles.meta}>{ko ? '이 브라우저에 저장한 목록입니다. 해당 도시에서 거래 변화 확인과 관심 해제를 할 수 있습니다.' : zh ? '仅保存在此浏览器。选择城市查看交易更新或取消收藏。' : 'Saved in this browser. Open a city to check evidence updates or remove saved places.'}</p>
    <ul>{places.filter(p => city === 'all' || city === p.market).map(p => <li key={`${p.market}:${p.key}`}><Link href={shortlistHref(locale, `${cityPaths[p.market]}#saved-title`)}>{p.name} · {p.market === 'seoul' ? 'Seoul' : p.market === 'singapore' ? 'Singapore' : p.market === 'tokyo' ? 'Tokyo' : 'Dubai'}</Link></li>)}</ul>
    {!places.some(p => city === 'all' || city === p.market) && <p>{ko ? '저장한 항목이 없습니다.' : zh ? '当前筛选没有收藏地点。' : 'No saved places in this selection.'}</p>}
  </details>;
}
export function ShortlistCities({ current, locale = 'en' }: { current: keyof typeof cityPaths; locale?: ShortlistLocale }) {
  return <nav className={styles.actions} aria-label={locale === 'ko' ? '도시별 예산 검색' : locale === 'zh-CN' ? '按城市筛选预算' : 'Budget search by city'}>{Object.entries(cityPaths).map(([city, href]) => <Link key={city} href={shortlistHref(locale, href)} aria-current={current === city ? 'page' : undefined}>{city === 'seoul' ? 'Seoul' : city === 'singapore' ? 'Singapore' : city === 'tokyo' ? 'Tokyo' : 'Dubai'}</Link>)}</nav>;
}
