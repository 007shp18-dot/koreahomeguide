import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { loadPassportEvidence } from '../../lib/passport/evidence.server';
import { loadPassportFx } from '../../lib/passport/fx.server';
import { buildPassportModel, defaultPassportBudget, type PassportLocale } from '../../lib/passport/model';
import { PassportWorkspace } from './passport-workspace';

export async function PassportPage({ locale }: Readonly<{ locale: PassportLocale }>) {
  const path = locale === 'ko' ? '/ko/passport/' : locale === 'zh-CN' ? '/zh-cn/passport/' : '/passport/';
  const budget = defaultPassportBudget(locale);
  const [evidence, fx] = await Promise.all([loadPassportEvidence(), loadPassportFx()]);
  const model = buildPassportModel({ budgetWon: budget.amount, budgetAmount: budget.amount, budgetCurrency: budget.currency, locale, evidence, fx });
  return <>
    <SiteHeader copy={{ brand: 'signedprice', homeLabel: 'signedprice home', homeHref: locale === 'zh-CN' ? '/zh-cn/kr/seoul/' : '/', navigationLabel: 'Passport navigation', languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', links: [{ label: 'Passport', href: path, isCurrent: true }] }} />
    <PassportWorkspace initialModel={model} />
    <SiteFooter copy={{ brand: 'signedprice', descriptor: 'Evidence-backed cross-border property research.', navigationLabel: 'Footer', links: [], status: 'Screening evidence, not a valuation or listing.' }} locale={locale} />
  </>;
}
