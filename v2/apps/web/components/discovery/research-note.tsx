'use client';

import { useId, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { parseJournal, readJournal, subscribeJournal, withPlaceNote, writeJournal, type DiscoveryMarket } from '../../lib/discovery/journal';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './discovery.module.css';

const empty = () => '';
export function ResearchNote({ market, placeKey, placeName, locale = 'en' }: { market: DiscoveryMarket; placeKey: string; placeName: string; locale?: MarketLocale }) {
  const raw = useSyncExternalStore(subscribeJournal, readJournal, empty);
  const note = useMemo(() => parseJournal(raw).notes.find(n => n.market === market && n.key === placeKey)?.text ?? '', [raw, market, placeKey]);
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const id = useId();
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const value = draft ?? note;
  function persist(text: string) {
    const next = withPlaceNote(parseJournal(readJournal()), { market, key: placeKey, text });
    if (!next) { setStatus(ko ? '메모는 1,000자, 전체 120개까지 저장할 수 있습니다.' : zh ? '每条备注最多1,000字，最多保存120条。' : 'Keep notes within 1,000 characters and 120 saved notes.'); return; }
    const saved = writeJournal(next);
    setDraft(null);
    setStatus(!saved ? (ko ? '브라우저 저장이 차단되어 이번 페이지에서만 유지됩니다.' : zh ? '浏览器存储受限，备注仅在本次页面会话中保留。' : 'Browser storage is blocked. This note lasts only for this page session.') : text.trim() ? (ko ? '메모를 저장했어요.' : zh ? '备注已保存。' : 'Note saved.') : (ko ? '메모를 지웠어요.' : zh ? '备注已删除。' : 'Note deleted.'));
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); persist(value); }
  return <details className={styles.note} data-research-note={`${market}:${placeKey}`}>
    <summary>{note ? (ko ? '내 메모' : zh ? '我的备注' : 'My note') : (ko ? '메모 남기기' : zh ? '添加备注' : 'Add a note')}</summary>
    <form onSubmit={submit}>
      <label htmlFor={id}>{ko ? `${placeName} 메모` : zh ? `${placeName}的备注` : `Note for ${placeName}`}</label>
      <textarea id={id} value={value} maxLength={1_000} rows={3} aria-describedby={`${id}-help`} placeholder={ko ? '마음에 드는 점, 확인할 점을 적어두세요.' : zh ? '记录喜欢的地方和待确认的问题。' : 'What stands out? What would you like to check?'} onChange={event => { setDraft(event.currentTarget.value); setStatus(''); }} />
      <div className={styles.noteHelp}><p id={`${id}-help`}>{ko ? '이 브라우저에만 저장되는 개인 메모예요.' : zh ? '私人备注，仅保存在此浏览器中。' : 'A private note, saved only in this browser.'}</p><span>{value.length}/1,000</span></div>
      <div className={styles.noteActions}><button type="submit">{ko ? '메모 저장' : zh ? '保存备注' : 'Save note'}</button>{note && <button type="button" onClick={() => persist('')}>{ko ? '메모 삭제' : zh ? '删除备注' : 'Delete note'}</button>}</div>
      <p className={styles.status} role="status">{status}</p>
    </form>
  </details>;
}
