'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ContentLocale } from '../../lib/content/content-types';
import type { BuyingCity } from '../../lib/home/buying-journey';
import { CITY_BUYING, cityText } from '../../content/city-buying-content';
import { enquiryContext, enquiryMailto } from '../../lib/operator/purchase-enquiry';
import { SIGNEDPRICE_CONTACT_EMAIL } from '../../lib/operator/public-contacts';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import styles from './buying.module.css';
function Form({locale,initial}:{locale:ContentLocale;initial:{city:BuyingCity;budget:string}}) {
 const t=(a:readonly string[])=>cityText(a,locale), [city,setCity]=useState(initial.city),[budget,setBudget]=useState(initial.budget),[purpose,setPurpose]=useState(''),[timing,setTiming]=useState(''),[context,setContext]=useState(''),[draft,setDraft]=useState('');
 const model=CITY_BUYING[city],title=t(['Purchase enquiry','구매상담 문의','购房咨询']);
 return <form className={styles.form} onChange={()=>setDraft('')} onSubmit={e=>{e.preventDefault();setDraft(`${title}\n${t(['City','도시','城市'])}: ${t(model.name)}\n${t(['Budget','집값 예산','房价预算'])}: ${model.currency} ${budget||t(['Not decided','미정','未定'])}\n${t(['Purpose','구매 목적','购买目的'])}: ${purpose}\n${t(['Timing','구매 시기','购买时间'])}: ${timing}\n\n${context}`);sendGoogleEvent('purchase_enquiry_action',{market:model.market,action:'draft_prepare',locale});}}>
  <div className={styles.fields}>
   <label>{t(['City','도시','城市'])}<select value={city} onChange={e=>{setCity(e.target.value as BuyingCity);setBudget('');}}>{(Object.keys(CITY_BUYING) as BuyingCity[]).map(key=><option key={key} value={key}>{t(CITY_BUYING[key].name)}</option>)}</select></label>
   <label>{t(['Purchase price budget (optional)','집값 예산 (선택)','房价预算（选填）'])} · {model.currency}<input type="number" inputMode="decimal" min="1" max="999999999999" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)} placeholder={t(['Not decided yet','아직 미정','尚未确定'])} /></label>
   <label>{t(['Purchase purpose','구매 목적','购买目的'])}<select required value={purpose} onChange={e=>setPurpose(e.target.value)}><option value="">{t(['Choose','선택하세요','请选择'])}</option>{[['Own use','실거주','自住'],['Rental investment','임대 투자','出租投资'],['Own use and rental','실거주·임대 함께 검토','兼顾自住出租'],['Still exploring','탐색 중','仍在了解']].map(a=><option key={a[0]} value={t(a)}>{t(a)}</option>)}</select></label>
   <label>{t(['Purchase timing','구매 시기','购买时间'])}<select required value={timing} onChange={e=>setTiming(e.target.value)}><option value="">{t(['Choose','선택하세요','请选择'])}</option>{[['Within 3 months','3개월 이내','3个月内'],['3–12 months','3~12개월','3–12个月'],['Over 12 months','1년 이후','1年以后'],['Not decided','미정','未定']].map(a=><option key={a[0]} value={t(a)}>{t(a)}</option>)}</select></label>
  </div>
  <label>{t(['Areas, candidate links and questions (optional)','관심 지역·후보 링크·궁금한 점 (선택)','意向区域、候选链接与问题（选填）'])}<textarea maxLength={800} value={context} onChange={e=>setContext(e.target.value)} /></label>
  <small>{t(['The draft stays on this page and is not submitted. Do not include ID documents, bank details or private contracts.','작성 내용은 이 화면에서만 사용하며 아직 접수되지 않습니다. 신분증·계좌 정보·비공개 계약서는 적지 마세요.','草稿仅在当前页面使用，尚未提交。请勿填写身份证件、银行资料或私人合同。'])}</small>
  <button type="submit">{t(['Review email draft','이메일 초안 확인','查看邮件草稿'])}</button>
  {draft&&<div aria-live="polite"><p>{t(['Draft ready. Send it from your email app to complete your enquiry.','초안이 준비됐습니다. 이메일 앱에서 직접 발송해야 문의가 전달됩니다.','草稿已准备好，请在邮件应用中发送后才会递交咨询。'])}</p><label>{t(['Email draft','이메일 초안','邮件草稿'])}<textarea readOnly value={draft} /></label><a className={styles.primary} href={enquiryMailto(`[SignedPrice] ${title} · ${t(model.name)}`,draft)} onClick={()=>sendGoogleEvent('purchase_enquiry_action',{market:model.market,action:'email_open',locale})}>{t(['Open email app','이메일 앱 열기','打开邮件应用'])}</a><p>{t(['No email app? Copy the draft above and send it to','이메일 앱이 없다면 위 초안을 복사해 아래 주소로 보내세요.','没有邮件应用？请复制上方草稿并发送至'])} <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></p></div>}
 </form>;
}
function ContextForm({locale}:{locale:ContentLocale}) { const params=useSearchParams(),initial=enquiryContext(params.get('city'),params.get('budget'));return <Form key={`${initial.city}:${initial.budget}`} locale={locale} initial={initial} />; }
export function PurchaseEnquiry({locale}:{locale:ContentLocale}) {
 const t=(a:readonly string[])=>cityText(a,locale);
 return <section id="purchase-enquiry" className={styles.section} aria-labelledby="purchase-enquiry-title"><h2 id="purchase-enquiry-title">{t(['Start a purchase enquiry','구매상담 문의하기','发起购房咨询'])}</h2><p>{t(['Tell us what you are considering and where you need help: budget, candidate comparison or purchase costs. Send the prepared email to enquire about available support and any next steps.','예산·후보 비교·구매비용 중 어떤 도움이 필요한지 알려주세요. 준비된 이메일을 보내면 제공 가능한 도움의 범위와 다음 절차를 문의할 수 있습니다.','请说明预算、候选比较或购置费用方面的问题，通过准备好的邮件询问可提供的帮助与下一步。'])}</p><Suspense fallback={<p><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></p>}><ContextForm locale={locale} /></Suspense><p>{t(['This does not reserve a property, confirm an appointment or enter a brokerage agreement. Service scope, availability and any fees must be confirmed separately.','이 문의로 매물 예약·상담 일정·중개 계약이 확정되지는 않습니다. 서비스 범위·가능 여부·비용은 별도로 확인해야 합니다.','此咨询不构成房源预订、预约确认或中介合同，服务范围、可用性与费用需另行确认。'])}</p><Link href="/privacy/">{t(['Privacy notice','개인정보 처리방침 (영문)','隐私政策（英文）'])}</Link></section>;
}
