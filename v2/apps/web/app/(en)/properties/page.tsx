import type { Metadata } from 'next';

import { FutureServicePage } from '@/components/future-service-page';
import { homepageCopy } from '@/lib/site-copy';

export const metadata: Metadata = {
  title: 'Properties — Service preparing | signedprice',
  description: 'Evidence-backed property discovery is being prepared.',
  robots: { index: false, follow: true },
};

export default function PropertiesPage() {
  return <FutureServicePage type="properties" header={homepageCopy.header} footer={homepageCopy.footer} />;
}
