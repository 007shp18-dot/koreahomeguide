import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {SavedCities} from '@/components/global-shortlist/saved-cities';
export const metadata = {title:'收藏地点 | SignedPrice', robots:{index:false,follow:true}};
export default function Page() {return <ToolsShell locale="zh-CN" href="/zh-cn/saved/"><ResearchPageHeading title="收藏地点" description="查看首尔、新加坡、迪拜及东京的收藏地点和最新交易资料。"/><SavedCities locale="zh-CN" initiallyOpen /></ToolsShell>;}
