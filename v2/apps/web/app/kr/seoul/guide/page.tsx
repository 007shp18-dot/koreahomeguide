import type { Metadata } from 'next';

import { GuideIndex } from '../../../../components/guide/guide-index';
import { indexableMetadata } from '../../../../lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/guide/',
  title: 'Seoul property evidence guides | signedprice',
  description: 'Learn how SignedPrice compares contracts and publishes Seoul property evidence.',
});

export default function GuideIndexPage() {
  return <GuideIndex />;
}
