'use client';

import { useEffect, useId, useState } from 'react';
import type { SingaporeCheckMarket } from '@signedprice/singapore-property';

type Option = readonly [value: string, label: string];
export function CheckEntitySelect({ name, market, kind, defaultValue = '', selectedLabel = '', anyLabel, locale = 'en' }: Readonly<{
  name: string;
  market: SingaporeCheckMarket;
  kind: 'projects' | 'blocks';
  defaultValue?: string;
  selectedLabel?: string;
  anyLabel: string;
  locale?: string;
}>) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [selectionLabel, setSelectionLabel] = useState(selectedLabel || (defaultValue ? (locale === 'ko' ? '선택한 단지' : 'Selected project') : ''));
  const [result, setResult] = useState<{ key: string; options: readonly Option[]; error: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([market, kind, query, retry]);
  const currentResult = result?.key === requestKey ? result : null;
  const options = currentResult?.options ?? [];
  const loading = active && currentResult === null;
  const error = currentResult?.error ?? false;
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ market, kind, q: query });
        const response = await fetch(`/api/singapore/check-options/?${params}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (!response.ok) throw new Error('unavailable');
        const result = await response.json();
        if (!controller.signal.aborted) setResult({ key: requestKey, options: result.options, error: false });
      } catch { if (!controller.signal.aborted) setResult({ key: requestKey, options: [], error: true }); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [active, market, kind, query, requestKey]);
  const visible = value && !options.some(([key]) => key === value) ? [[value, selectionLabel] as const, ...options] : options;
  return <span className="singapore-check-entity" style={{ display: 'grid', gap: 8, minWidth: 0 }}>
    <input type="search" value={query} maxLength={100} aria-label={locale === 'ko' ? '단지 또는 주소 검색' : 'Search project or address'} aria-controls={id}
      placeholder={locale === 'ko' ? '이름이나 주소로 검색' : 'Search by name or address'}
      onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} onFocus={() => setActive(true)} onChange={event => { setQuery(event.target.value); setActive(true); }} />
    <select id={id} aria-label={kind === 'projects' ? (locale === 'ko' ? '단지 선택' : 'Choose project') : (locale === 'ko' ? '동·주소 선택' : 'Choose block or street')} name={name} value={value} aria-busy={loading} onFocus={() => setActive(true)} onChange={event => { setValue(event.target.value); setSelectionLabel(event.target.selectedOptions[0]?.text ?? ''); }}>
      <option value="">{anyLabel}</option>
      {visible.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
    {active ? <small role="status">{loading ? (locale === 'ko' ? '검색 중…' : 'Searching…') : error ? (locale === 'ko' ? '검색에 실패했습니다.' : 'Search unavailable.') : active ? (locale === 'ko' ? '최대 40개 표시. 검색어를 입력해 범위를 좁히세요.' : 'Up to 40 matches. Type to narrow your search.') : ''}</small> : null}
    {error ? <button type="button" onClick={() => setRetry(value => value + 1)}>{locale === 'ko' ? '다시 시도' : 'Retry'}</button> : null}
  </span>;
}
