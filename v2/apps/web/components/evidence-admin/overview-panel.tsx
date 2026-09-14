'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminCities, overviewTotals, type AdminCity, type AdminOverview } from '@/lib/admin/overview';
import { marketJobLabel } from '@/lib/data-operations/collection-view';
import styles from './overview-panel.module.css';
const issueLabels: Record<string, string> = { incomplete: '항목·단위 확인', duplicate: '중복 후보', outdated: '관측 시점 확인', qualified: '기준 충족 · 검토 대기' };
const stateLabels: Record<string, string> = { draft: '초안', failed: '발행 실패', cancelled: '예약 취소' };
const formatCount = (value: number | null | undefined, unit: string) => value == null ? '—' : `${value.toLocaleString('ko-KR')}${unit}`;
const formatTime = (value: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
export function OverviewPanel({ onReview, onEditorial, onCollection, onRules, onUnauthorized }: {
  onReview: (city: string, quality: string) => void; onEditorial: (slug?: string) => void;
  onCollection: () => void; onRules: () => void; onUnauthorized: () => void;
}) {
  const [city, setCity] = useState<AdminCity>('all');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const sequence = useRef(0);
  const load = useCallback((signal?: AbortSignal) => {
    const id = ++sequence.current;
    const active = () => id === sequence.current && !signal?.aborted;
    return Promise.resolve().then(() => fetch(`/api/internal/admin-overview/?city=${city}`, { cache: 'no-store', signal }))
      .then(async response => {
        if (!active()) return;
        if (response.status === 401) { onUnauthorized(); return; }
        if (!response.ok) throw new Error('운영 현황을 불러오지 못했습니다. 새로고침해 주세요.');
        const result: AdminOverview = await response.json();
        if (active()) { setData(result); setError(''); }
      }).catch(cause => {
        if (active()) { setData(null); setError(cause instanceof Error ? cause.message : '조회 실패'); }
      }).finally(() => { if (active()) setLoading(false); });
  }, [city, onUnauthorized]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const current = data?.city === city ? data : null;
  const totals = current ? overviewTotals(current) : null;
  const issues = current?.issues?.filter(issue => filter === 'all' || issue.quality === filter);
  const jobs = current?.jobs?.filter(job => job.lastAttemptAt).sort((a, b) => Date.parse(b.lastAttemptAt!) - Date.parse(a.lastAttemptAt!));
  return <section className={styles.workspace} aria-label="운영 현황 대시보드">
    <div className={styles.controls}><span className={styles.period}>최근 실행 기준</span><div className={styles.cities} aria-label="도시 선택">{adminCities.map(item => <button key={item.id} type="button" aria-pressed={city === item.id} onClick={() => { if (city !== item.id) { setLoading(true); setError(''); setFilter('all'); setCity(item.id); } }}>{item.label}</button>)}</div><button disabled={loading} type="button" onClick={() => { setLoading(true); void load(); }}>{loading ? '조회 중…' : '새로고침'}</button></div>
    {error && <p role="alert" className={styles.alert}>{error}</p>}
    {current?.unavailable.length ? <p role="alert" className={styles.alert}>{current.unavailable.join(' · ')} 조회 실패. 확인하지 못한 수치는 —로 표시합니다.</p> : null}
    <div className={styles.metrics}>
      <button type="button" onClick={onCollection}><span>수집 작업 성공</span><strong>{formatCount(totals?.succeeded, '개')}</strong><small>작업별 가장 최근 실행 결과</small></button>
      <button type="button" onClick={onCollection}><span>DB 저장·갱신</span><strong>{formatCount(totals?.stored, '건')}</strong><small>성공 작업 기준 · 사이트 공개와 별개</small></button>
      <button type="button" onClick={() => onReview(city, '')} className={styles.attention}><span>자료 확인 필요</span><strong>{formatCount(totals?.pending, '건')}</strong><small>내부 참고자료 검토 대기</small></button>
      <button type="button" onClick={() => onEditorial()}><span>기사 발행 대기</span><strong>{formatCount(totals?.articles, '편')}</strong><small>초안·발행 실패·예약 취소</small></button>
    </div>
    <p className={styles.updated}>{current ? `화면 갱신 ${formatTime(current.refreshedAt)} KST` : loading ? '운영 기록을 확인하고 있습니다.' : '운영 기록을 확인할 수 없습니다.'} · 수집 기록과 검토 대기는 서로 다른 자료입니다.</p>
    <div className={styles.columns}><div>
      <section className={styles.card}><div className={styles.heading}><h2>확인 필요한 항목</h2><button type="button" onClick={() => onReview(city, '')}>전체 보기 →</button></div><p>내부 참고자료를 문제 유형별로 모았습니다.</p>
        <div className={styles.chips}>{([['all', '전체'], ...Object.entries(issueLabels)] as [string, string][]).map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
        {!current?.issues ? <p className={styles.empty}>{loading ? '자료 확인 중…' : '검토 현황을 확인할 수 없습니다.'}</p> : !issues?.length ? <p className={styles.empty}>이 조건에서 확인할 자료가 없습니다.</p> : <div className={styles.table}><table><thead><tr><th>확인 항목</th><th>도시</th><th>건수</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>{issues.map(issue => <tr key={`${issue.market}-${issue.quality}`}><td>{issueLabels[issue.quality] ?? '분류 확인'}</td><td>{adminCities.find(city => city.id === issue.market)?.label ?? issue.market}</td><td>{formatCount(issue.count, '건')}</td><td><button type="button" onClick={() => onReview(issue.market, issue.quality)} aria-label={`${adminCities.find(city => city.id === issue.market)?.label ?? issue.market} ${issueLabels[issue.quality]} 살펴보기`}>살펴보기 →</button></td></tr>)}</tbody></table></div>}
        <p className={styles.note}>‘기준 충족’은 자동 승인·공개 완료를 뜻하지 않습니다.</p>
      </section>
      <section className={styles.card}><div className={styles.heading}><h2>최근 수집 처리</h2><button type="button" onClick={onCollection}>수집 상태 →</button></div>
        {!jobs ? <p className={styles.empty}>{loading ? '수집 기록 확인 중…' : '수집 기록을 확인할 수 없습니다.'}</p> : !jobs.length ? <p className={styles.empty}>기록된 실행이 없습니다.</p> : <ul className={styles.activity}>{jobs.slice(0, 5).map(job => <li key={job.job}><time>{formatTime(job.lastAttemptAt!)}</time><div><strong>{marketJobLabel(job.job)}</strong><span className={job.state === 'failed' ? styles.warning : ''}>{job.state === 'succeeded' ? '수집 성공' : job.state === 'failed' ? '수집 실패' : '진행 상태 확인'}{job.unlinked > 0 ? ` · 지역 미연결 ${job.unlinked}건` : ''}{job.anomaly ? ' · 수집량 확인 필요' : ''}</span></div></li>)}</ul>}
      </section>
    </div><div>
      <section className={styles.card}><div className={styles.heading}><h2>기사 발행 대기</h2><button type="button" onClick={() => onEditorial()}>전체 보기 →</button></div><p>저장된 원고를 검토하고 발행하세요.</p>
        {!current?.editorial ? <p className={styles.empty}>{loading ? '원고 확인 중…' : '원고 목록을 확인할 수 없습니다.'}</p> : !current.editorial.articles.length ? <p className={styles.empty}>발행 대기 글이 없습니다.</p> : <ul className={styles.articles}>{current.editorial.articles.map(article => <li key={article.slug}><div><strong>{article.title}</strong><span className={styles.badge}>{stateLabels[article.state] ?? article.state}</span></div><small>{article.locale} · {adminCities.find(city => city.id === article.market)?.label ?? '공통'}</small><button type="button" onClick={() => onEditorial(article.slug)}>원고 찾기 →</button></li>)}</ul>}
        <button type="button" className={styles.primary} onClick={() => onEditorial()}>글 작성·관리</button>
      </section>
      <section className={styles.card}><div className={styles.heading}><h2>처리 기준</h2><button type="button" onClick={onRules}>출처 관리 →</button></div><ul className={styles.rules}><li><strong>공식 거래 수집</strong><span>수집 작업의 검사와 저장 결과를 확인합니다.</span></li><li><strong>참고자료 검토</strong><span>출처 상태·필수 항목·중복·시점을 점검합니다.</span></li><li><strong>사이트 공개</strong><span>저장·승인과 공개 상태를 구분합니다.</span></li></ul></section>
    </div></div>
  </section>;
}
