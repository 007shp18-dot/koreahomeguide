import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/markets/',
  // The Korean market menu redirects to its home; it is not this page's translation.
  languageAlternates: null,
  title: 'Global property markets | signedprice',
  description: 'Compare property markets in Seoul, Singapore and Dubai. Explore recorded prices, buying requirements and purchase costs before choosing an area.',
});

export default function MarketsPage() {
  return <GlobalProductHub kind="markets" />;
}
