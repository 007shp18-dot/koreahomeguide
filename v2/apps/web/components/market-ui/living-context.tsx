'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LivingContext } from '../../lib/research/living-context';
import type { MarketLocale } from '../../lib/locale/market-localization';
import styles from './living-context.module.css';

const cities = [ ['kr-seoul', '서울', 'Seoul', '首尔'], ['sg-singapore', '싱가포르', 'Singapore', '新加坡'], ['ae-dubai', '두바이', 'Dubai', '迪拜'], ['jp-tokyo', '도쿄', 'Tokyo', '东京'] ] as const;
function copy(locale: MarketLocale, ko: string, en: string, zh: string) { return locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en; }
export function livingHref(locale: MarketLocale) { return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/living/`; }

export function LivingContextCard({ profile: p, locale }: { profile: LivingContext; locale: MarketLocale }) {
  const t = (ko: string, en: string, zh: string) => copy(locale, ko, en, zh);
  return <article className={styles.card} data-living-profile={p.id}>
    <header><p className={styles.meta}>{p.area} · {t('자료 확인', 'Sources checked', '资料核查')} {p.checked_on}</p>
      <h2>{locale === 'ko' ? p.name_ko : p.canonical_name}</h2><p lang="ko">{p.headline}</p></header>
    {locale !== 'ko' && <p className={styles.note}>{t('', 'Research notes below are in Korean; official source links are included.', '以下研究笔记为韩文，并附官方来源链接。')}</p>}
    <p className={styles.scope} lang="ko">{p.identity_note}</p>
    <h3>{t('출처에서 확인한 내용', 'What the sources report', '来源记载')}</h3>
    <ul className={styles.facts}>{p.facts.map(f => <li key={f.id}>
      <span className={styles.badge}>{f.status === 'planned' ? t('예정·개발계획', 'Planned', '规划中') : f.status === 'historical_design' ? t('당시 설계자료', 'Historical design', '历史设计') : t('공식 자료 설명', 'Source reported', '官方资料记载')}</span>
      <p lang="ko">{f.text}</p><div className={styles.sources}>{f.source_ids.map(id => <a key={id} href={p.sources[id]!.url} target="_blank" rel="noopener noreferrer" lang="ko">{p.sources[id]!.title} ↗</a>)}</div>
    </li>)}</ul>
    <h3>{t('생활권 해석', 'Living context · interpretation', '生活环境分析')}</h3>
    <div className={styles.analysis} lang="ko">{p.analysis.slice(0, 3).map(a => <div key={a.dimension}><h4>{a.dimension}</h4><p>{a.interpretation}</p></div>)}</div>
    <details className={styles.details}><summary>{t('거주수요 가설·현장 확인사항', 'Demand hypotheses and field checks', '居住需求假设与现场核查')}</summary>
      <div lang="ko">{p.analysis.slice(3).map(a => <p key={a.dimension}><strong>{a.dimension}: </strong>{a.interpretation}</p>)}<ul>{p.field_checks.map(f => <li key={f}>{f}</li>)}</ul></div>
    </details>
    <p className={styles.note}>{t('유동인구·상가 매출·공실률·도보시간: 미수집. 점수나 투자수익률을 산정하지 않은 1차 정성 조사입니다.', 'Footfall, retail sales, vacancy and walking times: not collected. Qualitative desk research; no score or investment return is calculated.', '人流量、商铺销售额、空置率和步行时间：尚未采集。本次为定性案头研究，未计算评分或投资回报。')}</p>
    <details className={styles.details}><summary>{t('출처별 적용 범위', 'Source scope', '来源适用范围')}</summary><ul lang="ko">{Object.entries(p.sources).map(([id, s]) => <li key={id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a><p>{s.scope}</p></li>)}</ul></details>
  </article>;
}

export function LivingContextExplorer({ profiles, status, locale, initialMarket }: { profiles: LivingContext[]; status: 'ready' | 'unavailable'; locale: MarketLocale; initialMarket?: string }) {
  const [market, setMarket] = useState(cities.some(c => c[0] === initialMarket) ? initialMarket! : 'kr-seoul');
  const [id, setId] = useState('');
  const options = profiles.filter(p => p.market_id === market);
  const active = options.find(p => p.id === id) ?? options[0];
  const t = (ko: string, en: string, zh: string) => copy(locale, ko, en, zh);
  return <div className={styles.explorer}>
    <div className={styles.controls}><label>{t('도시', 'City', '城市')}<select value={market} onChange={e => { setMarket(e.target.value); setId(''); }}>
      {cities.map(c => <option key={c[0]} value={c[0]}>{c[locale === 'ko' ? 1 : locale === 'zh-CN' ? 3 : 2]}</option>)}</select></label>
      <label>{t('단지·프로젝트', 'Property / project', '小区 / 项目')}<select value={active?.id ?? ''} onChange={e => setId(e.target.value)} disabled={!options.length}>
        {!options.length && <option value="">—</option>}{options.map(p => <option key={p.id} value={p.id}>{locale === 'ko' ? p.name_ko : p.canonical_name}</option>)}</select></label></div>
    <div aria-live="polite"><p className={styles.meta}>{t('공개 분석', 'Published profiles', '已发布分析')} {options.length}</p></div>
    {status === 'unavailable' ? <p role="status">{t('자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'Research could not be loaded. Please try again later.', '资料暂时无法加载，请稍后重试。')}</p> : active ? <LivingContextCard profile={active} locale={locale} /> : <p>{t('이 도시의 공개 분석이 아직 없습니다.', 'No published research for this city yet.', '该城市暂无已发布分析。')}</p>}
  </div>;
}

export function PropertyLivingContext({ entity, locale }: { entity: string; locale: MarketLocale }) {
  const [result, setResult] = useState<{ entity: string; profiles: LivingContext[]; failed: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/living-context/?entity=${encodeURIComponent(entity)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('unavailable'); return response.json(); })
      .then(data => setResult({ entity, profiles: data.profiles, failed: false }))
      .catch(() => { if (!controller.signal.aborted) setResult({ entity, profiles: [], failed: true }); });
    return () => controller.abort();
  }, [entity]);
  if (!result || result.entity !== entity) return <p className={styles.meta} role="status">{copy(locale, '생활권 자료 확인 중…', 'Loading living context…', '正在加载生活环境资料…')}</p>;
  if (result.failed) return <p className={styles.note}>{copy(locale, '생활권 자료를 불러오지 못했습니다.', 'Living context is temporarily unavailable.', '生活环境资料暂时不可用。')} <Link href={livingHref(locale)}>{copy(locale, '분석 목록', 'Research', '分析列表')}</Link></p>;
  if (!result.profiles.length) return null;
  return <section className={styles.inline}>{result.profiles.map(p => <LivingContextCard key={p.id} profile={p} locale={locale} />)}</section>;
}
