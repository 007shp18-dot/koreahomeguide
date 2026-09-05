import {
  buildEditorialArticleJsonLd,
  buildBreadcrumbJsonLd,
  publicSiteJsonLd,
  safeJsonLd,
} from '../lib/public-metadata';
import type { EditorialPortfolioRecord } from '../content/portfolio-types';

export function PublicSiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      data-structured-data="site"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(publicSiteJsonLd()) }}
    />
  );
}

export function PublicBreadcrumbJsonLd({
  items,
}: Readonly<{
  items: readonly Readonly<{ name: string; path: `/${string}` }>[];
}>) {
  return (
    <script
      type="application/ld+json"
      data-structured-data="breadcrumb"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(buildBreadcrumbJsonLd(items)) }}
    />
  );
}

export function PublicEditorialJsonLd({ article }: Readonly<{ article: EditorialPortfolioRecord }>) {
  return (
    <script
      type="application/ld+json"
      data-structured-data="editorial-article"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(buildEditorialArticleJsonLd(article)) }}
    />
  );
}
