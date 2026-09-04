'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { NewsWorkspaceMarket, NewsWorkspaceModel } from '../../lib/news/news-workspace-model';
import styles from '../global-product-hub.module.css';

const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const markets = Object.freeze([
  ['all', 'All markets'], ['seoul', 'Seoul'], ['singapore', 'Singapore'], ['dubai', 'Dubai'],
] as const);
const evidenceLabels = Object.freeze({
  matched: 'Matched',
  'no-change': 'No change',
  checking: 'Checking',
  insufficient: 'Insufficient sample',
});

const PAGE_SIZE = 30;

export function NewsWorkbench({ model }: Readonly<{ model: NewsWorkspaceModel }>) {
  const [workspace, setWorkspace] = useState(model);
  const [market, setMarket] = useState<NewsWorkspaceMarket>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(
    () => workspace.items.filter((item) => market === 'all' || item.market === market),
    [market, workspace.items],
  );
  const visible = filtered.slice(0, visibleCount);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/news/', { signal: controller.signal })
      .then((response) => response.ok
        ? response.json() as Promise<NewsWorkspaceModel>
        : Promise.reject(new Error('News API unavailable')))
      .then((next) => setWorkspace(next))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return (
    <div className={styles.newsWorkbench}>
      <aside className={styles.newsFilters} aria-label="News filters">
        <div><span>Market</span><strong>Coverage</strong></div>
        {markets.map(([value, label]) => <button type="button" aria-pressed={market === value} onClick={() => { setMarket(value); setSelectedId(null); setVisibleCount(PAGE_SIZE); }} key={value}><span>{label}</span><small>{workspace.items.filter((item) => value === 'all' || item.market === value).length}</small></button>)}
        <hr />
        <p>Source status</p>
        <span>{workspace.naverState === 'ready'
          ? 'Naver News API · Live'
          : workspace.naverState === 'not-configured'
            ? 'Naver News API · Loading'
            : workspace.naverDiagnostic === 'permission-denied'
              ? 'Naver News API · Search permission required'
              : workspace.naverDiagnostic === 'credentials-rejected'
                ? 'Naver News API · Credentials rejected'
                : 'Naver News API · Fallback active'}</span>
        <span>Cache · 15 minutes</span>
      </aside>
      <div className={styles.newsFeed}>
        {filtered.length === 0 ? <article className={styles.emptyState}><strong>No items in this market.</strong><p>No placeholder headline is substituted.</p></article> : visible.map((item) => (
          <article className={selected?.id === item.id ? styles.newsItemSelected : undefined} key={item.id}>
            <button className={styles.newsSelect} type="button" onClick={() => setSelectedId(item.id)}>
              <div><span>{item.marketLabel}</span><time dateTime={item.publishedAt}>{date.format(new Date(item.publishedAt))}</time></div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <footer><span>{item.category}</span><strong>{item.sourceKind === 'naver-search' ? 'External article' : 'SignedPrice brief'}</strong></footer>
            </button>
          </article>
        ))}
        {visible.length < filtered.length ? <button className={styles.newsLoadMore} type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Load 30 more <span>{visible.length} of {filtered.length}</span></button> : null}
      </div>
      <aside className={styles.newsEvidence} aria-label="Selected news evidence">
        <p>Selected article</p>
        {selected === undefined ? <div className={styles.emptyState}><strong>Nothing selected</strong><p>Select a market with available news.</p></div> : <>
          <span>{selected.category} · {date.format(new Date(selected.publishedAt))}</span>
          <h3>{selected.title}</h3>
          <p>{selected.evidenceLine}</p>
          <dl>
            <div><dt>Publisher</dt><dd>{selected.publisher}</dd></div>
            <div><dt>Evidence</dt><dd>{evidenceLabels[selected.evidence]}</dd></div>
            <div><dt>Market</dt><dd>{selected.marketLabel}</dd></div>
            <div><dt>Source</dt><dd>{selected.sourceKind === 'naver-search' ? 'Naver News Search API' : 'Approved SignedPrice brief'}</dd></div>
          </dl>
          <div className={styles.newsEvidenceActions}>
            {selected.internalHref === null ? null : <Link href={selected.internalHref}>Read brief →</Link>}
            <a href={selected.url} target="_blank" rel="noreferrer">Open original article ↗</a>
          </div>
        </>}
      </aside>
    </div>
  );
}
