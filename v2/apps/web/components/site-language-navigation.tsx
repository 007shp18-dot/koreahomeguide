'use client';

import Link from 'next/link';
import type { SiteHeaderModel } from '../lib/site-copy';
import type { EditorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { usePathname, useSearchParams } from 'next/navigation';
import { languageDestinations, type SiteLocale } from '../lib/navigation/site-navigation';

const languages = [['en', 'EN'], ['ko', 'KO'], ['zh-CN', '中文']] as const;

export function LanguageLinks({ pathname, search = '', translations = {}, alternate }: Readonly<{ pathname: string; search?: string; translations?: EditorialLanguageRoutes; alternate?: SiteHeaderModel['languageSwitch'] }>) {
  const [base, inlineQuery] = pathname.split('?');
  const destinations = { ...languageDestinations(base!, search || (inlineQuery ? `?${inlineQuery}` : '')), ...translations[`${pathname.replace(/\/+$/, '')}/`] };
  if (alternate && destinations[alternate.hrefLang] === null) destinations[alternate.hrefLang] = alternate.href;
  const locale: SiteLocale = pathname.startsWith('/ko/') ? 'ko' : pathname.startsWith('/zh-cn/') ? 'zh-CN' : 'en';
  return <nav className="site-header__languages" aria-label="Language navigation">
    {languages.map(([id, label]) => destinations[id] === null
      ? <span key={id} className="site-header__language" aria-disabled="true" lang={id} title={id === 'ko' ? '이 페이지의 한국어 번역은 아직 없습니다' : id === 'zh-CN' ? '此页面暂无中文版本' : 'This page is not available in English'}>{label}</span>
      : <Link key={id} className="site-header__language" href={destinations[id]} hrefLang={id} lang={id} aria-current={locale === id ? 'page' : undefined}>{label}</Link>)}
  </nav>;
}

export function SiteLanguageNavigation({ fallbackPath, translations, alternate }: Readonly<{ fallbackPath: string; translations?: EditorialLanguageRoutes; alternate?: SiteHeaderModel['languageSwitch'] }>) {
  const pathname = usePathname() ?? fallbackPath;
  const params = useSearchParams();
  const search = params?.toString();
  return <LanguageLinks pathname={pathname} search={search ? `?${search}` : ''} translations={translations} alternate={alternate} />;
}
