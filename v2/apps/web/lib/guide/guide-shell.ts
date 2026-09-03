import {
  KOREA_PUBLIC_RELEASE_STATUS,
  productNavigationLinks,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../site-copy';

export const KOREA_GUIDE_HEADER = Object.freeze({
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul guide navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  links: Object.freeze(productNavigationLinks.map((link) => Object.freeze({
    ...link,
    isCurrent: link.href === '/guides/',
  }))),
} satisfies SiteHeaderModel);

export const KOREA_GUIDE_FOOTER = Object.freeze({
  brand: 'signedprice',
  descriptor: 'Verified Seoul property evidence and decision methodology.',
  navigationLabel: 'Guide footer navigation',
  links: Object.freeze([
    Object.freeze({ label: 'Home', href: '/' }),
    Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/' }),
    Object.freeze({ label: 'Check', href: '/kr/seoul/check/' }),
    Object.freeze({ label: 'Trust', href: '/trust/' }),
    Object.freeze({ label: 'Corrections', href: '/kr/seoul/corrections/' }),
  ]),
  status: KOREA_PUBLIC_RELEASE_STATUS,
} satisfies SiteFooterModel);
