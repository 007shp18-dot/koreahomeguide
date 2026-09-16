'use client';
import Link from 'next/link';
import { Suspense, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ContentLocale } from '../../lib/content/content-types';
import type { BuyingCity } from '../../lib/home/buying-journey';
import { CITY_BUYING, cityText } from '../../content/city-buying-content';
import { enquiryContext } from '../../lib/operator/purchase-enquiry';
import { ENQUIRY_NOTICE } from '../../lib/operator/enquiry-contract';
import { SIGNEDPRICE_CONTACT_EMAIL } from '../../lib/operator/public-contacts';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import styles from './purchase-enquiry.module.css';

function Form({ locale, initial }: { locale: ContentLocale; initial: { city: BuyingCity; budget: string } }) {
  const t = (a: readonly string[]) => cityText(a, locale);
  const [city, setCity] = useState(initial.city), [budget, setBudget] = useState(initial.budget);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [reference, setReference] = useState('');
  const retry = useRef({ payload: '', id: '' }), lock = useRef(false);
  const result = useRef<HTMLDivElement>(null);
  const model = CITY_BUYING[city];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { email: values.email, city, budget, purpose: values.purpose, timing: values.timing, context: values.context, locale, consent: values.consent === 'on', consentVersion: ENQUIRY_NOTICE };
    const serialized = JSON.stringify(payload);
    if (retry.current.payload !== serialized) retry.current = { payload: serialized, id: crypto.randomUUID() };
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/purchase-enquiries/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId: retry.current.id }), signal: AbortSignal.timeout(20000) });
      const body = await response.json();
      if (!response.ok || body.state !== 'received') {
        setError(response.status === 429 ? t(['Too many requests. Please try again in an hour.', '문의가 연속으로 접수됐습니다. 한 시간 뒤 다시 시도해 주세요.', '请求过多，请一小时后再试。']) : t(['We could not confirm receipt. Your entries are still here; please try again.', '접수를 확인하지 못했습니다. 입력 내용은 남아 있으니 다시 시도해 주세요.', '暂时无法确认收件。填写内容已保留，请重试。']));
        return;
      }
      setReference(String(body.reference));
      sendGoogleEvent('purchase_enquiry_action', { market: model.market, action: 'submitted', locale });
      requestAnimationFrame(() => result.current?.focus());
    } catch { setError(t(['We could not confirm receipt. Your entries are still here; please try again.', '접수를 확인하지 못했습니다. 입력 내용은 남아 있으니 다시 시도해 주세요.', '暂时无法确认收件。填写内容已保留，请重试。'])); }
    finally { lock.current = false; setBusy(false); }
  }
  if (reference) return <div className={styles.success} ref={result} tabIndex={-1} role="status">
    <span className={styles.check} aria-hidden="true">✓</span><h3>{t(['Enquiry received', '상담 요청이 접수됐어요', '咨询已收到'])}</h3>
    <p>{t(['You do not need to send an email. We will review your enquiry and reply to the address you provided.', '이메일을 따로 보내지 않아도 됩니다. 내용을 확인한 뒤 남겨주신 이메일로 답변드릴게요.', '无需另发邮件。我们会审阅咨询，并通过您填写的邮箱回复。'])}</p>
    <small>{t(['Reference', '접수 번호', '咨询编号'])} · {reference}</small>
  </div>;
  return <form className={styles.form} onSubmit={submit} aria-busy={busy}>
    <fieldset disabled={busy}>
      <legend className={styles.srOnly}>{t(['Purchase enquiry details', '구매상담 내용', '购房咨询详情'])}</legend>
      <label className={styles.full}><span>{t(['Email for your reply', '답변받을 이메일', '回复邮箱'])}</span><input type="email" name="email" required autoComplete="email" maxLength={254} placeholder="you@example.com" /></label>
      <div className={styles.fields}>
        <label><span>{t(['City', '관심 도시', '意向城市'])}</span><select name="city" value={city} onChange={e => { setCity(e.target.value as BuyingCity); setBudget(''); }}>{(Object.keys(CITY_BUYING) as BuyingCity[]).map(key => <option key={key} value={key}>{t(CITY_BUYING[key].name)}</option>)}</select></label>
        <label><span>{t(['Price budget', '집값 예산', '房价预算'])} · {model.currency} <em>{t(['Optional', '선택', '选填'])}</em></span><input name="budget" type="number" inputMode="decimal" min="1" max="999999999999" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder={t(['Not decided yet', '아직 미정', '尚未确定'])} /></label>
        <label><span>{t(['Purchase purpose', '구매 목적', '购买目的'])}</span><select name="purpose" required defaultValue=""><option value="" disabled>{t(['Select purpose', '목적 선택', '选择目的'])}</option>{[['own-use', 'Own use', '실거주', '自住'], ['rental', 'Rental investment', '임대 투자', '出租投资'], ['both', 'Own use and rental', '실거주·임대 검토', '自住与出租'], ['exploring', 'Still exploring', '탐색 중', '仍在了解']].map(([value, ...label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
        <label><span>{t(['Purchase timing', '구매 시기', '购买时间'])}</span><select name="timing" required defaultValue=""><option value="" disabled>{t(['Select timing', '시기 선택', '选择时间'])}</option>{[['soon', 'Within 3 months', '3개월 이내', '3个月内'], ['this-year', '3–12 months', '3~12개월', '3–12个月'], ['later', 'Over 12 months', '1년 이후', '1年以后'], ['undecided', 'Not decided', '미정', '未定']].map(([value, ...label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
      </div>
      <label className={styles.full}><span>{t(['What would you like to ask?', '어떤 점이 궁금한가요?', '您想咨询什么？'])} <em>{t(['Optional', '선택', '选填'])}</em></span><textarea name="context" rows={4} maxLength={2000} placeholder={t(['Tell us about an area or home you are considering. You can include a link.', '관심 지역이나 단지, 고민 중인 점을 적어주세요. 링크를 붙여도 좋아요.', '请说明意向区域、房源或疑问，也可附上链接。'])} aria-describedby="enquiry-note" /></label>
      <p className={styles.hint} id="enquiry-note">{t(['Please leave out ID documents, bank details and private contracts.', '신분증·계좌 정보·비공개 계약 내용은 적지 마세요.', '请勿填写身份证件、银行资料或私人合同。'])}</p>
      <div className={styles.consent}>
        <label><input type="checkbox" name="consent" required aria-describedby="enquiry-privacy" /><span>{t(['I agree to the use of these details to handle my enquiry.', '문의 접수와 답변을 위한 개인정보 수집·이용에 동의합니다.', '我同意为处理咨询而收集和使用上述信息。'])}</span></label>
        <p id="enquiry-privacy">{t(['Your email and enquiry details are stored for 90 days, then deleted in the daily cleanup. Consent is required to submit this form. You can request earlier deletion.', '이메일과 문의 내용은 접수 후 90일이 지나면 매일 진행하는 정리 작업에서 삭제합니다. 동의해야 접수할 수 있으며, 그 전에 삭제를 요청할 수 있습니다.', '邮箱及咨询内容保存90天，随后在每日清理中删除。提交需获得同意，也可提前请求删除。'])} <Link href="/privacy/">{t(['Privacy notice', '개인정보 처리방침', '隐私政策'])}</Link></p>
      </div>
      <div className={styles.actions}><button type="submit">{busy ? t(['Sending…', '접수 중…', '提交中…']) : t(['Send enquiry', '상담 요청 보내기', '提交咨询'])}<span aria-hidden="true"> →</span></button><span>{t(['Submit here. No email app needed.', '이 화면에서 바로 접수돼요.', '直接提交，无需邮件应用。'])}</span></div>
    </fieldset>
    {error && <div role="alert" className={styles.error}><p>{error}</p><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></div>}
  </form>;
}
function ContextForm({ locale }: { locale: ContentLocale }) {
  const params = useSearchParams(), initial = enquiryContext(params.get('city'), params.get('budget'));
  return <Form key={`${initial.city}:${initial.budget}`} locale={locale} initial={initial} />;
}
export function PurchaseEnquiry({ locale }: { locale: ContentLocale }) {
  const t = (a: readonly string[]) => cityText(a, locale);
  return <section id="purchase-enquiry" className={styles.section} aria-labelledby="purchase-enquiry-title">
    <div className={styles.intro}><p className={styles.eyebrow}>{t(['LET’S TALK', '구매상담', '购房咨询'])}</p><h2 id="purchase-enquiry-title">{t(['A home in mind?', '고민 중인 집이 있나요?', '有心仪的房子吗？'])}</h2><p>{t(['Tell us where you are looking and what you need help with. We will review your question and reply by email.', '관심 도시와 궁금한 점을 남겨주세요. 내용을 확인하고 이메일로 답변드릴게요.', '请留下意向城市和疑问，我们审阅后会通过邮件回复。'])}</p><p className={styles.scope}>{t(['Service scope and any fees are agreed separately. Sending an enquiry does not reserve a property or confirm a brokerage agreement.', '도움드릴 수 있는 범위와 비용은 별도로 안내합니다. 문의 접수만으로 매물 예약이나 중개 계약이 확정되지는 않습니다.', '服务范围及费用另行确认。提交咨询不构成房源预订或中介合同。'])}</p></div>
    <Suspense fallback={<p><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></p>}><ContextForm locale={locale} /></Suspense>
  </section>;
}
