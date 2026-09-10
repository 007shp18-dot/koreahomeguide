import 'server-only';
import { dubaiEvidenceRepositoryFromEnvironment } from '../dubai/evidence-repository.server';
export type ScenarioRentOption = {id:string;entity:string;housing:string;name:string;annualRent:number;count:number;period:string};
export function scenarioRentOptions(): ScenarioRentOption[] {
 const repository=dubaiEvidenceRepositoryFromEnvironment();if(!repository) return [];
 const period=repository.getContext().sourcePeriods.rents;
 return repository.listAreas().flatMap(area=>area.segments.map(segment=>({id:`${area.slug}-${segment.housing}`,entity:area.slug,housing:segment.housing,name:area.name,annualRent:segment.rent.medianAnnualRentAed,count:segment.rent.newN,period:`${period.from}–${period.to}`})));
}
