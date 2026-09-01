import type { SiteFooterModel } from '../lib/site-copy';

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
    <footer className="site-footer">
      <div className="site-shell site-footer__inner">
        <div>
          <p className="site-footer__wordmark">{copy.brand}</p>
          <p className="site-footer__descriptor">{copy.descriptor}</p>
        </div>
        <nav aria-label={copy.navigationLabel}>
          <ul className="site-footer__links">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="site-footer__status">{copy.status}</p>
      </div>
    </footer>
  );
}
