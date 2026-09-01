import {
  buildBreadcrumbJsonLd,
  publicSiteJsonLd,
  safeJsonLd,
} from '../lib/public-metadata';

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
