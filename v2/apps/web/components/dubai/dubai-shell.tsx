import { localizedMarketCopy } from '../../lib/locale/market-localization';
import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-shell.module.css';
import { DubaiSourceNotice } from './dubai-source-notice';


export function DubaiShell({ locale = 'en',  children, href }: Readonly<{ children: ReactNode; href: string }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const context = dubaiEvidenceRepositoryFromEnvironment()?.getContext();
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, marketLabel: t('Dubai'), languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', homeHref: locale === 'ko' ? '/ko/' : locale === 'zh-CN' ? '/zh-cn/' : '/', links: [{ label: localizedMarketCopy(locale, "Dubai", "두바이"), href: marketHref(locale, href), isCurrent: true }] }} />{t(children)}{context && <div className={styles.source} data-market-source="dubai"><DubaiSourceNotice locale={locale} sourceUrl={context.sourceUrl} licenseUrl={context.licenseUrl} period={`${context.comparisonPeriod.from}–${context.comparisonPeriod.to}`} /></div>}<SiteFooter locale={locale} copy={{ ...homepageCopy.footer, descriptor: localizedMarketCopy(locale, "Property prices and market context, made clear.", "실거래가와 시장 흐름을 한눈에.") }} /></div>;
}
