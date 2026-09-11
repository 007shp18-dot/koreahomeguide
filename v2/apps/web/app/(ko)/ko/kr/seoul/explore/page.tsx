import SeoulExplorePage from '@/components/public-market/seoul-explore-page.server';
import { buildSeoulExploreMetadata } from '@/lib/public-market/seoul-explore-metadata';

type Props = Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
export async function generateMetadata({ searchParams }: Props) {
  return buildSeoulExploreMetadata('ko', await searchParams);
}
export default function Page({ searchParams = Promise.resolve({}) }: Partial<Props> = {}) {
  return SeoulExplorePage({ searchParams, locale: 'ko' });
}
