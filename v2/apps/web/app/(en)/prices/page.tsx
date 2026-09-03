import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { buildSeoulLiveModel } from '@/lib/public-market/seoul-live-model.server';

export const metadata: Metadata = {
  title: 'Signed property prices | signedprice',
  description: 'Search released property contract evidence and compare local prices with their source context.',
};

export default function PricesPage() {
  return <GlobalProductHub kind="prices" seoul={buildSeoulLiveModel()} />;
}
