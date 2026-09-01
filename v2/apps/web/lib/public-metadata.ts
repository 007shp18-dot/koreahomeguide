import type { Metadata } from 'next';

export const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com' as const;

export function publicCanonical(path: `/${string}`): string {
  return `${SIGNEDPRICE_ORIGIN}${path}`;
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
