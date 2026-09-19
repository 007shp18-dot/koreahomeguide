'use client';

import { useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './market-shell.module.css';

const subscribe = () => () => {};
const hydrated = () => true;
const server = () => false;

/** Keep both trees mounted so changing views preserves selection and map state. */
export function ExploreWorkspace({ locale, discovery, spatial, mobileViews = true }: {
  locale: MarketLocale; discovery: ReactNode; spatial?: ReactNode; mobileViews?: boolean;
}) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const ready = useSyncExternalStore(subscribe, hydrated, server);
  const id = useId();
  const copy = locale === 'ko'
    ? { label: '탐색 보기', list: '목록', map: '지도' }
    : locale === 'zh-CN'
      ? { label: '探索视图', list: '列表', map: '地图' }
      : { label: 'Explore view', list: 'List', map: 'Map' };
  const switchable = spatial != null && mobileViews;
  return <>
    {switchable && ready ? <div className={styles.mobileViews} role="group" aria-label={copy.label}>
      <button type="button" aria-pressed={view === 'list'} aria-controls={`${id}-list`} onClick={() => setView('list')}>{copy.list}</button>
      <button type="button" aria-pressed={view === 'map'} aria-controls={`${id}-map`} onClick={() => setView('map')}>{copy.map}</button>
    </div> : null}
    <div className={styles.exploreGrid} data-layout={spatial == null ? 'list' : 'split'} data-mobile-view={switchable && ready ? view : undefined}>
      <section id={`${id}-list`} className={styles.discovery} data-market-shell-region="discovery">{discovery}</section>
      {spatial == null ? null : <section id={`${id}-map`} className={styles.spatial} data-market-shell-region="spatial">{spatial}</section>}
    </div>
  </>;
}
