import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';

export const metadata: Metadata = {
  title: 'Cross-border property guides | signedprice',
  description: 'Understand local property terms, comparison methods and evidence limits before making a decision.',
};

export default function GuidesPage() {
  return <GlobalProductHub kind="guides" />;
}
