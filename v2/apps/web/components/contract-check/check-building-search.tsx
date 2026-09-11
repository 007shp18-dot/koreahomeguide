'use client';
import { useEffect, useId, useState } from 'react';
import styles from './contract-check.module.css';
export type CheckBuildingChoice = { id: string; name: string; englishName: string; district: string; neighborhood: string; housing: 'apartment' | 'officetel' | 'villa_multifamily' | 'detached'; area: number | null };
export function CheckBuildingSearch({ text, onText, onSelect, locale }: { text: string; onText: (text: string) => void; onSelect: (item: CheckBuildingChoice) => void; locale: 'en' | 'ko' | 'zh-CN' }) {
  const id = useId(), ko = locale === 'ko';
  const [response, setResponse] = useState<{ query: string; items: CheckBuildingChoice[]; failed: boolean } | null>(null);
  useEffect(() => {
    if (text.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => { fetch(`/api/seoul/building-search/?q=${encodeURIComponent(text)}`, { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error(); return r.json() as Promise<{ items: CheckBuildingChoice[] }>; }).then(data => { if (!controller.signal.aborted) setResponse({ query: text, items: data.items, failed: false }); }).catch(() => { if (!controller.signal.aborted) setResponse({ query: text, items: [], failed: true }); }); }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [text]);
  const current = response?.query === text ? response : null;
  return <div className={styles.field}><label htmlFor={id}>{ko ? '단지 이름 검색 · 선택 사항' : locale === 'zh-CN' ? "搜索楼宇 · 选填" : 'Search a building · optional'}</label><input id={id} value={text} placeholder={ko ? '예: 등촌, 마곡' : locale === 'zh-CN' ? "韩文或英文楼宇名称" : 'Korean or English building name'} onChange={e => onText(e.target.value)} autoComplete="off" />
    {current?.failed && <p role="status">{ko ? '단지 검색을 불러오지 못했습니다.' : locale === 'zh-CN' ? "无法加载楼宇搜索。" : 'Building search could not be loaded.'}</p>}
    {!!current?.items.length && <ul className={styles.buildingChoices} aria-label={ko ? '단지 검색 결과' : locale === 'zh-CN' ? "楼宇搜索结果" : 'Building search results'}>{current.items.map(item => <li key={`${item.district}/${item.id}`}><button type="button" onClick={() => onSelect(item)}>{ko ? item.name : item.englishName} · {item.neighborhood} · {item.district}</button></li>)}</ul>}
    {current && !current.failed && !current.items.length && <p>{ko ? '일치하는 단지를 찾지 못했습니다.' : locale === 'zh-CN' ? "未找到匹配的楼宇。" : 'No matching building found.'}</p>}
  </div>;
}
