import type { Metadata } from 'next';

import { FutureServicePage } from '@/components/future-service-page';
import { homepageCopy } from '@/lib/site-copy';

export const metadata: Metadata = {
  title: 'Invest — Service preparing | signedprice',
  description: 'Cross-border property investment comparison is being prepared.',
  robots: { index: false, follow: true },
};

export default function InvestPage() {
  return <FutureServicePage type="invest" header={homepageCopy.header} footer={homepageCopy.footer} />;
}
