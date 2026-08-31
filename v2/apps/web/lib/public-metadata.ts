import type { Metadata } from 'next';

export const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com' as const;

export function publicCanonical(path: `/${string}`): string {
  return `${SIGNEDPRICE_ORIGIN}${path}`;
}

export function indexableMetadata({
  path,
  title,
  description,
}: Readonly<{
  path: `/${string}`;
  title: string;
  description: string;
}>): Metadata {
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: publicCanonical(path) },
  };
}
