import type { SiteHeaderModel } from '../../lib/site-copy';
import { SiteHeader } from '../site-header';

const headerCopy: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Primary navigation',
  links: [
    { label: 'Explore', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

export function BuildingDetailHeader() {
  return <SiteHeader copy={headerCopy} />;
}
