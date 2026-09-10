import type {
  ReviewLocale,
  ReviewSurface,
} from '../design-review/editorial-growth-review-model';

type PublicEditorialRouteTable = Readonly<Record<
  ReviewLocale,
  Readonly<Record<ReviewSurface, `/${string}`>>
>>;

export const PUBLIC_EDITORIAL_SURFACES: PublicEditorialRouteTable = Object.freeze({
  en: Object.freeze({
    home: '/',
    content: '/news/',
    check: '/kr/seoul/check/',
    explore: '/kr/seoul/explore/',
  }),
  'zh-CN': Object.freeze({
    home: '/zh-cn/',
    content: '/zh-cn/news/',
    check: '/kr/seoul/check/',
    explore: '/kr/seoul/explore/',
  }),
});

export function publicEditorialHref(
  surface: ReviewSurface,
  locale: ReviewLocale,
): `/${string}` {
  return PUBLIC_EDITORIAL_SURFACES[locale][surface];
}

export function publicEditorialLanguageHref(
  surface: ReviewSurface,
  locale: ReviewLocale,
): `/${string}` {
  return publicEditorialHref(surface, locale);
}
