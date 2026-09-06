import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/markets/',
  title: 'Global property markets | signedprice',
  description: 'Research buying eligibility, acquisition costs and comparable property transactions in Seoul and Singapore, with links to local guides and market data.',
});

export default function MarketsPage() {
  return <GlobalProductHub kind="markets" />;
}
