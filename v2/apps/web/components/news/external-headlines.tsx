'use client';

import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import { useEffect, useState } from 'react';
import type { NewsWorkspaceMarket, NewsWorkspaceModel } from '../../lib/news/news-workspace-model';
import styles from './external-headlines.module.css';
import { headlineResource } from '../../lib/news/headline-resource';

export function ExternalHeadlines({ market, preview = false, initialModel = null, locale = 'en' }: Readonly<{
  market: NewsWorkspaceMarket;
  preview?: boolean;
  initialModel?: NewsWorkspaceModel | null;
  locale?: 'en' | 'ko' | 'zh-CN';
}>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
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
        if (active) { setModel(next); setStatus('ready'); }
      } catch { if (active) setStatus('error'); }
      finally { pending = false; }
    };
    // Static/ISR HTML may contain an older reviewed snapshot. Revalidate on
    // mount as well; the shared resource deduplicates navigation requests.
    void update();
    const timer = setInterval(() => { if (!document.hidden) void update(); }, 15 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, [refresh, initialModel]);
  const items = (model?.items ?? []).filter(item => item.sourceKind !== 'signedprice-brief' && (market === 'all' || item.market === market));
  const visible = items.slice(0, preview ? 4 : page * 24);
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const allHref = `${prefix}/news/?type=news${market === 'all' ? '' : `&market=${market}`}`;
  const dates = Object.fromEntries(Object.entries({ seoul: 'Asia/Seoul', singapore: 'Asia/Singapore', dubai: 'Asia/Dubai', tokyo: 'Asia/Tokyo' }).map(([city, timeZone]) => [city, new Intl.DateTimeFormat(ko ? 'ko' : zh ? 'zh-CN' : 'en', { year: 'numeric', month: 'short', day: 'numeric', timeZone })]));
  const title = ko ? '최신 뉴스' : zh ? '最新新闻' : 'Latest news';
  return <section id="latest-news" className={styles.section} aria-labelledby="external-headlines-heading" data-external-headlines={status}>
    <header><div><h2 id="external-headlines-heading">{title}</h2><p>{ko ? '지금 나온 소식, 집을 고르는 사람에게 중요한 점.' : zh ? '近期报道，以及对购房选择的影响。' : 'What happened, and why it matters when choosing a home.'}</p></div>
      {preview ? <Link href={allHref}>{ko ? '뉴스 모두 보기' : zh ? '查看全部新闻' : 'All news'} <UiIcon name="arrow-right" /></Link> : <button type="button" onClick={() => setRefresh(value => value + 1)}>{ko ? '새로고침' : zh ? '刷新' : 'Refresh'}</button>}
    </header>
    {status === 'loading' ? <p role="status">{ko ? '뉴스를 불러오는 중…' : 'Loading headlines…'}</p> : null}
    {status === 'error' ? <p role="status">{ko ? '새 소식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' : 'Unable to refresh. Please try again.'} <button type="button" onClick={() => setRefresh(value => value + 1)}>{ko ? '다시 시도' : 'Try again'}</button></p> : null}
    {status === 'ready' && visible.length === 0 ? <p>{ko ? '이 도시의 새 소식은 아직 없습니다.' : 'No news is available for this city yet.'}</p> : null}
    <ol className={preview ? styles.preview : undefined}>
      {visible.map(item => <li key={item.id}>
        <div><span>{item.marketLabel} · {item.publisher}</span><time dateTime={item.publishedAt}>{dates[item.market]!.format(new Date(item.publishedAt))}</time></div>
        <h3><a href={item.url} target="_blank" rel="noreferrer">{ko ? item.titleKo ?? item.title : item.title}</a></h3>
        {item.summary ? <p className={styles.summary}>{ko ? item.summaryKo ?? item.summary : item.summary}</p> : null}
        {item.buyerNote ? <p className={styles.meaning}><strong>{ko ? '집을 찾는다면' : zh ? '购房视角' : 'For your search'}</strong> {ko ? item.buyerNoteKo ?? item.buyerNote : item.buyerNote}</p> : null}
        <a className={styles.original} href={item.url} target="_blank" rel="noreferrer">{ko ? '원문 읽기' : zh ? '阅读原文' : 'Read original'} <UiIcon name="arrow-up-right" /></a>
      </li>)}
    </ol>
    {!preview && visible.length < items.length ? <button type="button" onClick={() => setPage(value => value + 1)}>{ko ? '뉴스 더 보기' : 'More headlines'}</button> : null}
  </section>;
}
