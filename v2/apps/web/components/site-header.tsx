import type { SiteHeaderModel } from '../lib/site-copy';
import Link from 'next/link';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <Link className="wordmark" href="/" aria-label={copy.homeLabel}>
          {copy.brand}
        </Link>
        <nav aria-label={copy.navigationLabel}>
          <ul className="site-header__links">
            {copy.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
