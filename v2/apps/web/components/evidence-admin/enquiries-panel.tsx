'use client';
import { useState } from 'react';
import { api, ClientError, useRemote } from '../questions/api';
import { CITY_BUYING, cityText } from '@/content/city-buying-content';
import type { PurchaseEnquiryInput } from '@/lib/operator/enquiry-contract';
import styles from './workspace.module.css';
import enquiryStyles from './enquiries-panel.module.css';
type Item = { id: string; payload: PurchaseEnquiryInput; status: 'new' | 'done'; created_at: string };
const purposes = { 'own-use': '실거주', rental: '임대 투자', both: '실거주·임대 검토', exploring: '탐색 중' };
const timings = { soon: '3개월 이내', 'this-year': '3~12개월', later: '1년 이후', undecided: '미정' };
export function EnquiriesPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [filter, setFilter] = useState('new'), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(''), [error, setError] = useState('');
  const result = useRemote<{ items: Item[]; hasMore: boolean }>(`/api/internal/purchase-enquiries/?status=${filter}&page=${page}`, revision);
  async function update(id: string, action: string) {
    if (busy || (action === 'delete' && !window.confirm('문의와 이메일을 영구 삭제할까요?'))) return;
    setBusy(id); setError('');
    try { await api('/api/internal/purchase-enquiries/', { id, action }); setRevision(v => v + 1); }
    catch (cause) { if (cause instanceof ClientError && cause.code === 'unauthorized') onUnauthorized(); else setError('처리하지 못했습니다. 다시 시도하세요.'); }
    finally { setBusy(''); }
  }
  return <div className={enquiryStyles.root}>
    <p className={styles.notice}>사이트에서 접수한 구매상담입니다. 이메일 주소를 누르면 답장을 작성할 수 있습니다. 자동 알림 메일은 발송하지 않습니다. 접수 후 90일이 지난 문의는 매일 정리됩니다.</p>
    <div className={styles.actions}><label>상태 <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="new">새 문의</option><option value="done">처리 완료</option><option value="all">전체</option></select></label><button onClick={() => setRevision(v => v + 1)}>새로고침</button></div>
    {(error || result.error) && <p role="alert">{error || (result.error === 'unauthorized' ? '로그인이 만료됐습니다.' : '문의를 불러오지 못했습니다.')}{result.error === 'unauthorized' && <button onClick={onUnauthorized}>다시 로그인</button>}</p>}
    {!result.data && !result.error && <p role="status">문의 불러오는 중…</p>}
    {result.data?.items.length === 0 && <p>해당하는 문의가 없습니다.</p>}
    {result.data?.items.map(item => <article key={item.id} className={enquiryStyles.item}>
      <header><h2>{cityText(CITY_BUYING[item.payload.city].name, 'ko')} · {purposes[item.payload.purpose]}</h2><span>{item.status === 'new' ? '새 문의' : '처리 완료'}</span></header>
      <a href={`mailto:${encodeURIComponent(item.payload.email)}?subject=${encodeURIComponent('[SignedPrice] 구매상담 답변')}`}>{item.payload.email}</a>
      <p>{new Date(item.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} · {item.payload.locale}</p>
      <p>예산 {item.payload.budget ? `${new Intl.NumberFormat('ko-KR').format(Number(item.payload.budget))} ${CITY_BUYING[item.payload.city].currency}` : '미정'} · {timings[item.payload.timing]}</p>
      <p className={enquiryStyles.message}>{item.payload.context || '추가 질문 없음'}</p>
      <div className={styles.actions}><button disabled={Boolean(busy)} onClick={() => void update(item.id, item.status === 'new' ? 'done' : 'new')}>{item.status === 'new' ? '처리 완료로 표시' : '새 문의로 되돌리기'}</button><button disabled={Boolean(busy)} onClick={() => void update(item.id, 'delete')}>문의 삭제</button></div>
      <small>접수 번호 {item.id}</small>
    </article>)}
    <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage(v => v - 1)}>이전</button><span>{page}</span><button disabled={!result.data?.hasMore} onClick={() => setPage(v => v + 1)}>다음</button></div>
  </div>;
}
