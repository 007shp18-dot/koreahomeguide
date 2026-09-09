'use client';
import React, { useEffect, useState } from 'react';
import { statuses, type AuditEvent, type Command, type Evidence, type Source, type Status } from '@/lib/evidence-pool/contract';
import styles from './workspace.module.css';

export function ReviewPanel({ entity, row, busy, submit }: { entity: 'source' | 'evidence'; row: Source | Evidence; busy: boolean; submit: (command: Command) => Promise<boolean> }) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState<Exclude<Status, 'pending'> | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [historyState, setHistoryState] = useState('loading');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/internal/evidence-pool/?entity=${entity}&history=${row.id}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(); const data = await response.json(); if (!controller.signal.aborted) { setEvents(data.events); setHistoryState('ready'); } })
      .catch(() => { if (!controller.signal.aborted) setHistoryState('error'); });
    return () => controller.abort();
  }, [entity, row.id, row.version, reload]);
  async function review() {
    if (confirm && await submit({ action: 'review', entity, id: row.id, version: row.version, status: confirm, reason: reason.trim() })) { setConfirm(null); setReason(''); }
  }
  const expired = entity === 'evidence' && ((row as Evidence).expiresOn < new Date().toISOString().slice(0, 10) || (row as Evidence).observedOn > new Date().toISOString().slice(0, 10));
  const approvalBlocked = expired || (entity === 'evidence' && (row as Evidence).sourceStatus !== 'approved');
  return <section className={styles.review}>
    <h3>검토 결정</h3>
    {row.status === 'withdrawn' ? <p className={styles.notice}>철회된 자료는 수정하거나 다시 승인할 수 없습니다.</p> : <fieldset disabled={busy}>
      <label>검토 사유<input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={240} placeholder="확인한 근거 또는 제외 이유 · 3자 이상" /></label>
      {approvalBlocked && <p className={styles.hint}>승인하려면 출처가 승인되어 있고, 자료의 시점과 유효기간이 현재에 맞아야 합니다.</p>}
      <div className={styles.actions}>{(['approved', 'rejected', 'withdrawn'] as const).map((status) => <button type="button" key={status} disabled={row.status === status || reason.trim().length < 3 || (status === 'approved' && approvalBlocked)} className={status === 'withdrawn' ? styles.danger : status === 'approved' ? styles.primary : ''} onClick={() => setConfirm(status)}>{statuses[status]}</button>)}</div>
      {confirm && <div className={styles.notice} role="alert"><p>{statuses[confirm]} 처리할까요?{confirm === 'withdrawn' ? ' 철회하면 복원할 수 없습니다.' : ' 이 결정과 사유가 이력에 남습니다.'}</p><div className={styles.actions}><button type="button" onClick={() => void review()} className={styles.primary}>확인</button><button type="button" onClick={() => setConfirm(null)}>취소</button></div></div>}
    </fieldset>}
    <h3>변경 이력 <small>최근 100건 · UTC</small></h3>
    {historyState === 'loading' && <p role="status">이력을 불러오는 중…</p>}
    {historyState === 'error' && <p role="alert">이력을 불러오지 못했습니다. <button type="button" onClick={() => { setHistoryState('loading'); setReload((v) => v + 1); }}>다시 시도</button></p>}
    {historyState === 'ready' && !events.length && <p>변경 이력이 없습니다.</p>}
    <ol className={styles.history}>{events.map((event) => <li key={event.id}>
      <strong>{{ created: '등록', corrected: '정정', ...statuses }[event.action] ?? event.action}</strong><span>{event.createdAt.slice(0, 16).replace('T', ' ')}</span><p>{event.reason}</p><small>작업 세션: {event.actor}</small>
      <details><summary>당시 저장 값 확인</summary><pre>{JSON.stringify(event.snapshot, null, 2)}</pre></details>
    </li>)}</ol>
  </section>;
}
