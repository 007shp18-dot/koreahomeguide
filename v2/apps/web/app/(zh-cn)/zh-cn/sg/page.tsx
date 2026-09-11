import type { Metadata } from 'next';

import { SingaporeEntry } from '@/components/singapore/singapore-entry';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { buildSingaporeEntryModel } from '@/lib/singapore/route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/sg/',
  title: '新加坡私人住宅成交数据 | signedprice',
  description: '经核验的 URA 私人住宅成交数据，注明公开范围和限制。',
});

export default async function SingaporeEntryPage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  return <SingaporeEntry locale="zh-CN"
    model={buildSingaporeEntryModel(repository)}
    googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
  />;
}
