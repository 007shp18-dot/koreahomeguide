import styles from './passport.module.css';
import type { PassportLocale } from '../../lib/passport/model';

const COPY = {
  en: { eyebrow: 'SignedPrice Passport', title: 'Where can your budget become a home?', lead: 'Enter one cash budget. Compare purchasing power across Seoul, Singapore and Dubai with released transaction evidence.', label: 'Budget in Korean won', action: 'Compare Seoul · Singapore · Dubai', note: 'First-pass screening · purchase price only' },
  ko: { eyebrow: 'SignedPrice Passport', title: '당신의 예산은 어디에서 집이 될까요?', lead: '현금 예산 하나로 서울·싱가포르·두바이의 구매력을 공개된 실거래 근거와 비교하세요.', label: '원화 예산', action: '서울 · 싱가포르 · 두바이 비교하기', note: '1차 검토용 · 매매가격만 포함' },
  'zh-CN': { eyebrow: 'SignedPrice Passport', title: '你的预算可以在哪里买到房子？', lead: '输入一笔现金预算，用已发布成交依据比较首尔、新加坡和迪拜的购买力。', label: '韩元预算', action: '比较首尔 · 新加坡 · 迪拜', note: '初步筛选 · 仅含购房价格' },
} as const;

export function PassportEntry({ locale }: Readonly<{ locale: PassportLocale }>) {
  const copy = COPY[locale];
  const action = locale === 'ko' ? '/ko/passport/' : locale === 'zh-CN' ? '/zh-cn/passport/' : '/passport/';
  return <section className={styles.entry} aria-labelledby="passport-entry-title" data-home-region="passport">
    <p className={styles.eyebrow}>{copy.eyebrow}</p>
    <div className={styles.entryGrid}>
      <div><h1 id="passport-entry-title">{copy.title}</h1><p className={styles.lead}>{copy.lead}</p></div>
      <form action={action} className={styles.entryForm}>
        <label htmlFor={`passport-budget-${locale}`}>{copy.label}</label>
        <div className={styles.inputFrame}><span>₩</span><input id={`passport-budget-${locale}`} name="budget" inputMode="numeric" defaultValue="500,000,000" aria-describedby={`passport-note-${locale}`} /></div>
        <button type="submit">{copy.action}</button>
        <small id={`passport-note-${locale}`}>{copy.note}</small>
      </form>
    </div>
  </section>;
}
