import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';


export function DubaiShell({ locale = 'en',  children, href }: Readonly<{ children: ReactNode; href: string }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const context = dubaiEvidenceRepositoryFromEnvironment()?.getContext();
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Dubai', languageLabel: locale === 'ko' ? 'KO' : 'EN', homeHref: locale === 'ko' ? '/ko/' : '/', links: [{ label: locale === 'ko' ? '두바이' : 'Dubai', href: marketHref(locale, href), isCurrent: true }] }} />{context && <p style={{ maxWidth: 1280, margin: '16px auto', padding: '0 20px', fontSize: '.875rem', lineHeight: 1.6 }}>{t("Source: ")}<a href={marketHref(locale, context.sourceUrl)}>{t("Dubai Land Department open data")}</a> {t(" · ")}{t(context.comparisonPeriod.from)}{t("–")}{t(context.comparisonPeriod.to)}{t(" · SignedPrice is not affiliated with DLD or the Government of Dubai.")}</p>}{t(children)}<SiteFooter locale={locale} copy={{ ...homepageCopy.footer, descriptor: 'Property prices and market context, made clear.' }} /></div>;
}
