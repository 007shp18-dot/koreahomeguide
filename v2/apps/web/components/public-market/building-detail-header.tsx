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

export function BuildingDetailHeader({locale='en'}:Readonly<{locale?:'en'|'ko'|'zh-CN'}>) {
  const copy: SiteHeaderModel = locale === 'en' ? headerCopy : {...headerCopy, languageLabel: locale === 'ko' ? 'KO' : '中文', languageSwitch:{label:'EN',href:'/kr/seoul/explore/',hrefLang:'en'}, links:[{label:locale === 'ko' ? '탐색' : '探索',href:locale === 'ko' ? '/ko/kr/seoul/explore/' : '/zh-cn/kr/seoul/explore/',isCurrent:true}]};
  return <SiteHeader copy={copy} />;
}
