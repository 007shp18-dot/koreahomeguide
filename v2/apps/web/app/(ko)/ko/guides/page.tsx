import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { GuideDirectory, resolveGuideMarket } from '@/components/guides/guide-directory';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/ko/guides/',title:'주택 매수·임대 실무 가이드 | signedprice',description:'매수 자격, 자금 준비, 임대차 계약과 실거래가 비교 방법. 집을 구하면서 필요한 안내를 찾아보세요.',languageAlternates:{en:'/guides/',ko:'/ko/guides/','zh-Hans':'/zh-cn/guides/'},locale:'ko_KR',imagePath:'/og/ko/'});
export default async function Page({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<{ market?: string }> } = {}) {
 const market = resolveGuideMarket((await searchParams).market);
 return <KoreanSiteFrame href={`/ko/guides/${market === 'all' ? '' : `?market=${market}`}`}><GuideDirectory locale="ko" market={market} /></KoreanSiteFrame>;
}
