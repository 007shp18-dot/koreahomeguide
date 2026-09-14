import type { Metadata } from 'next';
import { indexableMetadata } from '@/lib/public-metadata';
import { RankingsPage } from '@/components/rankings/rankings-page';

export const metadata: Metadata = indexableMetadata({
  path: '/rankings/',
  title: 'Property price rankings by market | signedprice',
  description: 'Compare one sale contract per Seoul or Singapore property, Dubai project median prices, Tokyo reported sales, and matched district rental medians.',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const query = await searchParams;
 return RankingsPage({ searchParams: Promise.resolve(query), locale: 'en' });
}
