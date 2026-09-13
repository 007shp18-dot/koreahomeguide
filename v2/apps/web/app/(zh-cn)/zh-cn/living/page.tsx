import {propertyReviewMetadata} from '@/lib/research/property-review-metadata';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<{profile?:string}>}) { return propertyReviewMetadata('zh-CN',(await searchParams).profile); }
export default async function Page({searchParams}:{searchParams:Promise<{market?:string;profile?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="zh-CN" href="/zh-cn/living/"><ResearchPageHeading title="住宅项目评估" description="首尔、新加坡、迪拜及东京12个项目的区位、交通、学校与持有条件"/><LivingContextExplorer key={`${query.market ?? ""}:${query.profile ?? ""}`} {...result} locale="zh-CN" initialMarket={query.market} initialProfile={query.profile}/></ToolsShell>;
}
