import styles from './passport.module.css';
import { defaultPassportBudget, type PassportLocale } from '../../lib/passport/model';
import { PassportBudgetFields } from './passport-budget-fields';

const COPY = {
  en: { eyebrow: 'SignedPrice Passport', title: 'Where can your budget become a home?', lead: 'Enter your budget to compare property prices and estimated floor area in Seoul, Singapore and Dubai.', label: 'Budget in Korean won', action: 'Compare cities', note: 'First-pass screening · purchase price only' },
  ko: { eyebrow: 'SignedPrice Passport', title: '내 예산으로 어디에 집을 살 수 있을까요?', lead: '예산을 입력하면 서울·싱가포르·두바이에서 어느 지역의 집을 얼마나 넓게 살 수 있을지 비교할 수 있습니다.', label: '원화 예산', action: '세 도시 비교하기', note: '참고용 · 세금과 수수료는 별도' },
  'zh-CN': { eyebrow: 'SignedPrice Passport', title: '你的预算可以在哪里买到房子？', lead: '输入预算，按实际成交价格比较首尔、新加坡和迪拜的地区与参考面积。', label: '韩元预算', action: '比较城市', note: '初步筛选 · 仅含购房价格' },
} as const;

export function PassportEntry({ locale }: Readonly<{ locale: PassportLocale }>) {
  const copy = COPY[locale];
  const budget = defaultPassportBudget(locale);
  const action = locale === 'ko' ? '/ko/passport/' : locale === 'zh-CN' ? '/zh-cn/passport/' : '/passport/';
  return <section className={styles.entry} aria-labelledby="passport-entry-title" data-home-region="passport">
    <p className={styles.eyebrow}>{copy.eyebrow}</p>
    <div className={styles.entryGrid}>
      <div><h1 id="passport-entry-title">{copy.title}</h1><p className={styles.lead}>{copy.lead}</p></div>
      <form action={action} className={styles.entryForm}>
        <PassportBudgetFields amount={budget.amount} currency={budget.currency} locale={locale} id={`passport-budget-${locale}`} />
        <button type="submit">{copy.action}</button>
        <small id={`passport-note-${locale}`}>{copy.note}</small>
      </form>
    </div>
  </section>;
}
