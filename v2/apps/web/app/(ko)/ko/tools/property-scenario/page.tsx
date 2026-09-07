import {scenarioRentOptions} from '@/lib/tools/scenario-rent-options.server';
import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {PropertyScenarioWorkspace} from '@/components/tools/property-scenario-workspace';
import {parsePropertyScenarioContext,type PropertyScenarioSearchParams} from '@/lib/tools/property-scenario-context';
import {buildPropertyScenarioMetadata} from '@/lib/tools/property-scenario-metadata';
type Props=Readonly<{searchParams:Promise<PropertyScenarioSearchParams>}>;
export async function generateMetadata({searchParams}:Props) {return buildPropertyScenarioMetadata('ko',Object.keys(await searchParams).length>0);}
export default async function Page({searchParams}:Props) {const context=parsePropertyScenarioContext(await searchParams,'ko');return <ToolsShell locale="ko" href="/ko/tools/property-scenario/"><ResearchPageHeading title="매입 비용 계산" description="매입·운영 비용과 임대 수익을 직접 입력한 조건으로 비교하세요."/><PropertyScenarioWorkspace locale="ko" context={context} rentOptions={scenarioRentOptions()}/></ToolsShell>;}
