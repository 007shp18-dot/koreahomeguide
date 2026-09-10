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

export function BuildingDetailHeader({locale='en'}:Readonly<{locale?:'en'|'ko'}>) {
  return <SiteHeader copy={locale === 'en' ? headerCopy : {...headerCopy, languageLabel:'KO',languageSwitch:{label:'EN',href:'/kr/seoul/explore/',hrefLang:'en'},links:[{label:'탐색',href:'/ko/kr/seoul/explore/',isCurrent:true}]}} />;
}
