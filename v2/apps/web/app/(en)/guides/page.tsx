import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/guides/',
  title: 'Cross-border property guides | signedprice',
  description: 'Understand local property terms, comparison methods and evidence limits before making a decision.',
});

export default function GuidesPage() {
  return <GlobalProductHub kind="guides" />;
}
