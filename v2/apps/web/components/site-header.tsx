import {
  productNavigationLinks,
  type SiteHeaderModel,
} from '../lib/site-copy';
import Link from 'next/link';

import { BrandWordmark } from './brand-mark';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;

  function isCurrentProduct(href: string): boolean {
    if (currentHref === href) return true;
    if (href === '/kr/seoul/explore/' && currentHref?.startsWith('/kr/seoul/explore/')) return true;
    if (href === '/kr/seoul/news/' && currentHref?.startsWith('/kr/seoul/news/')) return true;
    if (href === '/kr/seoul/guide/' && currentHref?.startsWith('/kr/seoul/guide/')) return true;
    return false;
  }

  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <Link className="wordmark" href="/" aria-label={copy.homeLabel}>
          <BrandWordmark />
        </Link>
        <nav aria-label={copy.navigationLabel}>
          <ul className="site-header__links">
            {productNavigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrentProduct(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="site-header__market" aria-label="Current market and language">
          {copy.marketLabel ?? 'Seoul'} · {copy.languageLabel ?? 'EN'}
        </span>
      </div>
    </header>
  );
}
