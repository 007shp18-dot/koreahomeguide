import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {LivingContextExplorer} from '@/components/market-ui/living-context';
import {loadLivingContexts} from '@/lib/research/living-context.server';
export const dynamic = 'force-dynamic';
export const metadata = {title: '小区生活环境', robots: {index: false, follow: true}};
export default async function Page({searchParams}:{searchParams:Promise<{market?:string}>}) {
 const [result, query] = await Promise.all([loadLivingContexts(),searchParams]);
 return <ToolsShell locale="zh-CN" href="/zh-cn/living/"><ResearchPageHeading title="小区生活环境" description="首尔、新加坡、迪拜、东京 12 个住宅项目的商业、交通和生活环境"/><LivingContextExplorer {...result} locale="zh-CN" initialMarket={query.market}/></ToolsShell>;
}
