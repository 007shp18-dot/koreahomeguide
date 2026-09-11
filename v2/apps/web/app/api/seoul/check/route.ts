import {contractCheckEvidenceRepositoriesFromEnvironment} from '@/lib/contract-check/evidence-repositories.server';
import {contractCheckCurvesFromEnvironment} from '@/lib/contract-check/route-model.server';
import {buildSingleQuoteCheckRouteModel} from '@/lib/single-quote-check/route-model.server';
import {resolveSeoulEntityCheckContext} from '@/lib/contract-check/entity-context.server';
export async function GET(request:Request) {
 const url=new URL(request.url);if(url.search.length>4096)return Response.json({error:'query_too_long'},{status:400});
 const query=Object.fromEntries(url.searchParams),locale=query.locale==='zh-CN'?'zh-CN':query.locale==='ko'?'ko':'en';
 const model=buildSingleQuoteCheckRouteModel(contractCheckEvidenceRepositoriesFromEnvironment(),query,contractCheckCurvesFromEnvironment());
 const entityContext=resolveSeoulEntityCheckContext(query,{locale,districtSlug:model.selection.districtSlug,buildingId:model.selection.buildingId,buildingName:model.buildingName});
 return Response.json({model,entityContext},{headers:{'Cache-Control':'private, no-store'}});
}
