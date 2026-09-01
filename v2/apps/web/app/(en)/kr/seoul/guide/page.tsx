import type { Metadata } from 'next';

import { GuideIndex } from '@/components/guide/guide-index';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { KOREA_GUIDE_FOOTER, KOREA_GUIDE_HEADER } from '@/lib/guide/guide-shell';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/guide/',
  title: 'Seoul property evidence guides | signedprice',
  description: 'Learn how SignedPrice compares contracts and publishes Seoul property evidence.',
});

export default function GuideIndexPage() {
  return (
    <div id="top">
      <SiteHeader copy={KOREA_GUIDE_HEADER} />
      <GuideIndex />
      <SiteFooter copy={KOREA_GUIDE_FOOTER} />
    </div>
  );
}
