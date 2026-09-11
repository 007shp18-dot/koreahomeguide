'use client';

import React, { useEffect, useState } from 'react';
import type { MarketCollectionStatus } from '@/lib/data-operations/market-status.server';
import type { CollectionStatus } from '@/lib/data-operations/repository.server';
import styles from './workspace.module.css';

type Collections = { markets?: MarketCollectionStatus[]; sources: CollectionStatus[] };
type Article = { id: string; state: string; scheduled_at: string | null; error_code: string | null; payload: { title?: string } };
type Resource<T> = { data: T | null; error: string };
const jobs: Record<string, string> = {
  'kr-seoul-sale': '서울 · 매매', 'kr-seoul-rent': '서울 · 임대',
  'sg-private-sale': '싱가포르 · 민간 매매', 'sg-private-rent': '싱가포르 · 민간 임대',
  'ae-dubai-transaction': '두바이 · 거래', 'ae-dubai-rent': '두바이 · 임대',
  'jp-tokyo-sale': '도쿄 · 매매',
};
const states: Record<string, string> = { succeeded: '최근 수집 성공', failed: '수집 실패', running: '수집 중', draft: '초안', scheduled: '예약', publishing: '발행 중', refreshing: '화면 갱신 중', published: '발행 완료', cancelled: '취소' };
function time(value: string | null) {
  if (!value) return '기록 없음';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '시각 확인 필요';
}
function reason(code: string | null) {
  if (code === 'runtime_credential_unavailable') return '운영 인증 정보 확인 필요';
  if (code === 'provider_unavailable') return '제공기관 API 응답 확인 필요';
  if (code === 'source_invalid') return '원자료 형식 확인 필요';
  return code || '실행 이력 확인 필요';
}

export function OperationsOverview({ onNavigate, onUnauthorized }: {
  onNavigate: (tab: 'collection' | 'operations') => void; onUnauthorized: () => void;
}) {
  const [collections, setCollections] = useState<Resource<Collections>>({ data: null, error: '' });
  const [articles, setArticles] = useState<Resource<{ items: Article[] }>>({ data: null, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function read<T>(url: string, commit: (value: Resource<T>) => void) {
      commit({ data: null, error: '' });
      try {
        const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        if (response.status === 401) { onUnauthorized(); return; }
        if (!response.ok) throw new Error('상태를 불러오지 못했습니다. 다시 조회하세요.');
        const data = await response.json() as T;
        if (!controller.signal.aborted) commit({ data, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) commit({ data: null, error: error instanceof Error ? error.message : '조회 실패' });
      }
    }
    void read<Collections>('/api/internal/data-collection/', setCollections);
    void read<{ items: Article[] }>('/api/internal/editorial-operations/', setArticles);
    return () => controller.abort();
  }, [revision, onUnauthorized]);
  const markets = collections.data?.markets ?? [];
  const sourceIssues = collections.data?.sources.filter(source => source.consecutiveFailures > 0 || source.lastError || source.anomaly) ?? [];
  const marketIssues = markets.filter(market => market.state === 'failed' || market.consecutiveFailures > 0 || market.anomaly);
  const items = articles.data?.items ?? [];
  const failedArticles = items.filter(item => item.state === 'failed');
  const scheduled = items.filter(item => item.state === 'scheduled');
  return <div className={styles.overview}>
    <div className={styles.detailHeader}><p className={styles.hint}>실행 기록 기준 · 시각은 한국 시간(KST)</p><button type="button" onClick={() => setRevision(value => value + 1)}>운영 상태 새로고침</button></div>
    <section className={styles.overviewMetrics} aria-label="운영 요약">
      <button type="button" onClick={() => onNavigate('collection')}><span>확인할 수집 작업</span><strong>{collections.data ? marketIssues.length + sourceIssues.length : '—'}</strong><small>{collections.error ? '조회 실패' : collections.data ? '실패·오류·수집량 이상' : '조회 중'}</small></button>
      <button type="button" onClick={() => onNavigate('operations')}><span>발행 실패</span><strong>{articles.data ? failedArticles.length : '—'}</strong><small>예약 목록 최근 100건 기준</small></button>
      <button type="button" onClick={() => onNavigate('operations')}><span>예약 기사</span><strong>{articles.data ? scheduled.length : '—'}</strong><small>발행 대기 중인 등록 기사</small></button>
    </section>
    <section className={styles.overviewSection} aria-label="우선 확인할 문제">
      <div className={styles.detailHeader}><h2>먼저 확인하세요</h2><button type="button" onClick={() => onNavigate('collection')}>수집 상세 →</button></div>
      {collections.error && <p role="alert" className={styles.error}>데이터 수집: {collections.error}</p>}
      {articles.error && <p role="alert" className={styles.error}>기사 발행: {articles.error}</p>}
      {!collections.data && !collections.error && <p role="status">수집 상태를 조회하고 있습니다.</p>}
      {!articles.data && !articles.error && <p role="status">기사 발행 상태를 조회하고 있습니다.</p>}
      <ul className={styles.issueList}>
        {marketIssues.map(m => <li key={m.job}><div><strong>{jobs[m.job] ?? m.job}</strong><p>{m.anomaly ?? reason(m.errorCode)}</p><small>최근 시도 {time(m.lastAttemptAt)} · 연속 실패 {m.consecutiveFailures}회</small></div><button type="button" onClick={() => onNavigate('collection')}>실행 기록 보기</button></li>)}
        {sourceIssues.map(s => <li key={s.sourceId}><div><strong>{s.name}</strong><p>{s.anomaly ?? reason(s.lastError)}</p><small>최근 시도 {time(s.lastAttemptAt)} · 다음 확인 {time(s.nextDueAt)}</small></div><button type="button" onClick={() => onNavigate('collection')}>출처 상태 보기</button></li>)}
        {failedArticles.map(a => <li key={a.id}><div><strong>{a.payload.title || '제목 없는 기사'}</strong><p>기사 발행 실패 · {reason(a.error_code)}</p></div><button type="button" onClick={() => onNavigate('operations')}>발행 목록 보기</button></li>)}
      </ul>
      {collections.data && articles.data && !marketIssues.length && !sourceIssues.length && !failedArticles.length && <p>조회한 실행 기록에서 실패·오류·수집량 이상이 발견되지 않았습니다. 데이터 최신성과 공개 여부는 아래 실행 기록과 상세 화면에서 확인하세요.</p>}
    </section>
    <section className={styles.overviewSection} aria-label="국가별 거래 수집">
      <h2>국가별 거래 수집</h2><p className={styles.hint}>마지막 수집 성공과 사이트 반영은 별개입니다. 공개 시각은 수집 상세에서 확인하세요.</p>
      {collections.data && !markets.length ? <p>거래 수집 실행 정보가 없습니다.</p> : <div className={styles.tableScroll}><table><thead><tr><th>도시·자료</th><th>최근 실행</th><th>마지막 성공</th><th>성공 자료 기준</th></tr></thead><tbody>{markets.map(m => <tr key={m.job}><td><strong>{jobs[m.job] ?? m.job}</strong><small>{m.enabled ? '예약 활성' : '예약 비활성'}</small></td><td><span className={styles.health} data-state={m.state}>{states[m.state ?? ''] ?? '실행 기록 없음'}</span><small>{time(m.lastAttemptAt)}</small></td><td>{time(m.lastSuccessAt)}</td><td>{time(m.sourceAsOf)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className={styles.overviewSection} aria-label="기사 발행 현황">
      <div className={styles.detailHeader}><h2>기사 발행</h2><button type="button" onClick={() => onNavigate('operations')}>기사 작성·예약 →</button></div>
      <p className={styles.hint}>관리화면에 등록된 예약 목록의 최근 100건입니다. 코드로 관리하는 기존 기사와 외부 뉴스 전체 목록은 포함하지 않습니다.</p>
      {articles.data && !items.length && <p>등록된 발행 예약이 없습니다. 기사 작성·예약에서 초안을 등록하세요.</p>}
      <ul className={styles.articleQueue}>{items.slice(0,8).map(a => <li key={a.id}><div><strong>{a.payload.title || '제목 없는 기사'}</strong><small>예약 {time(a.scheduled_at)}</small></div><span>{states[a.state] ?? a.state}</span></li>)}</ul>
    </section>
  </div>;
}
