'use client';
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { LivingContext } from '../../lib/research/living-context';
import type { PropertyReview, ReviewPoint, ReviewText } from '../../lib/research/property-review';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { parseReviewSaved, readReviewSaved, reviewSavedIsSessionOnly, subscribeReviewSaved, toggleReviewSaved } from '../../lib/research/property-review-saved';
import styles from './living-context.module.css';

const cities = [['kr-seoul', '서울', 'Seoul', '首尔'], ['sg-singapore', '싱가포르', 'Singapore', '新加坡'], ['ae-dubai', '두바이', 'Dubai', '迪拜'], ['jp-tokyo', '도쿄', 'Tokyo', '东京']] as const;
const empty = () => '';
function copy(locale: MarketLocale, ko: string, en: string, zh: string) { return locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en; }
function localized(value: ReviewText, locale: MarketLocale) { return value[locale === 'ko' ? 'ko' : 'en']; }
export function livingHref(locale: MarketLocale) { return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/living/`; }
export function reviewHref(locale: MarketLocale, p: Pick<LivingContext, 'market_id' | 'id'>) { return `${livingHref(locale)}?market=${p.market_id}&profile=${encodeURIComponent(p.id)}`; }
function marketHref(locale: MarketLocale, market: string, section = 'explore') {
  const base = ({'kr-seoul':'/kr/seoul', 'sg-singapore':'/sg/singapore', 'ae-dubai':'/ae/dubai', 'jp-tokyo':'/jp/tokyo'} as Record<string,string>)[market];
  return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}${base}/${section}/`;
}
function reviewName(p: LivingContext, locale: MarketLocale) { return p.review ? localized(p.review.name, locale) : locale === 'ko' ? p.name_ko : p.canonical_name; }
function dateLabel(date: string, locale: MarketLocale) { return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB', {day:'numeric',month:locale === 'en' ? 'short' : 'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`)); }

function ReviewPoints({points,review,locale}: {points:ReviewPoint[];review:PropertyReview;locale:MarketLocale}) {
  return <div className={styles.points}>{points.map((point,i) => <article key={i} className={styles.point}>
    <div className={styles.pointHeading}><h3>{localized(point.title,locale)}</h3>{point.status === 'needs-check' && <span className={styles.check}>{copy(locale,'추가 확인','To verify','待核实')}</span>}</div>
    <p>{localized(point.body,locale)}</p>
    <div className={styles.references}>{point.sourceIds.map((id,sourceIndex) => { const s = review.sources.find(source => source.id === id)!;return <a key={id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.title} · ${dateLabel(s.checkedOn,locale)}`} title={`${s.title} · ${dateLabel(s.checkedOn,locale)}`}>[{sourceIndex+1}] ↗</a>; })}</div>
  </article>)}</div>;
}

export function LivingContextCard({profile:p,locale,alternatives=[],compact=false}: {profile:LivingContext;locale:MarketLocale;alternatives?:LivingContext[];compact?:boolean}) {
  const review=p.review;
  const [tab,setTab]=useState('verdict');
  const unique=useId();
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=parseReviewSaved(raw).includes(p.id);
  const t=(ko:string,en:string,zh:string)=>copy(locale,ko,en,zh);
  if(!review)return <article className={styles.card}><h2>{reviewName(p,locale)}</h2><p>{t('상세 리뷰를 준비하고 있습니다.','The detailed review is being prepared.','详细评估正在准备中。')}</p><Link href={livingHref(locale)}>{t('다른 단지 리뷰','Browse property reviews','查看其他评估')}</Link></article>;
  const l=(text:ReviewText)=>localized(text,locale);
  const tabs=[['verdict',t('종합 판단','Our verdict','综合判断')],['transport',t('교통·역 접근','Getting around','交通')],['schools',t('학교·생활환경','Schools & daily life','学校与生活')],['unit',t('세대·보유비용','Unit & ownership costs','户型与持有成本')]];
  return <article className={styles.card} data-living-profile={p.id} lang={locale === 'ko' ? 'ko' : 'en'}>
    <header className={styles.profileHeader}><div><p className={styles.meta}>{l(review.area)} · {t('확인','Checked','核查')} {dateLabel(review.checkedOn,locale)}</p><h2>{l(review.name)}</h2></div><div className={styles.actions}><button type="button" onClick={()=>toggleReviewSaved(p.id)} aria-pressed={saved}>{saved?t('저장됨','Saved','已收藏'):t('관심 저장','Save property','收藏')}</button><Link href={reviewHref(locale,p)}>{t('리뷰 링크','Review link','评估链接')} ↗</Link></div></header>
    {locale === 'zh-CN' && <p className={styles.meta}>本评估提供英文与韩文版本，以下为英文内容。</p>}
    {reviewSavedIsSessionOnly() && saved && <p role="status" className={styles.meta}>{t('브라우저 저장을 사용할 수 없어 이번 방문 동안만 보관됩니다.','Browser storage is unavailable; saved for this visit only.','浏览器存储不可用，仅在本次访问中保存。')}</p>}
    <div className={styles.verdict}><div><p className={styles.eyebrow}>{t('입지·실거주 판단','Our take on location & living','区位与居住判断')}</p><p className={styles.call}>{l(review.verdict)}</p><p className={styles.summary}>{l(review.summary)}</p></div><aside className={styles.fit}><div><span>{t('추천 후보가 되는 경우','Worth shortlisting for','适合优先考虑')}</span><p>{l(review.bestFor)}</p></div><div><span>{t('먼저 조건을 확인할 경우','Check these conditions first','需要先核实')}</span><p>{l(review.holdFor)}</p></div></aside></div>
    {compact?<Link className={styles.readMore} href={reviewHref(locale,p)}>{t('교통·학교·비용 상세 리뷰','Read the transport, school and cost review','查看交通、学校及费用详情')} →</Link>:<>
      <div className={styles.tabs} role="tablist" aria-label={t('리뷰 항목','Review sections','评估内容')}>{tabs.map(([key,label])=><button key={key} id={`${unique}-${key}`} type="button" role="tab" aria-selected={tab===key} aria-controls={`${unique}-panel`} onClick={()=>setTab(key!)}>{label}</button>)}</div>
      <section className={styles.panel} id={`${unique}-panel`} role="tabpanel" aria-labelledby={`${unique}-${tab}`}>
        {tab==='verdict'&&<><div className={styles.columns}><section><h3 className={styles.sectionTitle}>{t('후보에 넣을 이유','Reasons to shortlist','考虑理由')}</h3><ReviewPoints points={review.strengths} review={review} locale={locale}/></section><section><h3 className={styles.sectionTitle}>{t('조건을 따져야 할 부분','Where to be selective','需要权衡')}</h3><ReviewPoints points={review.tradeoffs} review={review} locale={locale}/></section></div>
          {review.comparisons.length>0&&<section className={styles.alternatives}><h3>{t('함께 비교할 후보','Other candidates to compare','可比较的候选')}</h3><div className={styles.columns}>{review.comparisons.map((candidate,i)=>{const match=alternatives.find(a=>a.review&&(a.review.name.en===candidate.name.en||a.review.name.ko===candidate.name.ko));return <article key={i}><h4>{match?<Link href={reviewHref(locale,match)}>{l(candidate.name)} →</Link>:l(candidate.name)}</h4><p>{l(candidate.reason)}</p><p className={styles.meta}>{l(candidate.condition)}</p></article>;})}</div></section>}</>}
        {tab==='transport'&&<ReviewPoints points={review.sections.transport} review={review} locale={locale}/>}
        {tab==='schools'&&<div className={styles.columns}><section><h3 className={styles.sectionTitle}>{t('학교·통학','Schools & school routes','学校与通学')}</h3><ReviewPoints points={review.sections.schools} review={review} locale={locale}/></section><section><h3 className={styles.sectionTitle}>{t('주변에서의 일상','Everyday surroundings','日常生活')}</h3><ReviewPoints points={review.sections.daily} review={review} locale={locale}/></section></div>}
        {tab==='unit'&&<><ReviewPoints points={review.sections.costs} review={review} locale={locale}/><p className={styles.note}>{t('현재 호가와 같은 면적·층·전망의 실거래가 대조되지 않았다면 적정가격 판단은 유보합니다. 입지 적합성과 개별 세대 가격은 나누어 확인하세요.','A fair-price conclusion remains open until current asking prices are matched with completed sales of comparable size, floor and outlook. Assess the location and the individual unit price separately.','只有将当前报价与面积、楼层和景观相近的实际成交匹配后，才能判断价格合理性。')}</p></>}
      </section>
      <nav className={styles.nextSteps} aria-label={t('이어서 탐색','Continue your research','继续探索')}><Link href={marketHref(locale,p.market_id)}>{p.market_id==='jp-tokyo'?t('주변 지역 실거래·지도','Area transactions & map','周边成交与地图'):t('이 도시 실거래·지도','City transactions & map','城市成交与地图')} →</Link><Link href={marketHref(locale,p.market_id,'shortlist')}>{t('예산으로 후보 비교','Compare within a budget','按预算比较')} →</Link><Link href={`${locale==='ko'?'/ko':locale==='zh-CN'?'/zh-cn':''}/saved/`}>{t('관심 목록','Saved places','收藏')} →</Link></nav>
    </>}
  </article>;
}

export function LivingContextExplorer({profiles,status,locale,initialMarket,initialProfile}: {profiles:LivingContext[];status:'ready'|'unavailable';locale:MarketLocale;initialMarket?:string;initialProfile?:string}) {
  const initial=profiles.find(p=>p.id===initialProfile);
  const [market,setMarket]=useState(initial?.market_id??(cities.some(c=>c[0]===initialMarket)?initialMarket!:'kr-seoul'));
  const [id,setId]=useState(initial?.id??'');
  const [compare,setCompare]=useState(false);
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=parseReviewSaved(raw);
  const options=profiles.filter(p=>p.market_id===market&&p.review);
  const active=options.find(p=>p.id===id)??options[0];
  const t=(ko:string,en:string,zh:string)=>copy(locale,ko,en,zh);
  useEffect(()=>{const sync=()=>{const q=new URLSearchParams(window.location.search);const selected=profiles.find(p=>p.id===q.get('profile'));setMarket(selected?.market_id??(cities.some(c=>c[0]===q.get('market'))?q.get('market')!:'kr-seoul'));setId(selected?.id??'');setCompare(false);};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[profiles]);
  const select=(nextMarket:string,nextId:string)=>{setMarket(nextMarket);setId(nextId);setCompare(false);const q=new URLSearchParams(window.location.search);q.set('market',nextMarket);if(nextId)q.set('profile',nextId);else q.delete('profile');window.history.pushState(null,'',`${livingHref(locale)}?${q}`);};
  return <div className={styles.explorer}>
    <nav className={styles.cities} aria-label={t('도시','City','城市')}>{cities.map(c=><button type="button" key={c[0]} aria-pressed={market===c[0]} onClick={()=>select(c[0],'')}>{c[locale==='ko'?1:locale==='zh-CN'?3:2]}</button>)}</nav>
    <div className={styles.controls}><label>{t('단지·프로젝트','Property / project','住宅项目')}<select value={active?.id??''} onChange={e=>select(market,e.target.value)} disabled={!options.length}>{!options.length&&<option value="">—</option>}{options.map(p=><option key={p.id} value={p.id}>{reviewName(p,locale)}{saved.includes(p.id)?' ✓':''}</option>)}</select></label><button type="button" aria-pressed={compare} onClick={()=>setCompare(!compare)} disabled={options.length<2}>{compare?t('상세 리뷰로','Back to the review','返回详情'):t('이 도시 3곳 비교','Compare this city’s 3 properties','比较本城3个项目')}</button></div>
    {status==='unavailable'?<p role="status">{t('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.','Reviews could not be loaded. Please try again shortly.','评估暂时无法加载，请稍后重试。')}</p>:!active?<p>{t('이 도시의 상세 리뷰를 준비하고 있습니다.','Detailed reviews for this city are being prepared.','正在准备本城的详细评估。')}</p>:compare?<section className={styles.comparison} aria-label={t('입지 비교','Location comparison','区位比较')}><p className={styles.note}>{t('생활 조건을 비교하는 후보들입니다. 같은 가격대이거나 같은 투자 수익을 기대할 수 있다는 뜻은 아닙니다.','These candidates compare living conditions; matching budgets or investment returns have not been established.','此处比较居住条件，并不表示价格或投资回报相同。')}</p><div className={styles.compareGrid}>{options.map(p=><article key={p.id}><h2>{reviewName(p,locale)}</h2><p>{localized(p.review!.verdict,locale)}</p><h3>{t('맞는 생활','Best fit','适合需求')}</h3><p>{localized(p.review!.bestFor,locale)}</p><h3>{t('먼저 확인','Check first','先核实')}</h3><p>{localized(p.review!.holdFor,locale)}</p><button type="button" onClick={()=>select(p.market_id,p.id)}>{t('상세 리뷰','Read review','阅读详情')} →</button></article>)}</div></section>:<LivingContextCard key={active.id} profile={active} locale={locale} alternatives={options}/>}
  </div>;
}

export function PropertyLivingContext({entity,locale}: {entity:string;locale:MarketLocale}) {
  const [result,setResult]=useState<{entity:string;profiles:LivingContext[];failed:boolean}|null>(null);
  useEffect(()=>{const controller=new AbortController();fetch(`/api/living-context/?entity=${encodeURIComponent(entity)}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(data=>setResult({entity,profiles:data.profiles,failed:data.status!=='ready'})).catch(()=>{if(!controller.signal.aborted)setResult({entity,profiles:[],failed:true});});return()=>controller.abort();},[entity]);
  if(!result||result.entity!==entity)return <p className={styles.meta} role="status">{copy(locale,'단지 리뷰 확인 중…','Loading property review…','正在加载住宅评估…')}</p>;
  if(result.failed)return <p className={styles.note}><Link href={livingHref(locale)}>{copy(locale,'단지 리뷰 보기','Browse property reviews','查看住宅评估')}</Link></p>;
  if(!result.profiles.length)return null;
  return <section className={styles.inline}>{result.profiles.map(p=><LivingContextCard key={p.id} profile={p} locale={locale} compact/>)}</section>;
}

export function SavedPropertyReviews({locale}: {locale:MarketLocale}) {
  const raw=useSyncExternalStore(subscribeReviewSaved,readReviewSaved,empty);
  const saved=useMemo(()=>parseReviewSaved(raw),[raw]);
  const [profiles,setProfiles]=useState<LivingContext[]|null>(null);
  useEffect(()=>{if(!saved.length)return;const controller=new AbortController();fetch('/api/living-context/',{signal:controller.signal}).then(r=>r.json()).then(data=>{if(data.status==='ready')setProfiles(data.profiles);}).catch(()=>{});return()=>controller.abort();},[saved.length]);
  if(!saved.length)return null;
  return <section className={styles.savedReviews}><h2>{copy(locale,'저장한 단지 리뷰','Saved property reviews','已收藏的住宅评估')}</h2><p className={styles.meta}>{copy(locale,'이 브라우저에 저장됩니다.','Saved in this browser.','保存在此浏览器。')}</p>{profiles?<ul>{profiles.filter(p=>saved.includes(p.id)).map(p=><li key={p.id}><Link href={reviewHref(locale,p)}>{reviewName(p,locale)} →</Link><button type="button" onClick={()=>toggleReviewSaved(p.id)}>{copy(locale,'저장 해제','Remove','移除')}</button></li>)}</ul>:<Link href={livingHref(locale)}>{copy(locale,'리뷰 목록에서 이어서 보기','Continue in property reviews','继续查看住宅评估')} →</Link>}</section>;
}
