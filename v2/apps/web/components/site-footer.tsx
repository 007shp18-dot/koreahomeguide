import Link from 'next/link';
import type { SiteFooterModel } from '../lib/site-copy';
import { globalNavigation, marketNavigation, type SiteLocale } from '../lib/navigation/site-navigation';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '../lib/operator/public-contacts';
import { BrandWordmark } from './brand-mark';
import styles from './site-footer.module.css';

export function SiteFooter({ copy, locale = 'en' }: Readonly<{ copy: SiteFooterModel; locale?: SiteLocale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const marketLinks = marketNavigation.map((market) => ({
    ...market,
    label: ko
      ? ({ 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' } as const)[market.id]
      : zh
        ? ({ 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' } as const)[market.id]
        : market.label,
    href: ko && market.id !== 'jp-tokyo'
      ? ({ 'kr-seoul': '/ko/kr/seoul/', 'sg-singapore': '/ko/sg/', 'ae-dubai': '/ko/ae/dubai/' } as const)[market.id]
      : market.href,
  }));
  const groups = [
    { label: ko ? '서비스' : 'Explore SignedPrice', links: globalNavigation(locale) },
    { label: ko ? '도시' : zh ? '城市' : 'Cities', links: marketLinks },
    { label: ko ? '안내' : 'About', links: [{ label: ko ? '데이터 기준 (영문)' : 'Method', href: '/trust/' }, { label: ko ? '개인정보 (영문)' : 'Privacy', href: '/privacy/' }, { label: ko ? '문의' : 'Contact', href: ko ? '/ko/contact/' : '/contact/' }] },
  ];
  return <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.intro}><Link href={ko ? '/ko/' : '/'} aria-label="signedprice home"><BrandWordmark /></Link><p className={styles.descriptor}>{copy.descriptor}</p></div>
      <div className={styles.navigation}>{groups.map((group) => <nav key={group.label} aria-label={`Footer ${group.label}`}><p>{group.label}</p><ul className={styles.links}>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></nav>)}</div>
      <p className={styles.status}>{ko ? '각 데이터에 출처·집계 기간·제공 범위를 표시합니다.' : 'Source, reporting period and coverage are shown with each dataset.'}</p>
      <div className={styles.contacts} aria-label="SignedPrice email contacts"><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a><a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a></div>
    </div>
  </footer>;
}
