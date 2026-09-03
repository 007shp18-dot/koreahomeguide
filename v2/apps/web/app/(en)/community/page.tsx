import type { Metadata } from 'next';

import { FutureServicePage } from '@/components/future-service-page';
import { homepageCopy } from '@/lib/site-copy';

export const metadata: Metadata = {
  title: 'Community — Service preparing | signedprice',
  description: 'A moderated, evidence-led property community is being prepared.',
  robots: { index: false, follow: true },
};

export default function CommunityPage() {
  return <FutureServicePage type="community" header={homepageCopy.header} footer={homepageCopy.footer} />;
}
