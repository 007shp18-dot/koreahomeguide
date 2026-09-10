import type { Metadata } from 'next';

import { MarketFeaturePage } from '@/components/market-ui/market-feature-page';

export const metadata: Metadata = {
  title: 'Seoul property community | signedprice',
  description: 'The read-only foundation for Seoul district and building communities.',
  robots: { index: false, follow: true },
};

export default function SeoulCommunityPage() {
  return <MarketFeaturePage
    city="Seoul"
    code="KR"
    feature="community"
    href="/kr/seoul/community/"
    overviewHref="/kr/seoul/"
  />;
}
