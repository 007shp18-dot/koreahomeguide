import type { Metadata } from 'next';

import { EditorialGrowthPublicShell } from '@/components/editorial-growth/editorial-growth-public-shell';
import { buildEditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model.server';
import { homepageCopy } from '@/lib/site-copy';

export const metadata: Metadata = homepageCopy.metadata;

export default async function Home() {
  const model = await buildEditorialGrowthReviewModel({
    locale: 'en',
    state: 'ready',
    ad: 'empty',
  });

  return (
    <EditorialGrowthPublicShell surface="home" model={model} />
  );
}
