import 'server-only';
import {parseEntityCheckContext} from '../navigation/explorer-selection';
import {buildPublicBuildingModel} from '../public-market/building-route-model.server';
export function resolveSeoulEntityCheckContext(query:Readonly<Record<string,string|string[]|undefined>>,input:Readonly<{locale:'en'|'ko'|'zh-CN';districtSlug:string;buildingId:string|null;buildingName:string|null}>) {
 const id=input.buildingId;
 if(id===null || (input.buildingName===null && buildPublicBuildingModel(input.districtSlug,id)===null)) return null;
 return parseEntityCheckContext(query,{market:'kr-seoul',entityIds:[id],locale:input.locale});
}
