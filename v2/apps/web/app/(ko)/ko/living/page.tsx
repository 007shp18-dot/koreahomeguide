import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export const metadata = {title: '단지별 상권·생활권', robots: {index: false, follow: true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="ko" href="/ko/living/"><ResearchPageHeading title="단지별 상권·생활권" description="서울·싱가포르·두바이·도쿄 12개 단지의 상권·교통·생활환경"/><LivingContextExplorer {...result} locale="ko" initialMarket={query.market}/></ToolsShell>;
}
