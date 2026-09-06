import Link from 'next/link';
import type { SiteFooterModel } from '../lib/site-copy';
import { globalNavigation, marketNavigation, type SiteLocale } from '../lib/navigation/site-navigation';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '../lib/operator/public-contacts';
import { BrandWordmark } from './brand-mark';
import styles from './site-footer.module.css';

export function SiteFooter({ copy, locale = 'en' }: Readonly<{ copy: SiteFooterModel; locale?: SiteLocale }>) {
  const groups = [
    { label: 'Explore SignedPrice', links: globalNavigation(locale) },
    { label: 'Markets', links: marketNavigation },
    { label: 'About', links: [{ label: 'Method', href: '/trust/' }, { label: 'Privacy', href: '/privacy/' }, { label: 'Contact', href: '/contact/' }] },
  ];
  return <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.intro}><Link href="/" aria-label="signedprice home"><BrandWordmark /></Link><p className={styles.descriptor}>{copy.descriptor}</p></div>
      <div className={styles.navigation}>{groups.map((group) => <nav key={group.label} aria-label={`Footer ${group.label}`}><p>{group.label}</p><ul className={styles.links}>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></nav>)}</div>
      <p className={styles.status}>Source, reporting period and coverage are shown with each dataset.</p>
      <div className={styles.contacts} aria-label="SignedPrice email contacts"><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a><a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a></div>
    </div>
  </footer>;
}
