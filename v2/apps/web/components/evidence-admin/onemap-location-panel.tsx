'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './workspace.module.css';

export type OneMapLocationCandidate = {
  id: string;
  version: number;
  status: string;
  entityId: string | null;
  providerKey: string;
  block: string;
  street: string;
  addressText: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  contentHash: string;
  fetchedAt: string;
  isCurrent: boolean;
  audit?: {
    previous_version: number;
    next_version: number;
    previous_status: string;
    next_status: string;
    reason: string;
    actor: string;
    reviewed_at: string;
  }[];
};

type CandidateList = {
  items: OneMapLocationCandidate[];
  page: number;
  total: number;
};

type CollectionResult = {
  status: string;
  error?: string | number;
  attemptedCount?: number;
  newCount?: number;
  changedCount?: number;
  pendingCount?: number;
  exact?: number;
  noResult?: number;
  ambiguous?: number;
  errorCount?: number;
};

const endpoint = '/api/internal/onemap-locations/';
const labels: Record<string, string> = {
  pending: '검토 대기',
  approved: '승인',
  rejected: '제외',
};

function collectionMessage(result: CollectionResult) {
  if (result.status === 'not_due_or_busy') return '다른 OneMap 수집이 진행 중이거나 아직 재수집 시점 전입니다.';
  if (result.status === 'failed') {
    return `OneMap 수집 실패${typeof result.error === 'string' ? ` · ${result.error}` : ''}. 기존 승인 좌표는 유지됩니다.`;
  }
  return [
    `OneMap ${result.attemptedCount ?? 0}건 조회`,
    `정확 일치 ${result.exact ?? 0}`,
    `신규 ${result.newCount ?? 0}`,
    `변경 ${result.changedCount ?? 0}`,
    `결과 없음 ${result.noResult ?? 0}`,
    `복수 결과 ${result.ambiguous ?? 0}`,
    `오류 ${result.errorCount ?? (typeof result.error === 'number' ? result.error : 0)}`,
    `검토 대기 ${result.pendingCount ?? 0}`,
  ].join(' · ');
}

export function OneMapLocationPanel({
  onUnauthorized,
  initialData,
}: {
  onUnauthorized?: () => void;
  initialData?: CandidateList;
}) {
  const [data, setData] = useState<CandidateList | null>(initialData ?? null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [selected, setSelected] = useState<OneMapLocationCandidate | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requestId = useRef(0);
  const detailRequestId = useRef(0);
  const mutation = useRef(false);

  const request = useCallback(async <T,>(url: string, body?: unknown): Promise<T> => {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...(body ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      } : {}),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.();
      throw new Error(
        response.status === 409
          ? '다른 검토 또는 신규 수집으로 후보가 변경되었습니다. 목록을 새로고침하고 다시 확인하세요.'
          : response.status === 401
            ? '세션이 만료되었습니다. 다시 로그인하세요.'
            : response.status === 403
              ? '요청 출처를 확인할 수 없습니다. 페이지를 다시 여세요.'
              : 'OneMap 위치 자료 요청에 실패했습니다. 연결과 수집 상태를 확인하세요.',
      );
    }
    return result as T;
  }, [onUnauthorized]);

  const load = useCallback(() => {
    const id = ++requestId.current;
    return request<CandidateList>(`${endpoint}?status=${status}&page=${page}`)
      .then((result) => {
        if (id === requestId.current) {
          setData(result);
          setError('');
        }
      })
      .catch((cause) => {
        if (id === requestId.current) setError(cause instanceof Error ? cause.message : '조회 실패');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [page, request, status]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
      detailRequestId.current += 1;
    };
  }, [load]);

  async function openCandidate(item: OneMapLocationCandidate) {
    const id = ++detailRequestId.current;
    setSelected(null);
    setReason('');
    setError('');
    try {
      const result = await request<{ item: OneMapLocationCandidate | null }>(
        `${endpoint}?id=${encodeURIComponent(item.id)}`,
      );
      if (id === detailRequestId.current) {
        setSelected(result.item);
        if (!result.item) setError('선택한 위치 후보가 없습니다.');
      }
    } catch (cause) {
      if (id === detailRequestId.current) {
        setError(cause instanceof Error ? cause.message : '상세 조회 실패');
      }
    }
  }

  async function collect() {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await request<CollectionResult>(endpoint, { action: 'collect' });
      setMessage(collectionMessage(result));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '수집 실패');
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  async function review(decision: 'approved' | 'rejected') {
    if (mutation.current || !selected || reason.trim().length < 3) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await request(endpoint, {
        action: 'review',
        id: selected.id,
        version: selected.version,
        status: decision,
        reason: reason.trim(),
      });
      setSelected(null);
      setReason('');
      await load();
      setMessage(
        decision === 'approved'
          ? '위치 후보를 개별 승인했습니다. 검증 좌표와 출처가 해당 HDB 건물에 반영됩니다.'
          : '위치 후보를 제외했습니다. 승인 좌표였다면 공개 연결을 철회하고 검토 이력은 보존합니다.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '검토 저장 실패');
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  return <section className={styles.notice} aria-label="OneMap 위치 후보 검토">
    <h3>OneMap 위치 · 개별 검토</h3>
    <p>HDB 공식 블록·도로명과 OneMap 검색 결과가 정확히 하나로 일치한 후보만 표시합니다. 수집만으로 사이트 좌표가 바뀌지 않으며, 최신 후보를 개별 승인해야 반영됩니다.</p>
    <p><a href="https://www.onemap.gov.sg/apidocs/" target="_blank" rel="noreferrer">OneMap API</a> · <a href="https://www.onemap.gov.sg/legal/opendatalicence.html" target="_blank" rel="noreferrer">Singapore Open Data Licence</a></p>
    <div className={styles.actions}>
      <label>검토 상태
        <select value={status} disabled={busy} onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
          setLoading(true);
          detailRequestId.current += 1;
          setSelected(null);
          setReason('');
        }}>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); void load(); }}>후보 목록 새로고침</button>
      <button type="button" disabled={busy} onClick={() => void collect()}>{busy ? '처리 중…' : 'OneMap 250건 지금 수집'}</button>
    </div>
    <p>자동 수집에는 서버 전용 OneMap 계정 환경변수가 필요합니다. 인증 토큰과 비밀번호는 화면·로그·데이터베이스에 저장하지 않습니다.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.success}>{message}</p>}
    {loading ? <p role="status">위치 후보 조회 중…</p> : !data ? <p>위치 후보를 불러오지 못했습니다.</p> : <>
      <p>총 {data.total}건 · {page}페이지</p>
      <div className={styles.tableScroll}>
        <table>
          <thead><tr><th scope="col">HDB 건물</th><th scope="col">OneMap 주소</th><th scope="col">수집·검토</th></tr></thead>
          <tbody>{data.items.map((item) => <tr key={item.id}>
            <td><button type="button" disabled={busy} onClick={() => void openCandidate(item)}>{item.block} {item.street}</button><small>{item.entityId ? '건물 연결됨' : '건물 연결 필요'}</small></td>
            <td>{item.addressText}<small>{item.postalCode ? `우편번호 ${item.postalCode}` : '우편번호 미확인'}</small></td>
            <td>{labels[item.status] ?? item.status} · v{item.version}<small>{item.fetchedAt.slice(0, 10)}</small>{!item.isCurrent && <small>이전 수집 버전</small>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!data.items.length && <p>이 상태의 위치 후보가 없습니다.</p>}
      <div className={styles.pagination}>
        <button type="button" disabled={busy || page <= 1} onClick={() => { setPage((value) => value - 1); setLoading(true); detailRequestId.current += 1; setSelected(null); }}>이전</button>
        <button type="button" disabled={busy || page * 25 >= data.total} onClick={() => { setPage((value) => value + 1); setLoading(true); detailRequestId.current += 1; setSelected(null); }}>다음</button>
      </div>
    </>}
    {selected && <section aria-label="선택한 OneMap 위치 후보">
      <h4>{selected.block} {selected.street}</h4>
      <p>{selected.addressText}{selected.postalCode ? ` · ${selected.postalCode}` : ''}</p>
      <dl>
        <dt>건물 연결</dt><dd>{selected.entityId ?? '정확히 연결된 건물 없음'}</dd>
        <dt>위도</dt><dd>{selected.latitude}</dd>
        <dt>경도</dt><dd>{selected.longitude}</dd>
        <dt>OneMap 검색 키</dt><dd>{selected.providerKey}</dd>
      </dl>
      <p>수집 {selected.fetchedAt} · 버전 {selected.version} · {selected.isCurrent ? '최신 후보' : '이전 후보'}</p>
      <p><a href="https://www.onemap.gov.sg/apidocs/" target="_blank" rel="noreferrer">OneMap API</a> · <a href="https://www.onemap.gov.sg/legal/opendatalicence.html" target="_blank" rel="noreferrer">Singapore Open Data Licence</a></p>
      <p>원자료 해시 {selected.contentHash}</p>
      {selected.status !== 'rejected' ? <>
        <label>개별 검토 사유 · 3자 이상
          <textarea disabled={busy} value={reason} maxLength={240} onChange={(event) => setReason(event.target.value)} />
        </label>
        {(!selected.entityId || !selected.isCurrent) && <p>정확한 건물 연결과 최신 수집 버전 확인 전에는 승인할 수 없습니다.</p>}
        <div className={styles.actions}>
          {selected.status === 'pending' && <button type="button" disabled={busy || reason.trim().length < 3 || !selected.entityId || !selected.isCurrent} onClick={() => void review('approved')}>개별 승인 · 검증 좌표 반영</button>}
          <button type="button" disabled={busy || reason.trim().length < 3} onClick={() => void review('rejected')}>{selected.status === 'approved' ? '승인 철회 · 좌표 공개 제거' : '개별 제외'}</button>
        </div>
      </> : <p>제외 결정과 사유가 이력에 저장된 후보입니다.</p>}
      {selected.audit && <details>
        <summary>검토 이력 {selected.audit.length}건</summary>
        {selected.audit.map((entry, index) => <p key={`${entry.next_version}-${index}`}>
          v{entry.previous_version} → v{entry.next_version} · {labels[entry.previous_status] ?? entry.previous_status} → {labels[entry.next_status] ?? entry.next_status}<br />
          {entry.reason} · {entry.actor} · {entry.reviewed_at}
        </p>)}
      </details>}
    </section>}
  </section>;
}
