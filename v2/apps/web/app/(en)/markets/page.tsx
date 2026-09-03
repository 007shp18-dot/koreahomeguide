import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';

export const metadata: Metadata = {
  title: 'Global property markets | signedprice',
  description: 'Compare property evidence coverage across Seoul, Singapore and Dubai.',
};

export default function MarketsPage() {
  return <GlobalProductHub kind="markets" />;
}
