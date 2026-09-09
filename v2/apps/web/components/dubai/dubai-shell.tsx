import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-shell.module.css';


export function DubaiShell({ locale = 'en',  children, href }: Readonly<{ children: ReactNode; href: string }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const context = dubaiEvidenceRepositoryFromEnvironment()?.getContext();
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Dubai', languageLabel: locale === 'ko' ? 'KO' : 'EN', homeHref: locale === 'ko' ? '/ko/' : '/', links: [{ label: locale === 'ko' ? '두바이' : 'Dubai', href: marketHref(locale, href), isCurrent: true }] }} />{t(children)}{context && <p className={styles.source} data-market-source="dubai">{t("Source: ")}<a href={context.sourceUrl}>{t("Dubai Land Department open data")}</a>{t(" · ")}{context.comparisonPeriod.from}–{context.comparisonPeriod.to}<span>{t("SignedPrice is not affiliated with DLD or the Government of Dubai.")}</span></p>}<SiteFooter locale={locale} copy={{ ...homepageCopy.footer, descriptor: locale === 'ko' ? '실거래가와 시장 흐름을 한눈에.' : 'Property prices and market context, made clear.' }} /></div>;
}
