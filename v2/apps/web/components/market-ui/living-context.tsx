'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { LivingContext } from '../../lib/research/living-context';
import type { ReviewText } from '../../lib/research/property-review';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { parseReviewSaved, readReviewSaved, reviewSavedIsSessionOnly, subscribeReviewSaved, toggleReviewSaved } from '../../lib/research/property-review-saved';
import { actualDetailHref, allReviewLocations, reviewLocation, hasPropertyReviewForEntity } from '../../lib/research/property-review-locations';
import { PropertyReviewVisuals } from './property-review-visuals';
import styles from './living-context.module.css';

const empty = () => '';
function copy(locale: MarketLocale, ko: string, en: string, zh: string) { return locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en; }
function localized(value: ReviewText, locale: MarketLocale) { return value[locale === 'ko' ? 'ko' : 'en']; }
export function reviewHref(locale: MarketLocale, p: Pick<LivingContext, 'market_id' | 'id'>) { return `${actualDetailHref(locale,p.id) ?? marketHref(locale,p.market_id)}#property-review`; }
function marketHref(locale: MarketLocale, market: string, section = 'explore') {
  const base = ({'kr-seoul':'/kr/seoul', 'sg-singapore':'/sg/singapore', 'ae-dubai':'/ae/dubai', 'jp-tokyo':'/jp/tokyo'} as Record<string,string>)[market];
  return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}${base}/${section}/`;
}
function reviewName(p: LivingContext, locale: MarketLocale) { return p.review ? localized(p.review.name, locale) : locale === 'ko' ? p.name_ko : p.canonical_name; }
function dateLabel(date: string, locale: MarketLocale) { return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', {day:'numeric',month:locale === 'en' ? 'short' : 'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`)); }

export function LivingContextCard({profile:p,locale,embedded=false}: {profile:LivingContext;locale:MarketLocale;alternatives?:LivingContext[];embedded?:boolean}) {
  const review=p.review;
  const editorial=review?.editorial;
  const location=reviewLocation(p.id);
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=parseReviewSaved(raw).includes(p.id);
  const t=(ko:string,en:string,zh:string)=>copy(locale,ko,en,zh);
  const lang=locale==='ko'?'ko':'en';
  if(!review||!editorial)return <article className={styles.card}><h2>{reviewName(p,locale)}</h2><p>{t('단지 분석을 편집하고 있습니다.','The property analysis is being edited.','项目分析正在编辑中。')}</p></article>;
  const l=(text:ReviewText)=>localized(text,locale);
  const essayText=editorial.paragraphs[lang].join(' ');
  const related=allReviewLocations().flatMap(candidate=>{
    if(candidate.reviewId===p.id||!candidate.name||!essayText.includes(candidate.name[lang]))return [];
    const href=actualDetailHref(locale,candidate.reviewId);
    return href?[{name:candidate.name,href}]:[];
  });
  return <article className={styles.card} data-living-profile={p.id} data-property-editorial="2026-09-14" lang={lang}>
    <header className={styles.profileHeader}>
      <div><p className={styles.meta}>{l(review.area)} · {t('편집','Edited','编辑')} {dateLabel(editorial.revisedOn,locale)}</p><h2>{embedded?t('단지 분석','Property analysis','项目分析'):l(review.name)}</h2></div>
      <div className={styles.actions}><button type="button" onClick={()=>toggleReviewSaved(p.id)} aria-pressed={saved}>{saved?t('저장됨','Saved','已收藏'):t('관심 저장','Save property','收藏')}</button></div>
    </header>
    {locale==='zh-CN'&&<p className={styles.meta}>本分析提供英文与韩文版本，以下为英文内容。</p>}
    {reviewSavedIsSessionOnly()&&saved&&<p role="status" className={styles.meta}>{t('브라우저 저장을 사용할 수 없어 이번 방문 동안만 보관됩니다.','Browser storage is unavailable; saved for this visit only.','浏览器存储不可用，仅在本次访问中保存。')}</p>}
    <div className={styles.essay}>
      <h3>{editorial.headline[lang]}</h3>
      {editorial.paragraphs[lang].map((paragraph,index)=><p key={index}>{paragraph}</p>)}
    </div>
    {related.length>0&&<nav className={styles.related} aria-label={t('글과 함께 볼 단지','Related properties','相关项目')}><span>{t('함께 읽기','Read alongside','相关阅读')}</span>{related.map(candidate=><Link key={candidate.href} href={candidate.href}>{l(candidate.name)} →</Link>)}</nav>}
    <details className={styles.researchDetails}>
      <summary>{t('기초 수치·사진·자료 범위','Facts, photographs & evidence scope','基础数据、照片与资料范围')}</summary>
      <p className={styles.note}>{t('자료 확인일','Evidence checked','资料核查')} {dateLabel(review.checkedOn,locale)}. {t('이 글은 확보된 자료를 바탕으로 비교의 쟁점을 설명합니다. 실시간 호가나 면적·층·향을 맞춘 평가액, 확정 임대수익률을 제시한 것은 아닙니다. 단위·기간·대상이 다른 수치는 직접 비교하지 않습니다.','This analysis discusses the trade-offs in the available evidence. It does not provide a live asking price, a matched-unit valuation or a verified rental yield. Figures with different units, periods or scopes are not directly comparable.','本分析解释现有资料中的权衡，不提供实时报价、匹配户型估值或已核实租金收益率。不同单位、期间和范围的数据不可直接比较。')}</p>
      {location&&<PropertyReviewVisuals key={p.id} metrics={location.metrics} series={location.series} photo={location.photo} locale={locale}/>}
    </details>
    <nav className={styles.nextSteps} aria-label={t('이어서 탐색','Continue your research','继续探索')}>
      <Link href={marketHref(locale,p.market_id)}>{p.market_id==='jp-tokyo'?t('주변 지역 실거래·지도','Area transactions & map','周边成交与地图'):t('이 도시 실거래·지도','City transactions & map','城市成交与地图')} →</Link>
      <Link href={marketHref(locale,p.market_id,'shortlist')}>{t('예산으로 후보 비교','Compare within a budget','按预算比较')} →</Link>
      <Link href={`${locale==='ko'?'/ko':locale==='zh-CN'?'/zh-cn':''}/saved/`}>{t('관심 목록','Saved places','收藏')} →</Link>
    </nav>
  </article>;
}

export function PropertyLivingContext({entity,profileId,locale}: {entity?:string;profileId?:string;locale:MarketLocale}) {
  const key=profileId??entity??'';
  const enabled=profileId?Boolean(reviewLocation(profileId)):Boolean(entity&&hasPropertyReviewForEntity(entity));
  const disclosure=useRef<HTMLDetailsElement>(null);
  const [opened,setOpened]=useState(false);
  const [result,setResult]=useState<{key:string;profiles:LivingContext[];failed:boolean}|null>(null);
  useEffect(()=>{
    const reveal=()=>{if(window.location.hash==='#property-review'&&disclosure.current){disclosure.current.open=true;setOpened(true);}};
    reveal();
    window.addEventListener('hashchange',reveal);
    return()=>window.removeEventListener('hashchange',reveal);
  },[key]);
  useEffect(()=>{
    if(!enabled||!opened)return;
    const controller=new AbortController();
    const query=profileId?`profile=${encodeURIComponent(profileId)}`:`entity=${encodeURIComponent(entity!)}`;
    fetch(`/api/living-context/?${query}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(data=>setResult({key,profiles:data.profiles,failed:data.status!=='ready'})).catch(()=>{if(!controller.signal.aborted)setResult({key,profiles:[],failed:true});});
    return()=>controller.abort();
  },[entity,profileId,key,enabled,opened]);
  if(!enabled)return null;
  return <details ref={disclosure} id="property-review" className={styles.inline} onToggle={event=>{if(event.currentTarget.open)setOpened(true);}}>
    <summary className={styles.analysisEntry}>{copy(locale,'단지 분석 읽기','Read the property analysis','阅读项目分析')} <span>{copy(locale,'비교 단지와 매수 판단의 쟁점','Comparables and the buying decision','可比项目与购买判断')}</span></summary>
    {opened && <div>
    {!result||result.key!==key?<p className={styles.meta} role="status">{copy(locale,'단지 리뷰 확인 중…','Loading property review…','正在加载住宅评估…')}</p>:result.failed?<p role="status" className={styles.note}>{copy(locale,'분석을 불러오지 못했습니다. 잠시 후 페이지를 새로고침해 주세요.','The review could not be loaded. Please refresh this page shortly.','评估暂时无法加载，请稍后刷新页面。')}</p>:!result.profiles.length?<p className={styles.meta}>{copy(locale,'이 단지의 분석이 아직 게시되지 않았습니다.','This property review has not been published yet.','该住宅评估尚未发布。')}</p>:result.profiles.map(p=><LivingContextCard key={p.id} profile={p} locale={locale} embedded/>)}
    </div>}
  </details>;
}

export function SavedPropertyReviews({locale}: {locale:MarketLocale}) {
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=useMemo(()=>parseReviewSaved(raw),[raw]);
  if(!saved.length)return null;
  const lang=locale==='ko'?'ko':'en';
  return <section className={styles.savedReviews}><h2>{copy(locale,'저장한 단지','Saved properties','已收藏的住宅')}</h2><p className={styles.meta}>{copy(locale,'이 브라우저에 저장됩니다.','Saved in this browser.','保存在此浏览器。')}</p><ul>{saved.map(id=>{const location=reviewLocation(id);const href=actualDetailHref(locale,id);return <li key={id}>{location?.name&&href?<Link href={`${href}#property-review`}>{location.name[lang]} →</Link>:<span>{copy(locale,'현재 제공되지 않는 단지','Property currently unavailable','该住宅目前不可用')}</span>}<button type="button" onClick={()=>toggleReviewSaved(id)}>{copy(locale,'저장 해제','Remove','移除')}</button></li>;})}</ul></section>;
}
