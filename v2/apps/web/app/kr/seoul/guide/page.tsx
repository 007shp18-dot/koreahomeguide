import type { Metadata } from 'next';

import { GuideIndex } from '../../../../components/guide/guide-index';

export const metadata: Metadata = {
  title: 'Seoul property evidence guides | signedprice',
  description: 'Learn how SignedPrice compares contracts and publishes Seoul property evidence.',
  robots: { index: false, follow: true },
};

export default function GuideIndexPage() {
  return <GuideIndex />;
}
