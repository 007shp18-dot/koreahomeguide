import {propertyReviewMetadata} from '@/lib/research/property-review-metadata';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<{profile?:string}>}) { return propertyReviewMetadata('ko',(await searchParams).profile); }
export default async function Page({searchParams}:{searchParams:Promise<{market?:string;profile?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="ko" href="/ko/living/"><ResearchPageHeading title="단지 리뷰" description="서울·싱가포르·두바이·도쿄 12곳의 입지·학교·교통·보유 조건"/><LivingContextExplorer key={`${query.market ?? ""}:${query.profile ?? ""}`} {...result} locale="ko" initialMarket={query.market} initialProfile={query.profile}/></ToolsShell>;
}
