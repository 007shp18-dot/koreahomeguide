import type { Metadata } from 'next';

import { DubaiCheckWorkspace } from '@/components/dubai/dubai-check-workspace';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import {
  resolveDubaiCheckRouteState,
} from '@/lib/dubai/check-model';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { buildDubaiCheckModel } from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;
type Props = Readonly<{ searchParams?: Promise<SearchParams> }>;

export async function generateMetadata({
  searchParams = Promise.resolve({}),
}: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  const model = buildDubaiCheckModel(dubaiEvidenceRepositoryFromEnvironment());
  if (model.status === 'unavailable') return {
    title: '比较迪拜房产报价 | signedprice',
    description: '目前无法获取用于价格比较的迪拜区域成交数据。',
    robots: { index: false, follow: true },
  };
  const metadata = indexableMetadata({
    path: '/zh-cn/ae/dubai/check/',
    title: '比较迪拜房产报价 | signedprice',
    description: '将现房或期房报价与迪拜区域成交中位价及每平方米迪拉姆价格比较，并根据您假设的年租金估算毛收益率。',
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
  return <DubaiShell locale="zh-CN" href="/zh-cn/ae/dubai/check/"><main><DubaiCheckWorkspace locale="zh-CN" model={model} state={state} /></main></DubaiShell>;
}
