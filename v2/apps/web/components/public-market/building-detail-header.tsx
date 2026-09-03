import type { SiteHeaderModel } from '../../lib/site-copy';
import { SiteHeader } from '../site-header';

const headerCopy: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Primary navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: {
    label: '한국어',
    href: '/ko/kr/seoul/explore/',
    hrefLang: 'ko',
  },
  links: [
    { label: 'Explore', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

export function BuildingDetailHeader() {
  return <SiteHeader copy={headerCopy} />;
}
