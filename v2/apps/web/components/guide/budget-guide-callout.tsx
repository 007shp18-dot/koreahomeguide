import { BUDGET_GUIDE_SERIES } from '../../content/budget-guide-series';
import { getPortfolioRecord } from '../../content/portfolio-manifest';
import Link from 'next/link';
import type { ContentLocale } from '../../lib/content/content-types';
import type { GuideMarket } from '../../content/guide-directory';
import styles from './budget-guide-callout.module.css';

const copy = {
  en: {
    eyebrow: 'Buying by budget',
    title: 'Start with your purchase-price budget',
    deck: 'Compare reviewed transaction examples by budget, then read the transaction periods and purchase costs separately.',
    action: 'Compare buying budgets',
  },
  ko: {
    eyebrow: '예산별 구매',
    title: '매매가격 예산부터 비교해 보세요',
    deck: '예산별로 검토된 거래 사례를 비교하고, 거래 기간과 매입 비용을 따로 확인하세요.',
    action: '예산별 구매 비교',
  },
  'zh-CN': {
    eyebrow: '按预算购房',
    title: '先从购房价格预算开始比较',
    deck: '按预算比较经核查的成交案例，再分别查看成交时期与购房成本。',
    action: '比较购房预算',
  },
} as const;

export function BudgetGuideCallout({ locale = 'en', market = 'all' }: Readonly<{
  locale?: ContentLocale;
  market?: GuideMarket;
}>) {
  const t = copy[locale];
  const guides = BUDGET_GUIDE_SERIES.filter(guide => market === 'all' || guide.city === market).flatMap(guide => {
    const translated = getPortfolioRecord(locale, guide.slug);
    const record = translated ?? getPortfolioRecord('en', guide.slug);
    return record ? [{ ...guide, href: record.canonicalHref, translated: Boolean(translated) }] : [];
  });
  const cities = { en: ['Seoul', 'Singapore', 'Dubai', 'Tokyo'], ko: ['서울', '싱가포르', '두바이', '도쿄'], 'zh-CN': ['首尔', '新加坡', '迪拜', '东京'] };
  return <aside className={styles.callout} aria-labelledby={`budget-guide-callout-${locale}`}>
    <div><p>{t.eyebrow}</p><h2 id={`budget-guide-callout-${locale}`}>{t.title}</h2><span>{t.deck}</span></div>
    <nav aria-label={t.action}>{guides.map(guide => <Link key={guide.city} href={guide.href}>{market === 'all' ? cities[locale][BUDGET_GUIDE_SERIES.findIndex(item => item.city === guide.city)] : t.action}{guide.translated ? '' : locale === 'zh-CN' ? '（英文）' : ' (English)'} <span aria-hidden="true">→</span></Link>)}</nav>
  </aside>;
}
