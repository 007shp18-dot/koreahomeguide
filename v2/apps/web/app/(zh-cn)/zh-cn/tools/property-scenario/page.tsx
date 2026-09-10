import {loadScenarioCosts} from '@/lib/evidence-pool/costs.server';
import {scenarioRentOptions} from '@/lib/tools/scenario-rent-options.server';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {PropertyScenarioWorkspace} from '@/components/tools/property-scenario-workspace';
import {parsePropertyScenarioContext,type PropertyScenarioSearchParams} from '@/lib/tools/property-scenario-context';
import {buildPropertyScenarioMetadata} from '@/lib/tools/property-scenario-metadata';
type Props=Readonly<{searchParams:Promise<PropertyScenarioSearchParams>}>;
export async function generateMetadata({searchParams}:Props) {return buildPropertyScenarioMetadata('zh-CN',Object.keys(await searchParams).length>0);}
export default async function Page({searchParams}:Props) {const context=parsePropertyScenarioContext(await searchParams,'zh-CN');const costs=await loadScenarioCosts(context);return <ToolsShell locale="zh-CN" href="/zh-cn/tools/property-scenario/"><ResearchPageHeading title="购置成本与租金收益" description="使用自己的价格、费用、租金及空置假设计算。支持日元。"/><PropertyScenarioWorkspace locale="zh-CN" context={context} rentOptions={scenarioRentOptions()} costOptions={costs.options} costState={costs.state}/></ToolsShell>;}
