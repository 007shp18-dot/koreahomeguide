import type { Metadata } from 'next';

import { SingaporeCheckWorkspace } from '@/components/singapore/singapore-check-workspace';
import { indexableMetadata } from '@/lib/public-metadata';
import { loadSingaporeCheckPageModel, singaporeCheckPageIsIndexable } from '@/lib/singapore/check-page-loader.server';
import type { SingaporeCheckQuery } from '@/lib/singapore/check-route-model.server';

const privateMetadata: Metadata = {
  title: 'Compare an asking price in Singapore | signedprice',
  description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
  alternates: { canonical: 'https://www.signedprice.com/sg/singapore/check/' },
  robots: { index: false, follow: false },
};

type Props = Readonly<{ searchParams?: Promise<SingaporeCheckQuery> }>;

export async function generateMetadata({ searchParams = Promise.resolve({}) }: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  if (Object.keys(query).length > 0) return privateMetadata;
  return await singaporeCheckPageIsIndexable(query)
    ? indexableMetadata({
        path: '/sg/singapore/check/',
        title: 'Compare an asking price in Singapore | signedprice',
        description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
      })
    : privateMetadata;
}

export default async function SingaporeCheckPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  const model = await loadSingaporeCheckPageModel(await searchParams);
  return <SingaporeCheckWorkspace model={model} />;
}

export const revalidate = 60;
