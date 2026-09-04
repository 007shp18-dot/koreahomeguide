import type { Metadata } from 'next';

export const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com' as const;

export function publicCanonical(path: `/${string}`): string {
  return `${SIGNEDPRICE_ORIGIN}${path}`;
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function publicSiteJsonLd(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    '@context': 'https://schema.org',
    '@graph': Object.freeze([
      Object.freeze({
        '@type': 'Organization',
        '@id': `${SIGNEDPRICE_ORIGIN}/#organization`,
        name: 'SignedPrice',
        url: publicCanonical('/'),
      }),
      Object.freeze({
        '@type': 'WebSite',
        '@id': `${SIGNEDPRICE_ORIGIN}/#website`,
        name: 'SignedPrice',
        url: publicCanonical('/'),
        inLanguage: Object.freeze(['en', 'ko', 'zh-Hans']),
        publisher: Object.freeze({ '@id': `${SIGNEDPRICE_ORIGIN}/#organization` }),
      }),
    ]),
  });
}

export function buildBreadcrumbJsonLd(
  items: readonly Readonly<{ name: string; path: `/${string}` }>[],
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: Object.freeze(items.map(({ name, path }, index) => Object.freeze({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: publicCanonical(path),
    }))),
  });
}

export function indexableMetadata({
  path,
  title,
  description,
  languageAlternates,
  locale = 'en_US',
  imagePath = '/og/en/',
}: Readonly<{
  path: `/${string}`;
  title: string;
  description: string;
  languageAlternates?: Readonly<{
    en: `/${string}`;
    ko?: `/${string}`;
    'zh-Hans'?: `/${string}`;
  }>;
  locale?: 'en_US' | 'ko_KR' | 'zh_CN';
  imagePath?: `/${string}`;
}>): Metadata {
  const languages = languageAlternates === undefined ? undefined : {
    en: publicCanonical(languageAlternates.en),
    ...(languageAlternates.ko === undefined ? {} : {
      ko: publicCanonical(languageAlternates.ko),
    }),
    ...(languageAlternates['zh-Hans'] === undefined ? {} : {
      'zh-Hans': publicCanonical(languageAlternates['zh-Hans']),
    }),
    'x-default': publicCanonical(languageAlternates.en),
  };
  const canonical = publicCanonical(path);
  const image = publicCanonical(imagePath);
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      ...(languages === undefined ? {} : { languages }),
    },
    openGraph: {
      type: 'website',
      siteName: 'SignedPrice',
      title,
      description,
      url: canonical,
      locale,
      ...(languageAlternates === undefined ? {} : {
        alternateLocale: [
          ...(locale === 'en_US' ? [] : ['en_US']),
          ...(languageAlternates.ko === undefined || locale === 'ko_KR' ? [] : ['ko_KR']),
          ...(languageAlternates['zh-Hans'] === undefined || locale === 'zh_CN' ? [] : ['zh_CN']),
        ],
      }),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
