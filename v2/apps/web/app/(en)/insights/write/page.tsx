import type { Metadata } from 'next';

import { EditorialEditor } from '@/components/insights/editorial-editor';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { INSIGHTS_FOOTER, INSIGHTS_HEADER } from '@/lib/insights/insights-shell';

export const metadata: Metadata = {
  title: 'Editorial workspace | signedprice',
  description: 'Private SignedPrice editorial workspace.',
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

export default function EditorialEditorPage() {
  return (
    <div id="top">
      <SiteHeader copy={INSIGHTS_HEADER} />
      <EditorialEditor />
      <SiteFooter copy={INSIGHTS_FOOTER} />
    </div>
  );
}
