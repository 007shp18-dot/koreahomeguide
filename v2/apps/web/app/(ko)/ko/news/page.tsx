import { Suspense } from 'react';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { NewsroomIndex, resolveNewsroomFilters } from '@/components/newsroom/newsroom-index';
import { StoredExternalHeadlines } from '@/components/news/stored-external-headlines';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';
export const revalidate = 900;
type Props = { searchParams?: Promise<Record<string, string | readonly string[] | undefined>> };
export async function generateMetadata({ searchParams = Promise.resolve({}) }: Props = {}) {
  const filters = resolveNewsroomFilters(await searchParams);
  return indexableMetadata({ path: `/ko${filters.canonicalHref}`, title: '도시 이야기와 부동산 뉴스 & 인사이트 | SignedPrice', description: '서울·싱가포르·두바이·도쿄에서 마음이 가는 동네와 내 집을 찾는 여정. 현지 이슈와 실제 뉴스, 지역·집 비교를 함께 읽어보세요.', locale: 'ko_KR', imagePath: '/og/ko/' });
}
export default async function Page({ searchParams = Promise.resolve({}) }: Props = {}) {
  const filters = resolveNewsroomFilters(await searchParams);
  return <KoreanSiteFrame href={`/ko${filters.canonicalHref}`}><NewsroomIndex locale="ko" articles={listPortfolioRecords('ko')} policies={[]} filters={filters} headlines={<Suspense fallback={<p role="status">뉴스를 불러오는 중…</p>}><StoredExternalHeadlines market={filters.market} preview={filters.type !== 'news'} locale="ko" /></Suspense>} /></KoreanSiteFrame>;
}
