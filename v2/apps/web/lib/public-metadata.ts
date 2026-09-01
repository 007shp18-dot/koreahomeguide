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
        inLanguage: Object.freeze(['en', 'ko']),
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
}: Readonly<{
  path: `/${string}`;
  title: string;
  description: string;
  languageAlternates?: Readonly<{ en: `/${string}`; ko: `/${string}` }>;
}>): Metadata {
  const languages = languageAlternates === undefined ? undefined : {
    en: publicCanonical(languageAlternates.en),
    ko: publicCanonical(languageAlternates.ko),
    'x-default': publicCanonical(languageAlternates.en),
  };
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: publicCanonical(path),
      ...(languages === undefined ? {} : { languages }),
    },
  };
}
