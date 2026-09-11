import type { Metadata } from 'next';

import { SingaporeCheckWorkspace } from '@/components/singapore/singapore-check-workspace';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { loadSingaporeCheckPageModel, singaporeCheckPageIsIndexable } from '@/lib/singapore/check-page-loader.server';
import type { SingaporeCheckQuery } from '@/lib/singapore/check-route-model.server';

const privateMetadata: Metadata = {
  title: '比较新加坡房产报价 | signedprice',
  description: '将私人住宅售价、组屋转售价或月租与新加坡近期成交记录进行比较。',
  alternates: { canonical: 'https://www.signedprice.com/zh-cn/sg/singapore/check/' },
  robots: { index: false, follow: false },
};

type Props = Readonly<{ searchParams?: Promise<SingaporeCheckQuery> }>;

export async function generateMetadata({ searchParams = Promise.resolve({}) }: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  if (Object.keys(query).length > 0) return privateMetadata;
  return await singaporeCheckPageIsIndexable(query)
    ? indexableMetadata({
        path: '/zh-cn/sg/singapore/check/',
        title: '比较新加坡房产报价 | signedprice',
        description: '将私人住宅售价、组屋转售价或月租与新加坡近期成交记录进行比较。',
      })
    : privateMetadata;
}

export default async function SingaporeCheckPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  const model = await loadSingaporeCheckPageModel(await searchParams);
  return <SingaporeCheckWorkspace locale="zh-CN" model={model} />;
}

export const revalidate = 3_600;
