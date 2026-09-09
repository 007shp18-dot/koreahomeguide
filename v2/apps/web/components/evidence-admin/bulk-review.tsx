'use client';
import React, { useState } from 'react';
import type { BulkCommand, BulkPreview, BulkScope } from '@/lib/evidence-pool/bulk';
import styles from './workspace.module.css';

export function BulkReview({ scope, disabled, run }: { scope: BulkScope; disabled: boolean; run: (command: BulkCommand) => Promise<BulkPreview | null> }) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  async function submit(confirm: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await run({ action: confirm ? 'bulk-review' : 'bulk-preview', scope, status, reason: reason.trim(), fingerprint: confirm ? preview!.fingerprint : '' });
      setPreview(confirm ? null : result); setFinished(confirm && !!result);
    } finally { setBusy(false); }
  }
  return <section className={styles.notice} aria-label="일괄 검토">
    <strong>{scope.ids ? `선택 ${scope.ids.length}건` : '현재 필터 전체'} 일괄 검토</strong>
    <fieldset disabled={disabled || busy || finished} className={styles.formGrid}>
      <label>결정<select value={status} onChange={e => { setStatus(e.target.value as typeof status); setPreview(null); }}><option value="approved">승인</option><option value="rejected">반려·제외</option></select></label>
      <label>공통 검토 사유<input value={reason} minLength={3} maxLength={240} onChange={e => { setReason(e.target.value); setPreview(null); }} placeholder="확인한 근거·반려 사유" /></label>
      <button type="button" disabled={reason.trim().length < 3} onClick={() => void submit(false)}>처리 대상 확인</button>
      {preview && <div className={styles.full} role="status"><p>조회 {preview.matched}건 · 처리 가능 {preview.eligible}건 · 제외 {preview.blocked}건</p><p>이미 같은 상태·철회된 자료는 제외합니다. 승인은 수집 기준과 출처 승인을 충족한 자료만 처리합니다.</p><p>사유: {reason}</p><button type="button" className={styles.primary} disabled={preview.eligible === 0} onClick={() => void submit(true)}>{preview.eligible}건 {status === 'approved' ? '승인' : '반려'} 확정</button><button type="button" onClick={() => setPreview(null)}>취소</button></div>}
    </fieldset>
    {finished && <p role="status">일괄 처리와 건별 변경 이력을 저장했습니다.</p>}
  </section>;
}
