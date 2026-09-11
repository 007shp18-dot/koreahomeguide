'use client';
import { useEffect, useState } from 'react';
import { briefText, safeHttps, type MorningBrief } from '@/lib/operations/morning-brief';
import styles from './workspace.module.css';

type Row = { report_date: string; state: string; report: MorningBrief | null; email_state: string };
const endpoint = '/api/internal/morning-brief/';
const mailLabels: Record<string, string> = { 'not-configured': '메일 연결 필요', pending: '메일 접수 여부 확인 필요', accepted: '메일 서비스 접수 완료 · 수신 보장 아님', failed: '메일 실패 또는 접수 여부 불명 · 자동 재전송하지 않음' };
export function MorningBriefPanel() {
  const [rows, setRows] = useState<Row[]>([]); const [selected, setSelected] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('불러오는 중…');
  useEffect(() => { let active = true; void fetch(endpoint, { cache: 'no-store' }).then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<{ reports: Row[] }>; }).then(data => { if (active) { setRows(data.reports); setMessage(''); } }).catch(() => { if (active) setMessage('보고서를 불러오지 못했습니다. 관리자 로그인·DB 연결을 확인하세요.'); }); return () => { active = false; }; }, []);
  async function generate() {
    setBusy(true); setMessage('주요 화면과 운영 자료를 확인하고 있습니다…');
    try {
      const result = await fetch(endpoint, { method: 'POST' }); if (!result.ok) throw new Error();
      const outcome = await result.json() as { status: string };
      const response = await fetch(endpoint, { cache: 'no-store' }); if (!response.ok) throw new Error();
      const data = await response.json() as { reports: Row[] }; setRows(data.reports); setSelected('');
      setMessage(outcome.status === 'completed' ? '오늘 보고서를 저장했습니다.' : '오늘 보고서가 이미 있거나 생성 중입니다. 생성 중이면 잠시 후 다시 조회하세요.');
    } catch { setMessage('생성 실패: 운영 환경·관리자 로그인·DB 상태를 확인하세요.'); } finally { setBusy(false); }
  }
  const row = rows.find(item => item.report_date === selected) ?? rows[0];
  return <section aria-label="아침 브리핑">
    <p className={styles.eyebrow}>DAILY OPERATIONS</p><h2>오늘 SignedPrice에서 할 일</h2>
    <p>매일 오전 8시 · 한국시간. 수정할 일, 최근 콘텐츠, 네 도시의 부동산 이슈 후보를 근거와 함께 정리합니다.</p>
    <div className={styles.actions}><button type="button" onClick={() => void generate()} disabled={busy}>{busy ? '확인 중…' : '오늘 보고서 생성·조회'}</button><label>날짜 <select value={row?.report_date ?? ''} onChange={event => setSelected(event.target.value)}>{rows.map(item => <option key={item.report_date} value={item.report_date}>{item.report_date}</option>)}</select></label></div>
    {message && <p role="status">{message}</p>}
    {row ? <><p>생성 상태: {row.state} · {mailLabels[row.email_state] ?? row.email_state}</p>{row.report && <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.8 }}>{briefText(row.report).split('\n').map((line, index) => <div key={index}>{safeHttps(line) ? <a href={line} target="_blank" rel="noopener noreferrer">{line}</a> : line || '\u00a0'}</div>)}</div>}</> : <p>아직 저장된 보고서가 없습니다.</p>}
  </section>;
}
