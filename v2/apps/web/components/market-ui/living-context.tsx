'use client';
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { LivingContext } from '../../lib/research/living-context';
import type { ReviewPoint, ReviewText } from '../../lib/research/property-review';
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

function ReviewPoints({points,locale}: {points:ReviewPoint[];locale:MarketLocale}) {
  return <div className={styles.points}>{points.map((point,i) => <article key={i} className={styles.point}>
    <div className={styles.pointHeading}><h3>{localized(point.title,locale)}</h3>{point.status === 'needs-check' && <span className={styles.check}>{copy(locale,'추가 확인','To verify','待核实')}</span>}</div>
    <p>{localized(point.body,locale)}</p>
  </article>)}</div>;
}

export function LivingContextCard({profile:p,locale,alternatives=[],embedded=false}: {profile:LivingContext;locale:MarketLocale;alternatives?:LivingContext[];embedded?:boolean}) {
  const review=p.review;
  const location=reviewLocation(p.id);
  const [tab,setTab]=useState('verdict');
  const unique=useId();
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=parseReviewSaved(raw).includes(p.id);
  const t=(ko:string,en:string,zh:string)=>copy(locale,ko,en,zh);
  if(!review)return <article className={styles.card}><h2>{reviewName(p,locale)}</h2><p>{t('상세 리뷰를 준비하고 있습니다.','The detailed review is being prepared.','详细评估正在准备中。')}</p><Link href={marketHref(locale,p.market_id)}>{t('다른 단지 리뷰','Browse property reviews','查看其他评估')}</Link></article>;
  const l=(text:ReviewText)=>localized(text,locale);
  const tabs=[['verdict',t('종합 판단','Our verdict','综合判断')],['transport',t('교통·역 접근','Getting around','交通')],['schools',t('학교·생활환경','Schools & daily life','学校与生活')],['unit',t('세대·보유비용','Unit & ownership costs','户型与持有成本')]];
  return <article className={styles.card} data-living-profile={p.id} lang={locale === 'ko' ? 'ko' : 'en'}>
    <header className={styles.profileHeader}><div><p className={styles.meta}>{l(review.area)} · {t('확인','Checked','核查')} {dateLabel(review.checkedOn,locale)}</p><h2>{embedded?t('입지·생활 분석','Location & living','区位与生活'):l(review.name)}</h2></div><div className={styles.actions}><button type="button" onClick={()=>toggleReviewSaved(p.id)} aria-pressed={saved}>{saved?t('저장됨','Saved','已收藏'):t('관심 저장','Save property','收藏')}</button></div></header>
    {locale === 'zh-CN' && <p className={styles.meta}>本评估提供英文与韩文版本，以下为英文内容。</p>}
    {reviewSavedIsSessionOnly() && saved && <p role="status" className={styles.meta}>{t('브라우저 저장을 사용할 수 없어 이번 방문 동안만 보관됩니다.','Browser storage is unavailable; saved for this visit only.','浏览器存储不可用，仅在本次访问中保存。')}</p>}
    <div className={styles.verdict}><div><p className={styles.eyebrow}>{t('입지·실거주 판단','Our take on location & living','区位与居住判断')}</p><p className={styles.call}>{l(review.verdict)}</p><p className={styles.summary}>{l(review.summary)}</p></div><aside className={styles.fit}><div><span>{t('추천 후보가 되는 경우','Worth shortlisting for','适合优先考虑')}</span><p>{l(review.bestFor)}</p></div><div><span>{t('먼저 조건을 확인할 경우','Check these conditions first','需要先核实')}</span><p>{l(review.holdFor)}</p></div></aside></div>
    {location && <PropertyReviewVisuals key={p.id} metrics={location.metrics} series={location.series} photo={location.photo} locale={locale}/>}

      <div className={styles.tabs} role="tablist" aria-label={t('리뷰 항목','Review sections','评估内容')}>{tabs.map(([key,label])=><button key={key} id={`${unique}-${key}`} type="button" role="tab" aria-selected={tab===key} tabIndex={tab===key?0:-1} aria-controls={`${unique}-panel`} onKeyDown={event=>{const index=tabs.findIndex(item=>item[0]===key);const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;if(next>=0){event.preventDefault();const target=tabs[next]![0]!;setTab(target);document.getElementById(`${unique}-${target}`)?.focus();}}} onClick={()=>setTab(key!)}>{label}</button>)}</div>
      <section className={styles.panel} id={`${unique}-panel`} role="tabpanel" aria-labelledby={`${unique}-${tab}`}>
        {tab==='verdict'&&<><div className={styles.columns}><section><h3 className={styles.sectionTitle}>{t('후보에 넣을 이유','Reasons to shortlist','考虑理由')}</h3><ReviewPoints points={review.strengths} locale={locale}/></section><section><h3 className={styles.sectionTitle}>{t('조건을 따져야 할 부분','Where to be selective','需要权衡')}</h3><ReviewPoints points={review.tradeoffs} locale={locale}/></section></div>
          {review.comparisons.length>0&&<section className={styles.alternatives}><h3>{t('함께 비교할 후보','Other candidates to compare','可比较的候选')}</h3><div className={styles.columns}>{review.comparisons.map((candidate,i)=>{const match=alternatives.find(a=>a.review&&(a.review.name.en===candidate.name.en||a.review.name.ko===candidate.name.ko));const linked=match?reviewHref(locale,match):(()=>{const found=allReviewLocations().find(a=>a.name?.en===candidate.name.en||a.name?.ko===candidate.name.ko);return found?actualDetailHref(locale,found.reviewId):null;})();return <article key={i}><h4>{linked?<Link href={linked}>{l(candidate.name)} →</Link>:l(candidate.name)}</h4><p>{l(candidate.reason)}</p><p className={styles.meta}>{l(candidate.condition)}</p></article>;})}</div></section>}</>}
        {tab==='transport'&&<ReviewPoints points={review.sections.transport} locale={locale}/>}
        {tab==='schools'&&<div className={styles.columns}><section><h3 className={styles.sectionTitle}>{t('학교·통학','Schools & school routes','学校与通学')}</h3><ReviewPoints points={review.sections.schools} locale={locale}/></section><section><h3 className={styles.sectionTitle}>{t('주변에서의 일상','Everyday surroundings','日常生活')}</h3><ReviewPoints points={review.sections.daily} locale={locale}/></section></div>}
        {tab==='unit'&&<><ReviewPoints points={review.sections.costs} locale={locale}/><p className={styles.note}>{t('현재 호가와 같은 면적·층·전망의 실거래가 대조되지 않았다면 적정가격 판단은 유보합니다. 입지 적합성과 개별 세대 가격은 나누어 확인하세요.','A fair-price conclusion remains open until current asking prices are matched with completed sales of comparable size, floor and outlook. Assess the location and the individual unit price separately.','只有将当前报价与面积、楼层和景观相近的实际成交匹配后，才能判断价格合理性。')}</p></>}
      </section>
      <nav className={styles.nextSteps} aria-label={t('이어서 탐색','Continue your research','继续探索')}><Link href={marketHref(locale,p.market_id)}>{p.market_id==='jp-tokyo'?t('주변 지역 실거래·지도','Area transactions & map','周边成交与地图'):t('이 도시 실거래·지도','City transactions & map','城市成交与地图')} →</Link><Link href={marketHref(locale,p.market_id,'shortlist')}>{t('예산으로 후보 비교','Compare within a budget','按预算比较')} →</Link><Link href={`${locale==='ko'?'/ko':locale==='zh-CN'?'/zh-cn':''}/saved/`}>{t('관심 목록','Saved places','收藏')} →</Link></nav>
  </article>;
}

export function PropertyLivingContext({entity,profileId,locale}: {entity?:string;profileId?:string;locale:MarketLocale}) {
  const key=profileId??entity??'';
  const enabled=profileId?Boolean(reviewLocation(profileId)):Boolean(entity&&hasPropertyReviewForEntity(entity));
  const [result,setResult]=useState<{key:string;profiles:LivingContext[];failed:boolean}|null>(null);
  useEffect(()=>{
    if(!enabled)return;
    const controller=new AbortController();
    const query=profileId?`profile=${encodeURIComponent(profileId)}`:`entity=${encodeURIComponent(entity!)}`;
    fetch(`/api/living-context/?${query}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(data=>setResult({key,profiles:data.profiles,failed:data.status!=='ready'})).catch(()=>{if(!controller.signal.aborted)setResult({key,profiles:[],failed:true});});
    return()=>controller.abort();
  },[entity,profileId,key,enabled]);
  if(!enabled)return null;
  return <section id="property-review" className={styles.inline} aria-label={copy(locale,'입지·생활 분석','Location & living','区位与生活')}>
    {!result||result.key!==key?<p className={styles.meta} role="status">{copy(locale,'단지 리뷰 확인 중…','Loading property review…','正在加载住宅评估…')}</p>:result.failed?<p role="status" className={styles.note}>{copy(locale,'분석을 불러오지 못했습니다. 잠시 후 페이지를 새로고침해 주세요.','The review could not be loaded. Please refresh this page shortly.','评估暂时无法加载，请稍后刷新页面。')}</p>:!result.profiles.length?<p className={styles.meta}>{copy(locale,'이 단지의 분석이 아직 게시되지 않았습니다.','This property review has not been published yet.','该住宅评估尚未发布。')}</p>:result.profiles.map(p=><LivingContextCard key={p.id} profile={p} locale={locale} embedded/>)}
  </section>;
}

export function SavedPropertyReviews({locale}: {locale:MarketLocale}) {
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=useMemo(()=>parseReviewSaved(raw),[raw]);
  if(!saved.length)return null;
  const lang=locale==='ko'?'ko':'en';
  return <section className={styles.savedReviews}><h2>{copy(locale,'저장한 단지','Saved properties','已收藏的住宅')}</h2><p className={styles.meta}>{copy(locale,'이 브라우저에 저장됩니다.','Saved in this browser.','保存在此浏览器。')}</p><ul>{saved.map(id=>{const location=reviewLocation(id);const href=actualDetailHref(locale,id);return <li key={id}>{location?.name&&href?<Link href={`${href}#property-review`}>{location.name[lang]} →</Link>:<span>{copy(locale,'현재 제공되지 않는 단지','Property currently unavailable','该住宅目前不可用')}</span>}<button type="button" onClick={()=>toggleReviewSaved(id)}>{copy(locale,'저장 해제','Remove','移除')}</button></li>;})}</ul></section>;
}
