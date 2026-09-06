import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { loadPassportEvidence } from '../../lib/passport/evidence.server';
import { buildPassportModel, DEFAULT_PASSPORT_BUDGET_WON, type PassportLocale } from '../../lib/passport/model';
import { PassportWorkspace } from './passport-workspace';

export async function PassportPage({ locale }: Readonly<{ locale: PassportLocale }>) {
  const path = locale === 'ko' ? '/ko/passport/' : locale === 'zh-CN' ? '/zh-cn/passport/' : '/passport/';
  const model = buildPassportModel({ budgetWon: DEFAULT_PASSPORT_BUDGET_WON, locale, evidence: await loadPassportEvidence() });
  return <>
    <SiteHeader copy={{ brand: 'signedprice', homeLabel: 'signedprice home', homeHref: locale === 'zh-CN' ? '/zh-cn/kr/seoul/' : '/', navigationLabel: 'Passport navigation', languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', links: [{ label: 'Passport', href: path, isCurrent: true }] }} />
    <PassportWorkspace initialModel={model} />
    <SiteFooter copy={{ brand: 'signedprice', descriptor: 'Evidence-backed cross-border property research.', navigationLabel: 'Footer', links: [], status: 'Screening evidence, not a valuation or listing.' }} locale={locale} />
  </>;
}
