import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { GlobalProductHub } from '@/components/global-product-hub';
import { buildSeoulLiveModel } from '@/lib/public-market/seoul-live-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/prices/',
  title: 'Signed property prices | signedprice',
  description: 'Search released property contract evidence and compare local prices with their source context.',
});

export default async function PricesPage({ searchParams }: Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const market = typeof query.market === 'string' ? query.market : 'seoul';
  if (q !== '') {
    const target = market === 'singapore'
      ? '/sg/singapore/explore/'
      : market === 'dubai'
        ? '/ae/dubai/explore/'
        : '/kr/seoul/explore/';
    redirect(`${target}?q=${encodeURIComponent(q)}`);
  }
  return <GlobalProductHub kind="prices" seoul={buildSeoulLiveModel()} />;
}
