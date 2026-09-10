'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './workspace.module.css';

type Status = {
  total: number; published: number; remaining: number; deferred: number;
  quarters: { year: string; quarter: string; published: number; deferred: number; remaining: number }[];
};
type Batch = Status & {
  state: 'complete' | 'partial' | 'busy' | 'deferred';
  results: { scope: { city: string; year: string; quarter: string }; state: string; code?: string; received?: number }[];
};
const endpoint = '/api/internal/japan-backfill/';

export function JapanBackfillPanel({ onUnauthorized }: { onUnauthorized?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const stop = useRef(false);
  const active = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void fetch(endpoint, { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        if (!response.ok) { if (response.status === 401) onUnauthorized?.(); throw new Error(); }
        const data: Status = await response.json();
        if (mounted.current) setStatus(data);
      }).catch(() => { if (mounted.current) setMessage('수집 범위를 불러오지 못했습니다.'); });
    return () => { mounted.current = false; stop.current = true; };
  }, [onUnauthorized]);

  async function run() {
    if (active.current) return;
    active.current = true; stop.current = false; setRunning(true); setMessage('최신 완료 분기부터 누락 범위를 확인합니다…');
    try {
      while (!stop.current) {
        const response = await fetch(endpoint, {
          method: 'POST', credentials: 'same-origin', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(110_000),
        });
        if (!response.ok) {
          if (response.status === 401) onUnauthorized?.();
          throw new Error('수집 요청을 완료하지 못했습니다. 기존 공개 자료는 유지됩니다.');
        }
        const batch: Batch = await response.json();
        if (!mounted.current) break;
        setStatus(batch);
        const last = batch.results.at(-1);
        const detail = last ? `${last.scope.year} Q${last.scope.quarter} · ${last.scope.city} · ${last.received === undefined ? last.code ?? last.state : `${last.received}건 검증·공개`}` : '';
        setMessage(detail);
        if (batch.state === 'busy') { setMessage('다른 일본 수집이 진행 중입니다. 완료 후 다시 실행하세요.'); break; }
        if (batch.results.some(result => result.state === 'failed' && result.code !== 'no_data')) {
          setMessage(`${detail} · 오류를 확인한 뒤 재개하세요.`); break;
        }
        if (batch.remaining === 0) {
          setMessage(`현재 수집 가능한 누락 범위 처리를 마쳤습니다. 재확인 대기 ${batch.deferred}개 범위는 공개 완료에 포함되지 않습니다.`); break;
        }
        if (batch.results.length === 0) { setMessage('이번 요청에서 처리한 범위가 없습니다. 수집 상태를 확인한 뒤 재개하세요.'); break; }
      }
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error && error.name === 'TimeoutError'
        ? '응답 시간이 초과됐습니다. 서버 검증은 진행 중일 수 있으니 새로고침으로 공개 상태를 확인하세요.'
        : error instanceof Error ? error.message : '수집에 실패했습니다.');
    } finally { active.current = false; if (mounted.current) setRunning(false); }
  }

  return <section className={styles.notice} aria-label="도쿄 누락 거래 수집">
    <h3>도쿄 23개 구 · 최신 공개 거래 채우기</h3>
    <p>2024년부터 최신 완료 분기까지 누락 범위를 순서대로 확인합니다. 원문·건수 검증을 통과한 자료만 공개하며, API에 없는 범위는 24시간 뒤 재확인합니다.</p>
    {status && <><p>공개 {status.published} / {status.total}개 구·분기 · 수집 대기 {status.remaining} · 재확인 대기 {status.deferred}</p>
      <div className={styles.tableScroll}><table><thead><tr><th>분기</th><th>공개 구</th><th>수집 대기</th><th>재확인 대기</th></tr></thead>
        <tbody>{status.quarters.map(row => <tr key={`${row.year}:${row.quarter}`}><td>{row.year} Q{row.quarter}</td><td>{row.published} / 23</td><td>{row.remaining}</td><td>{row.deferred}</td></tr>)}</tbody></table></div></>}
    <button type="button" disabled={running} onClick={() => void run()}>최신 분기부터 누락 거래 연속 수집</button>
    {running && <button type="button" onClick={() => { stop.current = true; setMessage('현재 묶음 검증을 마친 뒤 중지합니다.'); }}>현재 묶음 후 중지</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
