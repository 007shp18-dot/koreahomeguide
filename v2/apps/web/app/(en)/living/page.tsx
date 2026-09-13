import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export const metadata = {title: 'Property living context', robots: {index: false, follow: true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="en" href="/living/"><ResearchPageHeading title="Property living context" description="Commerce, transport and everyday surroundings · 12 property profiles"/><LivingContextExplorer {...result} locale="en" initialMarket={query.market}/></ToolsShell>;
}
