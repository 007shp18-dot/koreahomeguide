import type { DubaiProjectEvidence } from '../dubai/project-evidence';
import type { RankingOrder } from './contract-ranking-query';

/** Never combine completion stages or housing types to inflate the sample. */
export function rankDubaiProjects(projects: readonly DubaiProjectEvidence[], order: RankingOrder, stage: 'ready' | 'off-plan' = 'off-plan') {
 const sorted = projects.filter(p => p.housing === 'apartment' && p.stage === stage
  && p.n >= 30 && Number.isFinite(p.medianPriceAed) && p.medianPriceAed > 0)
  .sort((a,b) => (a.medianPriceAed-b.medianPriceAed)*(order === 'lowest' ? 1 : -1)
   || a.projectNumber.localeCompare(b.projectNumber) || a.id.localeCompare(b.id));
 const seen = new Set<string>();
 const unique = sorted.filter(p => {
  if (seen.has(p.projectNumber)) return false;
  seen.add(p.projectNumber); return true;
 });
 let rank = 0;
 return unique.slice(0,50).map((project,index) => {
  if (index === 0 || project.medianPriceAed !== unique[index-1]!.medianPriceAed) rank=index+1;
  return {...project,rank};
 });
}
