import type { Metadata } from 'next';

import { DubaiCheckWorkspace } from '@/components/dubai/dubai-check-workspace';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import {
  resolveDubaiCheckRouteState,
} from '@/lib/dubai/check-model';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { buildDubaiCheckModel } from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;
type Props = Readonly<{ searchParams?: Promise<SearchParams> }>;

export async function generateMetadata({
  searchParams = Promise.resolve({}),
}: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  const model = buildDubaiCheckModel(dubaiEvidenceRepositoryFromEnvironment());
  if (model.status === 'unavailable') return {
    title: 'Compare an asking price in Dubai | signedprice',
    description: 'Dubai area transaction data is currently unavailable for price comparisons.',
    robots: { index: false, follow: true },
  };
  const metadata = indexableMetadata({
    path: '/ae/dubai/check/',
    title: 'Compare an asking price in Dubai | signedprice',
    description: 'Compare Ready or Off-Plan asking prices with Dubai area transaction medians and AED per square metre. Estimate gross yield using your annual-rent assumption.',
  });
  return Object.keys(query).length === 0
    ? metadata
    : { ...metadata, robots: { index: false, follow: true } };
}

export default async function DubaiCheckPage({
  searchParams = Promise.resolve({}),
}: Props = {}) {
  const query: SearchParams = await searchParams;
  const state = resolveDubaiCheckRouteState(query);
  const model = buildDubaiCheckModel(dubaiEvidenceRepositoryFromEnvironment());
  return <DubaiShell href="/ae/dubai/check/"><main><DubaiCheckWorkspace model={model} state={state} /></main></DubaiShell>;
}
