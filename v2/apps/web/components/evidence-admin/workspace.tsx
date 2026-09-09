'use client';
import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { bases, markets, metrics, readiness, sourceKinds, statuses, tiers, units, type Command, type Evidence, type PoolData, type Source } from '@/lib/evidence-pool/contract';
import { EvidenceForm, Options, SourceForm } from './forms';
import { ReviewPanel } from './review-panel';
import { assessEvidence, qualityLabels } from '@/lib/evidence-pool/quality';
import type { BulkCommand, BulkPreview } from '@/lib/evidence-pool/bulk';
import { BulkReview } from './bulk-review';
import { CollectionPanel } from './collection-panel';
import { ResearchPanel } from './research-panel';
import styles from './workspace.module.css';

const endpoint = '/api/internal/evidence-pool/';
const errors: Record<string, string> = {
  unauthorized: '로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인하세요.',
  admin_not_configured: '관리화면 전용 비밀번호 설정이 필요합니다. Vercel의 Production 환경에 EVIDENCE_ADMIN_SECRET을 32자 이상으로 설정하고 재배포하세요.',
  database_not_configured: '저장소 연결이 설정되지 않았습니다. 운영 설정을 확인하세요.',
  storage_unavailable: '자료를 불러오거나 저장하지 못했습니다. 연결과 DB 초기화 상태를 확인하고 다시 시도하세요.',
  invalid_payload: '입력값을 확인하세요. URL은 HTTPS 주소이며 ?와 #이 없어야 합니다. 유효 종료일은 관측일 이후여야 합니다.',
  invalid_origin: '요청을 확인할 수 없습니다. 이 페이지를 새로 열고 다시 시도하세요.',
  conflict: '중복 자료이거나 다른 작업에서 변경된 자료입니다. 출처 승인·유효기간도 확인하고 목록을 새로고침하세요.',
};
class ApiError extends Error { constructor(public code: string) { super(errors[code] ?? '요청에 실패했습니다. 잠시 후 다시 시도하세요.'); } }
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const body = await response.json(); if (!response.ok) throw new ApiError(body.error ?? 'storage_unavailable'); return body as T;
}
function post(body: unknown): RequestInit { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

export function EvidenceAdmin({ initialAuthenticated, initialData = null }: { initialAuthenticated: boolean; initialData?: PoolData | null }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const expireSession = useCallback(() => setAuthenticated(false), []);
  const [data, setData] = useState<PoolData | null>(initialData);
  const [tab, setTab] = useState<'evidence' | 'sources' | 'create' | 'research' | 'collection'>('evidence');
  const [selected, setSelected] = useState<{ entity: 'source' | 'evidence'; id: string } | null>(null);
  const [filters, setFilterValues] = useState({ market: '', status: '', quality: '', q: '', page: 1, sourcePage: 1 });
  const [checked, setChecked] = useState<string[]>([]);
  const [bulkScope, setBulkScope] = useState<'selected' | 'filter'>('selected');
  const [bulkRevision, setBulkRevision] = useState(0);
  const [loading, setLoading] = useState(!initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const mutationLock = useRef(false);
  function setFilters(next: typeof filters) { setChecked([]); setBulkScope('selected'); setLoading(true); setFilterValues(next); }
  const showError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : '요청에 실패했습니다. 다시 시도하세요.');
    if (cause instanceof ApiError && cause.code === 'unauthorized') { setAuthenticated(false); setData(null); }
  }, []);
  const load = useCallback(() => {
    const id = ++requestId.current;
    const query = new URLSearchParams({ ...filters, page: String(filters.page), sourcePage: String(filters.sourcePage) });
    return api<PoolData>(`${endpoint}?${query}`).then((result) => {
      if (id === requestId.current) { setData(result); setChecked([]); setBulkRevision(v => v + 1); setError(''); }
    }).catch((cause: unknown) => { if (id === requestId.current) showError(cause); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [filters, showError]);
  useEffect(() => { if (authenticated) void load(); return () => { requestId.current += 1; }; }, [authenticated, load]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const secret = String(new FormData(form).get('secret'));
    setBusy(true); setError('');
    try { await api('/api/internal/evidence-session/', post({ secret })); form.reset(); setLoading(true); setAuthenticated(true); }
    catch (cause) { showError(cause); } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await api('/api/internal/evidence-session/', { method: 'DELETE' }); requestId.current += 1; setAuthenticated(false); setData(null); setSelected(null); setMessage(''); }
    catch (cause) { showError(cause); } finally { setBusy(false); }
  }
  async function mutate(command: Command) {
    if (mutationLock.current) return false;
    mutationLock.current = true; setBusy(true); setError(''); setMessage('');
    try { await api(endpoint, post(command)); setMessage('변경 내용과 이력을 저장했습니다.'); setLoading(true); await load(); return true; }
    catch (cause) { showError(cause); return false; }
    finally { mutationLock.current = false; setBusy(false); }
  }
  async function runBulk(command: BulkCommand): Promise<BulkPreview | null> {
    if (mutationLock.current) return null;
    mutationLock.current = true; setBusy(true); setError('');
    try {
      const result = await api<BulkPreview>(endpoint, post(command));
      if (command.action === 'bulk-review') { setMessage(`${result.eligible}건의 결정과 이력을 저장했습니다.`); setChecked([]); setBulkRevision(v => v + 1); setLoading(true); await load(); }
      return result;
    } catch (cause) { showError(cause); return null; } finally { mutationLock.current = false; setBusy(false); }
  }
  const selectedRow = selected?.entity === 'source' ? data?.sources.find((row) => row.id === selected.id) : data?.evidence.find((row) => row.id === selected?.id);
  const today = new Date().toISOString().slice(0, 10);
  if (!authenticated) return <main className={styles.login}><Link href="/" prefetch={false} className={styles.brand}>signedprice<span>INTERNAL</span></Link><section className={styles.loginCard}>
    <p className={styles.eyebrow}>PROPERTY EVIDENCE</p><h1>관리자 로그인</h1><p>부동산 자료를 등록하고 근거를 검토하는 내부 공간입니다.</p>
    <form onSubmit={login}><label>관리화면 비밀번호<input name="secret" type="password" required autoComplete="current-password" maxLength={1024} /></label><button type="submit" disabled={busy} className={styles.primary}>{busy ? '확인 중…' : '로그인'}</button></form>
    {error && <p role="alert" className={styles.error}>{error}</p>}<small>EVIDENCE_ADMIN_SECRET에 설정한 전용 비밀번호를 입력하세요. 기존 운영 키와는 별개입니다. 로그인은 8시간 유지됩니다.</small>
  </section></main>;
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><Link href="/" prefetch={false} className={styles.brand}>signedprice<span>INTERNAL</span></Link><p className={styles.eyebrow}>자료 운영</p><nav aria-label="관리 메뉴">
      <button type="button" aria-current={tab === 'evidence' ? 'page' : undefined} onClick={() => { setTab('evidence'); setSelected(null); }}>자료 검토 <span>{data?.counts.pending ?? '—'}</span></button>
      <button type="button" aria-current={tab === 'sources' ? 'page' : undefined} onClick={() => { setTab('sources'); setSelected(null); }}>출처 관리</button>
      <button type="button" aria-current={tab === 'create' ? 'page' : undefined} onClick={() => { setTab('create'); setSelected(null); }}>자료 등록</button>
      <button type="button" aria-current={tab === 'research' ? 'page' : undefined} onClick={() => { setTab('research'); setSelected(null); }}>Tool 공유 데이터</button>
      <button type="button" aria-current={tab === 'collection' ? 'page' : undefined} onClick={() => { setTab('collection'); setSelected(null); }}>정기 수집 운영</button>
    </nav><div className={styles.sidebarFoot}><p>내부 전용 · 공개되지 않음</p><small>수집·원문 검토·자료 승인·사이트 공개 시점을 구분해 확인하세요.</small><button type="button" disabled={busy} onClick={() => void logout()}>로그아웃</button></div></aside>
    <main className={styles.main}>
      <header className={styles.header}><div><p className={styles.eyebrow}>EVIDENCE WORKSPACE</p><h1>{tab === 'collection' ? '정기 수집 운영' : tab === 'research' ? 'Tool 공유 데이터' : tab === 'sources' ? '출처 관리' : tab === 'create' ? '자료 등록' : '자료 검토'}</h1><p>{tab === 'sources' ? '자료를 가져온 출처부터 확인하세요.' : tab === 'create' ? '원문 대신 확인 가능한 값과 출처를 남기세요.' : '검토 대기 자료를 확인하고, 분석에 쓸 근거를 정리하세요.'}</p></div><button type="button" disabled={loading || busy} onClick={() => { setLoading(true); void load(); }}>{loading ? '불러오는 중…' : '새로고침'}</button></header>
      {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.success}>{message}</p>}
      {data && <section className={styles.stats} aria-label="전체 자료 현황">{([['pending', '검토 대기'], ['approved', '승인 자료'], ['expired', '유효기간 만료'], ['withdrawn', '철회']] as const).map(([key, label]) => <button type="button" key={key} disabled={busy} onClick={() => { setTab('evidence'); setSelected(null); setFilters({ ...filters, status: key, page: 1 }); }}><span>{label}</span><strong>{data.counts[key]}</strong></button>)}</section>}
      {!data && <section className={styles.panel}><p role="status">{loading ? '저장된 자료를 불러오고 있습니다…' : '자료에 연결하지 못했습니다. 설정을 확인한 뒤 새로고침하세요.'}</p></section>}
      {data && (data.sourceTotal ?? 0) > 100 && <div className={styles.pagination} style={{ marginBottom: '1rem' }} aria-label="출처 페이지"><span>선택할 출처 {filters.sourcePage} / {Math.ceil((data.sourceTotal ?? 0) / 100)} 페이지</span><button type="button" disabled={loading || busy || filters.sourcePage <= 1} onClick={() => { if (selected?.entity === 'source') setSelected(null); setFilters({ ...filters, sourcePage: filters.sourcePage - 1 }); }}>이전 출처</button><button type="button" disabled={loading || busy || filters.sourcePage * 100 >= (data.sourceTotal ?? 0)} onClick={() => { if (selected?.entity === 'source') setSelected(null); setFilters({ ...filters, sourcePage: filters.sourcePage + 1 }); }}>다음 출처</button></div>}
      {data && <div className={selectedRow ? styles.split : ''}>
        <section className={styles.panel}>
          {tab === 'collection' && <CollectionPanel onUnauthorized={expireSession} />}
          {tab === 'research' && <ResearchPanel />}
          {tab === 'create' && <><h2>새 자료</h2><EvidenceForm sources={data.sources} busy={busy} submit={mutate} /></>}
          {tab === 'sources' && <><h2>출처 등록</h2><SourceForm busy={busy} submit={mutate} /><h2 className={styles.sectionTitle}>등록된 출처 <small>{data.sourceTotal ?? data.sources.length}건 · 현재 페이지 {data.sources.length}건</small></h2>
            {!data.sources.length ? <p className={styles.empty}>아직 등록된 출처가 없습니다. 위에서 첫 출처를 등록하세요.</p> : <ul className={styles.sourceList}>{data.sources.map((source) => <li key={source.id}><button type="button" onClick={() => setSelected({ entity: 'source', id: source.id })}><strong>{source.name}</strong><span>{sourceKinds[source.kind]} · {statuses[source.status]}</span></button></li>)}</ul>}
          </>}
          {tab === 'evidence' && <>
            <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); const values = new FormData(e.currentTarget); setSelected(null); setFilters({ ...filters, market: String(values.get('market')), status: String(values.get('status')), quality: String(values.get('quality')), q: String(values.get('q')).trim(), page: 1 }); }}>
              <label>시장<select disabled={busy} name="market" defaultValue={filters.market}><option value="">전체 시장</option><Options values={markets} /></select></label>
              <label>상태<select disabled={busy} name="status" key={filters.status} defaultValue={filters.status}><option value="">전체 상태</option><Options values={statuses} /><option value="expired">유효기간 만료</option></select></label>
              <label>수집 점검<select disabled={busy} name="quality" defaultValue={filters.quality}><option value="">전체</option><Options values={qualityLabels} /></select></label>
              <label>지역·건물·출처<input disabled={busy} name="q" defaultValue={filters.q} maxLength={120} placeholder="검색어 입력" /></label><button type="submit" disabled={loading || busy}>조회</button>
            </form>
            <div className={styles.actions}><button type="button" disabled={loading || busy} onClick={() => { setChecked(data.evidence.map(r => r.id)); setBulkScope('selected'); }}>현재 페이지 선택</button><button type="button" disabled={loading || busy} onClick={() => { setChecked([]); setBulkScope('selected'); }}>선택 해제</button><button type="button" disabled={loading || busy || !data.total} onClick={() => { setChecked([]); setBulkScope('filter'); }}>필터 전체 {data.total}건 선택</button></div>
            {(checked.length > 0 || bulkScope === 'filter') && <BulkReview key={JSON.stringify([filters, checked, bulkScope, bulkRevision])} scope={{ market: filters.market, status: filters.status, quality: filters.quality, query: filters.q, ids: bulkScope === 'filter' ? null : checked }} disabled={loading || busy} run={runBulk} />}
            {!data.evidence.length ? <div className={styles.empty}><h2>{data.total === 0 && !filters.q && !filters.market && !filters.status ? '등록된 자료가 없습니다' : '조건에 맞는 자료가 없습니다'}</h2><p>출처 등록 → 자료 입력 → 출처 승인 → 자료 검토 순서로 진행하세요.</p><button type="button" onClick={() => setTab('sources')}>출처 관리</button></div> : <div className={styles.tableScroll}><table><caption className={styles.caption}>조회 {data.total}건 · 금액 단위와 성격을 확인하세요</caption><thead><tr><th scope="col">선택</th><th scope="col">자료</th><th scope="col">금액</th><th scope="col">검토 상태</th><th scope="col">활용 준비</th></tr></thead><tbody>{data.evidence.map((row) => {
              const ready = readiness(row, today); const assessment = assessEvidence(row, today);
              return <tr key={row.id} className={selected?.id === row.id ? styles.selectedRow : ''}><td><input type="checkbox" aria-label={`${row.building || row.area} 선택`} checked={checked.includes(row.id)} disabled={loading || busy} onChange={e => { setBulkScope('selected'); setChecked(values => e.target.checked ? [...values, row.id] : values.filter(id => id !== row.id)); }} /></td><td><button type="button" className={styles.rowLink} onClick={() => setSelected({ entity: 'evidence', id: row.id })}>{row.building || row.area}</button><small>{markets[row.market]} · {row.area} · {metrics[row.metric]}</small><small>{row.sourceName} · {row.observedPrecision === 'month' ? row.observedPeriod : row.observedOn}</small></td><td><strong>{row.amount.toLocaleString('en-US')} {row.currency}</strong><small>{bases[row.basis]} · {units[row.unit]}</small></td><td><span className={styles.badge} data-status={row.status}>{statuses[row.status]}</span><small>{tiers[row.tier]}</small></td><td><span>{qualityLabels[assessment.quality]}</span><small>{assessment.use}</small><small>{assessment.reasons[0] ?? (ready.ready ? '활용 전 동일 조건 비교 필요' : ready.reasons[0])}</small></td></tr>;
            })}</tbody></table></div>}
            <div className={styles.pagination}><button type="button" disabled={loading || busy || filters.page <= 1} onClick={() => { setSelected(null); setFilters({ ...filters, page: filters.page - 1 }); }}>이전</button><span>{filters.page} / {Math.max(1, Math.ceil(data.total / 25))}</span><button type="button" disabled={loading || busy || filters.page * 25 >= data.total} onClick={() => { setSelected(null); setFilters({ ...filters, page: filters.page + 1 }); }}>다음</button></div>
          </>}
        </section>
        {selected && selectedRow && <aside className={styles.panel} aria-label="선택 자료 상세"><div className={styles.detailHeader}><h2>{selected.entity === 'source' ? (selectedRow as Source).name : (selectedRow as Evidence).building || (selectedRow as Evidence).area}</h2><button type="button" onClick={() => setSelected(null)}>닫기</button></div>
          <p><span className={styles.badge} data-status={selectedRow.status}>{statuses[selectedRow.status]}</span> · 버전 {selectedRow.version}</p><a href={selectedRow.url} target="_blank" rel="noopener noreferrer" className={styles.external}>출처 자료 열기 ↗</a>
          {selected.entity === 'evidence' && <div className={styles.notice}><strong>활용 준비 점검</strong><p>{assessEvidence(selectedRow as Evidence, today).use} · {qualityLabels[assessEvidence(selectedRow as Evidence, today).quality]}</p><ul>{readiness(selectedRow as Evidence, today).reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>{readiness(selectedRow as Evidence, today).ready && <p>기초 요건을 충족했습니다. 비교 대상의 시점·면적·항목·단위·금액 성격 일치는 별도로 확인해야 합니다.</p>}</div>}
          <ReviewPanel key={`${selected.entity}-${selectedRow.id}-${selectedRow.version}`} entity={selected.entity} row={selectedRow} busy={busy} submit={mutate} />
          {selected.entity === 'evidence' && selectedRow.status !== 'withdrawn' && <details className={styles.correction}><summary>등록값 정정</summary><EvidenceForm key={`${selectedRow.id}-${selectedRow.version}`} sources={data.sources} busy={busy} submit={mutate} existing={selectedRow as Evidence} /></details>}
        </aside>}
      </div>}
      <footer className={styles.footer}>승인 건수에는 만료·출처 철회 자료가 포함될 수 있습니다. 실제 활용 여부는 각 자료의 준비 점검을 확인하세요.</footer>
    </main>
  </div>;
}
