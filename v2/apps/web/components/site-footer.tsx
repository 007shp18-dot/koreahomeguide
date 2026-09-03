import type { SiteFooterModel } from '../lib/site-copy';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '../lib/operator/public-contacts';
import { BrandWordmark } from './brand-mark';
import styles from './site-footer.module.css';

type SiteFooterProps = {
  copy: SiteFooterModel;
};

export function SiteFooter({ copy }: SiteFooterProps) {
  const legalLinks = [
    { label: 'Privacy', href: '/privacy/' },
    { label: 'Contact', href: '/contact/' },
  ] as const;
  const links = [
    ...copy.links,
    ...legalLinks.filter(({ href }) => copy.links.every((link) => link.href !== href)),
  ];
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <BrandWordmark />
          <p className={styles.descriptor}>{copy.descriptor}</p>
        </div>
        <nav aria-label={copy.navigationLabel}>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.status}>{copy.status}</p>
        <div className={styles.contacts} aria-label="SignedPrice email contacts">
          <a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
          <a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a>
        </div>
      </div>
    </footer>
  );
}
