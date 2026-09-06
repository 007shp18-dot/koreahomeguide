import type { ReactNode } from 'react';

import { EditorialGrowthContent } from '../design-review/editorial-growth-content';
import { EditorialGrowthHome } from '../design-review/editorial-growth-home';
import reviewStyles from '../design-review/editorial-growth-review.module.css';
import type {
  EditorialGrowthReviewModel,
  ReviewLocale,
} from '../../lib/design-review/editorial-growth-review-model';
import { PUBLIC_EDITORIAL_SURFACES } from '../../lib/editorial-growth/public-editorial-routes';
import { SiteHeader } from '../site-header';
import { homepageCopy } from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';


type PublicEditorialSurface = 'home' | 'content';

const COPY = {
  en: { footer: 'Reported property evidence and practical guidance for decisions across borders.' },
  'zh-CN': { footer: '为跨境决策提供已申报房地产数据和实用指南。' },
} as const;

export function EditorialGrowthPublicShell({
  surface,
  model,
}: Readonly<{
  surface: PublicEditorialSurface;
  model: EditorialGrowthReviewModel;
}>) {
  const hrefs = PUBLIC_EDITORIAL_SURFACES[model.locale];

  return (
    <EditorialGrowthPublicFrame locale={model.locale} surface={surface} shell>
      {surface === 'home'
        ? <EditorialGrowthHome model={model} hrefs={hrefs} />
        : <EditorialGrowthContent model={model} hrefs={hrefs} />}
    </EditorialGrowthPublicFrame>
  );
}

export function EditorialGrowthPublicFrame({
  children,
  locale,
  shell = false,
  surface,
  activeSection = 'news',
}: Readonly<{
  activeSection?: 'news' | 'guides';
  children: ReactNode;
  locale: ReviewLocale;
  shell?: boolean;
  surface: PublicEditorialSurface;
}>) {
  const copy = COPY[locale];
  const hrefs = PUBLIC_EDITORIAL_SURFACES[locale];

  return (
    <div
      className={reviewStyles.reviewRoot}
      data-public-editorial-frame={surface}
      data-public-editorial-shell={shell ? surface : undefined}
      data-review-locale={locale}
      lang={locale}
    >
      <SiteHeader copy={{
        ...homepageCopy.header,
        homeHref: hrefs.home,
        links: surface === 'content'
          ? [{ label: activeSection, href: `/${activeSection}/`, isCurrent: true }]
          : homepageCopy.header.links,
        ...(locale === 'zh-CN' ? {
          languageLabel: 'ZH',
          languageSwitch: { label: 'English', href: surface === 'home' ? '/' : `/${activeSection}/`, hrefLang: 'en' as const },
        } : {}),
      }} />

      {children}

      <SiteFooter copy={{ ...homepageCopy.footer, descriptor: copy.footer }} locale={locale} />
    </div>
  );
}
