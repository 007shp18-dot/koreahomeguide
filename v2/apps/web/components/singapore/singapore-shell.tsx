import { localizedMarketCopy } from '../../lib/locale/market-localization';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import { resolveMarketNavigation, type ProductSurface } from '../../lib/navigation/market-route-resolver';
import type { SingaporeEvidenceModel } from '../../lib/singapore/route-types';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import styles from './singapore.module.css';

export const singaporeHeader: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Singapore evidence navigation',
  navigationVariant: 'supplied',
  marketLabel: 'Singapore',
  links: resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'home' }).links,
};

export const singaporeFooter: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Singapore private-home and HDB evidence, with source periods and coverage shown.',
  navigationLabel: 'Singapore footer navigation',
  links: [
    ...resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'home' }).links,
  ],
  status: 'Reported sales, registered rents and property facts use separate sources and reporting periods.',
};

export function SingaporePage({ locale = 'en', children, currentHref, unframed = false }: Readonly<{ locale?: MarketLocale;
  children: React.ReactNode;
  currentHref?: string;
  unframed?: boolean;
}>) {
  const surface: ProductSurface = currentHref?.includes('/check/') ? 'check'
    : currentHref?.includes('/explore/') || currentHref?.includes('/hdb/') ? 'explore'
      : currentHref?.includes('/rankings/') ? 'rankings'
      : currentHref?.includes('/corrections/') ? 'corrections'
        : 'home';
  const navigation = resolveMarketNavigation({ market: 'singapore', locale, surface });
  const header = { ...singaporeHeader,
    homeHref: locale === 'ko' ? '/ko/' : locale === 'zh-CN' ? '/zh-cn/' : '/',
    homeLabel: locale === 'ko' ? 'signedprice 홈' : locale === 'zh-CN' ? 'signedprice 首页' : singaporeHeader.homeLabel,
    navigationLabel: locale === 'ko' ? '싱가포르 자료 탐색' : locale === 'zh-CN' ? '新加坡市场导航' : singaporeHeader.navigationLabel,
    marketLabel: localizedMarketCopy(locale, "Singapore", "싱가포르"),
    languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN',
    links: currentHref === undefined ? navigation.links : [...navigation.links.map(link => ({ ...link, isCurrent: false })), { label: locale === 'ko' ? '현재 페이지' : locale === 'zh-CN' ? '当前页面' : 'Current page', href: currentHref, isCurrent: true }],
  };
  const footer = { ...singaporeFooter, links: navigation.links,
    descriptor: locale === 'ko' ? '싱가포르 민간주택과 HDB 자료의 출처 기간 및 범위를 확인하세요.' : locale === 'zh-CN' ? '新加坡私人住宅和组屋数据，注明来源期间及覆盖范围。' : singaporeFooter.descriptor,
    navigationLabel: locale === 'ko' ? '싱가포르 하단 탐색' : locale === 'zh-CN' ? '新加坡页脚导航' : singaporeFooter.navigationLabel,
    status: locale === 'ko' ? '신고 매매, 등록 임대 및 주택 정보는 출처와 보고 기간이 서로 다릅니다.' : locale === 'zh-CN' ? '申报买卖、登记租赁及房产资料分别采用不同来源与统计期间。' : singaporeFooter.status,
  };
  return (
    <div id="top" className={styles.page}>
      <SiteHeader copy={header} />
      <main className={unframed ? styles.mainUnframed : styles.main}>{sgText(locale, children)}</main>
      <SiteFooter locale={locale} copy={footer} />
    </div>
  );
}

export function SingaporeScope({ locale = 'en', activeSegment }: Readonly<{ locale?: MarketLocale; activeSegment?: 'CCR' | 'RCR' | 'OCR' }>) {
  return (
    <div className={styles.scope} aria-label={sgText(locale, "Singapore sale scope")}>
      {activeSegment === undefined
        ? <><span>{sgText(locale, "CCR")}</span><span>{sgText(locale, "RCR")}</span><span>{sgText(locale, "OCR")}</span><span>{sgText(locale, "New sale")}</span><span>{sgText(locale, "Subsale")}</span><span>{sgText(locale, "Resale")}</span></>
        : <span>{sgText(locale, activeSegment)}</span>}
      {activeSegment === undefined ? null : <span>{sgText(locale, "Private residential sales")}</span>}
    </div>
  );
}

export function SingaporeEvidence({ locale = 'en',
  model,
  compact = false,
}: Readonly<{ locale?: MarketLocale; model: SingaporeEvidenceModel; compact?: boolean }>) {
  const content = <>
    <p className={styles.sectionLabel}>{sgText(locale, "Source boundary")}</p>
    <h2 id="singapore-source-heading">{sgText(locale, "What this evidence can support.")}</h2>
    <EvidenceDisclosure locale={locale}
      model={model.descriptor}
      boundary={sgText(locale, "Private residential sale transactions; native area basis retained; publication minimum enforced.")}
      attribution={['Urban Redevelopment Authority (URA), Singapore']}
    />
    <ul className={styles.limitations}>
      {model.limitations.map((limitation) => <li key={limitation}>{sgText(locale, limitation)}</li>)}
    </ul>
    <nav className={styles.evidenceLinks} aria-label={localizedMarketCopy(locale, "Evidence guidance", "출처 안내")}>
      <Link href={marketHref(locale, "/trust/")}>{sgText(locale, "Review Global Trust")}</Link>
      <Link href={marketHref(locale, model.correctionHref)}>{sgText(locale, "Review Singapore corrections")}</Link>
    </nav>
  </>;
  return (
    <section id="singapore-source" className={`${styles.section} ${styles.evidenceSection} ${compact ? styles.compactEvidence : ''}`} aria-labelledby="singapore-source-heading">
      {compact ? <><div className={styles.sourceSummary}><strong>{model.descriptor.provider}</strong><span>{localizedMarketCopy(locale, "Private residential sales", "민간주택 실거래")}</span><time>{model.period}</time></div><details><summary>{sgText(locale, "Sources & limits")}</summary><div>{sgText(locale, content)}</div></details></> : content}
    </section>
  );
}

export { styles as singaporeStyles };
