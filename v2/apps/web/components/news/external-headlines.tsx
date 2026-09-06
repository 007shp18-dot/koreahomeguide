'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { NewsWorkspaceModel } from '../../lib/news/news-workspace-model';
import styles from './external-headlines.module.css';
import { headlineResource } from '../../lib/news/headline-resource';

const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function ExternalHeadlines({ market, preview = false, initialModel = null }: Readonly<{
  market: 'all' | 'seoul' | 'singapore' | 'dubai';
  preview?: boolean;
  initialModel?: NewsWorkspaceModel | null;
}>) {
  const [model, setModel] = useState<NewsWorkspaceModel | null>(initialModel);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(initialModel === null ? 'loading' : 'ready');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    let pending = false;
    const update = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await headlineResource.load(refresh > 0);
        if (!active) return;
        setModel(next);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      } finally { pending = false; }
    };
    void update();
    const timer = setInterval(() => { if (!document.hidden) void update(); }, 15 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, [refresh]);
  const items = (model?.items ?? []).filter((item) => item.sourceKind !== 'signedprice-brief'
    && (market === 'all' || item.market === market));
  const visible = items.slice(0, preview ? 4 : page * 24);
  const allHref = `/news/?type=headlines${market === 'all' ? '' : `&market=${market}`}`;
  return <section className={styles.section} aria-labelledby="external-headlines-heading" data-external-headlines={status}>
    <header><div><h2 id="external-headlines-heading">External headlines</h2><p>From other publishers · Original languages · Refreshes every 15 minutes</p></div>
      {preview ? <Link href={allHref}>View all headlines</Link> : <button type="button" onClick={() => setRefresh((value) => value + 1)}>Refresh</button>}
    </header>
    {status === 'loading' ? <p role="status">Loading headlines…</p> : null}
    {status === 'error' ? <p role="status">Headlines could not be refreshed. {model === null ? 'Please try again.' : 'Previously loaded articles are still shown.'} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></p> : null}
    {status === 'ready' && visible.length === 0 ? <p>No external headlines are available for this market.</p> : null}
    <ol className={preview ? styles.preview : undefined}>
      {visible.map((item) => <li key={item.id}>
        <div><span>{item.marketLabel} · {item.publisher}</span><time dateTime={item.publishedAt}>{date.format(new Date(item.publishedAt))}</time></div>
        <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
      </li>)}
    </ol>
    {!preview && visible.length < items.length ? <button type="button" onClick={() => setPage((value) => value + 1)}>More headlines</button> : null}
  </section>;
}
