import {propertyReviewMetadata} from '@/lib/research/property-review-metadata';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<{profile?:string}>}) { return propertyReviewMetadata('en',(await searchParams).profile); }
export default async function Page({searchParams}:{searchParams:Promise<{market?:string;profile?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="en" href="/living/"><ResearchPageHeading title="Property reviews" description="Location, schools, transport and ownership trade-offs across 12 properties"/><LivingContextExplorer key={`${query.market ?? ""}:${query.profile ?? ""}`} {...result} locale="en" initialMarket={query.market} initialProfile={query.profile}/></ToolsShell>;
}
