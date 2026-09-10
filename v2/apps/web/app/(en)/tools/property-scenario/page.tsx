import {loadScenarioCosts} from '@/lib/evidence-pool/costs.server';
import {scenarioRentOptions} from '@/lib/tools/scenario-rent-options.server';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {PropertyScenarioWorkspace} from '@/components/tools/property-scenario-workspace';
import {parsePropertyScenarioContext,type PropertyScenarioSearchParams} from '@/lib/tools/property-scenario-context';
import {buildPropertyScenarioMetadata} from '@/lib/tools/property-scenario-metadata';
type Props=Readonly<{searchParams:Promise<PropertyScenarioSearchParams>}>;
export async function generateMetadata({searchParams}:Props) {return buildPropertyScenarioMetadata('en',Object.keys(await searchParams).length>0);}
export default async function Page({searchParams}:Props) {const context=parsePropertyScenarioContext(await searchParams,'en');const costs=await loadScenarioCosts(context);return <ToolsShell locale="en" href="/tools/property-scenario/"><ResearchPageHeading title="Property scenario" description="Calculate purchase outlay and rental income from your own assumptions."/><PropertyScenarioWorkspace locale="en" context={context} rentOptions={scenarioRentOptions()} costOptions={costs.options} costState={costs.state}/></ToolsShell>;}
