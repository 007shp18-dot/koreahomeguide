import Link from 'next/link';
import type { ReactNode } from 'react';

import { EditorialGrowthContent } from '../design-review/editorial-growth-content';
import { EditorialGrowthHome } from '../design-review/editorial-growth-home';
import reviewStyles from '../design-review/editorial-growth-review.module.css';
import type {
  EditorialGrowthReviewModel,
  ReviewLocale,
} from '../../lib/design-review/editorial-growth-review-model';
import { PUBLIC_EDITORIAL_SURFACES } from '../../lib/editorial-growth/public-editorial-routes';
import styles from './editorial-growth-public-shell.module.css';

/* eslint-disable @next/next/no-html-link-for-pages -- Canonical slash links remain literal for crawler contracts. */

type PublicEditorialSurface = 'home' | 'content';

const COPY: Readonly<Record<ReviewLocale, Readonly<{
  navigation: string;
  language: string;
  labels: Readonly<Record<'home' | 'content' | 'check' | 'explore', string>>;
  footer: string;
}>>> = Object.freeze({
  en: Object.freeze({
    navigation: 'Primary navigation',
    language: 'Language navigation',
    labels: Object.freeze({ home: 'Home', content: 'Journal', check: 'Check', explore: 'Explore' }),
    footer: 'Reported property evidence and practical guidance for decisions across borders.',
  }),
  'zh-CN': Object.freeze({
    navigation: '主要导航',
    language: '语言导航',
    labels: Object.freeze({ home: '首页', content: '专栏', check: '查价', explore: '探索' }),
    footer: '为跨境决策提供已申报房地产数据和实用指南。',
  }),
});

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
}: Readonly<{
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
      <header className={styles.header}>
        <Link className={styles.wordmark} href={hrefs.home} aria-label="signedprice home">
          signed<span>price</span>
        </Link>
        <nav className={styles.primaryNav} aria-label={copy.navigation}>
          {(Object.keys(copy.labels) as readonly (keyof typeof copy.labels)[]).map((item) => (
            <Link
              aria-current={surface === item ? 'page' : undefined}
              href={hrefs[item]}
              key={item}
            >
              {copy.labels[item]}
            </Link>
          ))}
        </nav>
        <nav className={styles.languageNav} aria-label={copy.language}>
          <Link aria-current={locale === 'en' ? 'page' : undefined} href={PUBLIC_EDITORIAL_SURFACES.en[surface]}>EN</Link>
          <Link aria-current={locale === 'zh-CN' ? 'page' : undefined} href={PUBLIC_EDITORIAL_SURFACES['zh-CN'][surface]}>中文</Link>
        </nav>
      </header>

      {children}

      <footer className={styles.footer}>
        <p><strong>signed<span>price</span></strong> · {copy.footer}</p>
        <div className={styles.footerNavs}>
          <nav aria-label="Market navigation">
            <Link href="/kr/seoul/">Seoul</Link>
            <Link href="/sg/">Singapore</Link>
            <Link href="/sg/singapore/explore/">Singapore Explore</Link>
            <Link href="/ae/dubai/">Dubai</Link>
          </nav>
          <nav aria-label="Seoul navigation">
            <Link href="/kr/seoul/check/">Check</Link>
            <Link href="/kr/seoul/explore/">Explore</Link>
            <Link href="/kr/seoul/rankings/">Rankings</Link>
            <Link href="/kr/seoul/news/">News</Link>
            <Link href="/kr/seoul/guide/">Guides</Link>
          </nav>
          <nav aria-label="Legal navigation">
            <a href="/trust/">Method</a>
            <a href="/privacy/">Privacy</a>
            <a href="/contact/">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
