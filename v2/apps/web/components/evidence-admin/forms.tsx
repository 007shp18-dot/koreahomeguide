'use client';
import React, { useState, type FormEvent } from 'react';
import { bases, markets, metrics, sourceKinds, tiers, units, type Command, type Evidence, type EvidenceInput, type Source } from '@/lib/evidence-pool/contract';
import styles from './workspace.module.css';

export function Options({ values }: { values: Record<string, string> }) {
  return Object.entries(values).map(([value, label]) => <option value={value} key={value}>{label}</option>);
}
type Submit = (command: Command) => Promise<boolean>;
export function SourceForm({ busy, submit }: { busy: boolean; submit: Submit }) {
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (await submit({ action: 'create-source', input: { name: String(data.get('name')).trim(), url: String(data.get('url')).trim(), kind: String(data.get('kind')) as Source['kind'] } })) form.reset();
  }
  return <form onSubmit={save}><fieldset disabled={busy} className={styles.formGrid}>
    <label>출처 이름<input name="name" required minLength={2} maxLength={120} placeholder="기관·서비스·커뮤니티명" /></label>
    <label>출처 유형<select name="kind"><Options values={sourceKinds} /></select></label>
    <label className={styles.full}>출처 URL<input name="url" type="url" required maxLength={1500} placeholder="https://…" /><small>HTTPS 주소만 입력하세요. 추적 매개변수와 # 뒷부분은 제거하세요.</small></label>
    <p className={`${styles.hint} ${styles.full}`}>r/dubairealestate도 후보 출처로 등록할 수 있습니다. 자동 수집은 시작되지 않으며, 등록 후 별도 승인이 필요합니다.</p>
    <button className={styles.primary} type="submit">{busy ? '저장 중…' : '출처 등록'}</button>
  </fieldset></form>;
}
export function EvidenceForm({ sources, busy, submit, existing }: { sources: Source[]; busy: boolean; submit: Submit; existing?: Evidence }) {
  const [market, setMarket] = useState<EvidenceInput['market']>(existing?.market ?? 'dubai');
  const [sourceId, setSourceId] = useState(existing?.sourceId ?? '');
  const currency = { seoul: 'KRW', singapore: 'SGD', dubai: 'AED' }[market];
  const available = sources.filter((source) => source.status !== 'withdrawn' && source.status !== 'rejected');
  const currentSourceAvailable = existing && existing.sourceStatus !== 'withdrawn' && existing.sourceStatus !== 'rejected';
  // Preserve the current source across source-directory pages, never substitute it.
  if (existing && currentSourceAvailable && !available.some((source) => source.id === existing.sourceId)) {
    available.push({ id: existing.sourceId, name: existing.sourceName, status: existing.sourceStatus, kind: existing.sourceKind, url: existing.url, version: 1, createdAt: '' });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const input: EvidenceInput = {
      sourceId: String(data.get('sourceId')), market, currency: currency as EvidenceInput['currency'],
      tier: String(data.get('tier')) as EvidenceInput['tier'], metric: String(data.get('metric')) as EvidenceInput['metric'],
      basis: String(data.get('basis')) as EvidenceInput['basis'], unit: String(data.get('unit')) as EvidenceInput['unit'],
      amount: Number(data.get('amount')), area: String(data.get('area')).trim(), building: String(data.get('building')).trim(),
      sizeSqm: data.get('sizeSqm') ? Number(data.get('sizeSqm')) : null,
      observedOn: String(data.get('observedOn')), expiresOn: String(data.get('expiresOn')), url: String(data.get('url')).trim(),
    };
    const command: Command = existing ? { action: 'correct', id: existing.id, version: existing.version, input, reason: String(data.get('reason')).trim() } : { action: 'create-evidence', input };
    if (await submit(command) && !existing) { form.reset(); setMarket('dubai'); setSourceId(''); }
  }
  return <form onSubmit={save}>
    {!available.length && <p className={styles.notice}>먼저 출처를 등록하세요. 제외·철회된 출처로는 새 자료를 등록할 수 없습니다.</p>}
    {existing && !currentSourceAvailable && <p className={styles.notice}>기존 출처가 제외·철회되었습니다. 근거를 재확인하고 출처를 직접 다시 선택하세요.</p>}
    <fieldset disabled={busy || !available.length} className={styles.formGrid}>
      <label className={styles.full}>출처<select name="sourceId" required value={available.some((source) => source.id === sourceId) ? sourceId : ''} onChange={(event) => setSourceId(event.target.value)}><option value="" disabled>출처 선택</option>{available.map((source) => <option value={source.id} key={source.id}>{source.name}{source.status === 'pending' ? ' · 미승인' : ''}</option>)}</select></label>
      <label>시장<select value={market} onChange={(e) => setMarket(e.target.value as EvidenceInput['market'])}><Options values={markets} /></select></label>
      <label>자료 분류<select name="tier" defaultValue={existing?.tier ?? 'supporting'}><Options values={tiers} /></select></label>
      <label>항목<select name="metric" defaultValue={existing?.metric ?? 'rent'}><Options values={metrics} /></select></label>
      <label>금액의 성격<select name="basis" defaultValue={existing?.basis ?? 'reported'}><Options values={bases} /></select></label>
      <label>금액 · {currency}<input name="amount" type="number" min="0" max="1000000000000000" step="any" required defaultValue={existing?.amount} /></label>
      <label>금액 단위<select name="unit" defaultValue={existing?.unit ?? 'annual'}><Options values={units} /></select></label>
      <label>지역<input name="area" required minLength={2} maxLength={120} defaultValue={existing?.area} /></label>
      <label>건물 · 선택<input name="building" maxLength={160} defaultValue={existing?.building} /></label>
      <label>면적 ㎡ · 선택<input name="sizeSqm" type="number" min="0.01" max="100000" step="any" defaultValue={existing?.sizeSqm ?? ''} /></label>
      <label>거래·관측일<input name="observedOn" type="date" required defaultValue={existing?.observedOn} /></label>
      <label>유효 종료일<input name="expiresOn" type="date" required defaultValue={existing?.expiresOn} /><small>종료일까지 유효하며, 다음 날부터 분석 대상에서 제외됩니다.</small></label>
      <label className={styles.full}>해당 자료 URL<input name="url" type="url" required maxLength={1500} defaultValue={existing?.url} placeholder="https://…" /><small>원문·댓글·작성자·개인정보를 입력하지 마세요. URL의 추적 매개변수는 제거하세요.</small></label>
      {existing && <label className={styles.full}>정정 사유<input name="reason" required minLength={3} maxLength={240} placeholder="어떤 값을 왜 정정했는지 작성" /><small>정정하면 승인이 해제되고 검토 대기로 돌아갑니다.</small></label>}
      <button type="submit" className={styles.primary}>{busy ? '저장 중…' : existing ? '정정 후 재검토 요청' : '자료 등록하기'}</button>
    </fieldset>
  </form>;
}
