import type { Metadata } from 'next';

import { CommunityIndexPage } from '@/components/community/community-index-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/community/',
  title: 'Local property communities | signedprice',
  description: 'Browse the SignedPrice community structure by market, district, neighbourhood and building.',
});

export default function CommunityPage() {
  return <CommunityIndexPage />;
}
