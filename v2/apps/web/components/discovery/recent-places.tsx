'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { journalIsSessionOnly, parseJournal, readJournal, subscribeJournal, withRecentPlace, writeJournal, type DiscoveryMarket, type RecentPlace } from '../../lib/discovery/journal';
import styles from './discovery.module.css';

const empty = () => '';
export function RecordPlaceVisit({ place }: { place: Omit<RecentPlace, 'viewedAt'> | null }) {
  const market = place?.market, key = place?.key, name = place?.name, href = place?.href;
  useEffect(() => {
    if (!market || !key || !name || !href) return;
    writeJournal(withRecentPlace(parseJournal(readJournal()), { market, key, name, href, viewedAt: new Date().toISOString() }));
  }, [market, key, name, href]);
  return null;
}

export function RecentPlaces({ market, locale = 'en', excludeKey }: { market?: DiscoveryMarket; locale?: MarketLocale; excludeKey?: string }) {
  const raw = useSyncExternalStore(subscribeJournal, readJournal, empty);
  const [clearFailed, setClearFailed] = useState(false);
  const recent = useMemo(() => parseJournal(raw).recent.filter(place => (!market || place.market === market) && place.key !== excludeKey).slice(0, 3), [raw, market, excludeKey]);
  if (!recent.length && !clearFailed) return null;
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const label = ko ? '최근 본 곳' : zh ? '最近浏览' : 'Recently viewed';
  return <section className={styles.recent} aria-label={label} data-recent-places={market ?? 'all'}>
    {recent.length > 0 && <><span className={styles.label}>{label}</span>
    <nav aria-label={ko ? '최근 탐색 이어보기' : zh ? '继续浏览' : 'Resume exploring'}>
      {/* Explore clients restore URL state on mount. A document navigation also restores query-only selections. */}
      {recent.map(place => <a key={`${place.market}:${place.key}`} href={marketHref(locale, place.href)}>{place.name}</a>)}
    </nav>
    <button className={styles.clear} type="button" onClick={() => {
      const latest = parseJournal(readJournal());
      setClearFailed(!writeJournal({ ...latest, recent: market ? latest.recent.filter(p => p.market !== market) : [] }));
    }}>{ko ? '기록 지우기' : zh ? '清除记录' : 'Clear history'}</button></>}
    {clearFailed ? <p className={styles.status} role="status">{ko ? '브라우저 저장이 차단되어 기록 삭제를 저장하지 못했습니다. 새로고침하면 이전 기록이 다시 나타날 수 있습니다.' : zh ? '浏览器存储受限，无法保存清除操作。刷新后旧记录可能重新出现。' : 'Browser storage is blocked. Clearing could not be saved; previous history may return after reloading.'}</p> : journalIsSessionOnly() && <p className={styles.status}>{ko ? '브라우저 저장이 차단되어 이번 페이지에서만 유지됩니다.' : zh ? '浏览器存储受限，记录仅在本次页面会话中保留。' : 'Browser storage is blocked. History lasts only for this page session.'}</p>}
  </section>;
}
