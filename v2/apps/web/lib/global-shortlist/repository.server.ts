import 'server-only';
import { createHash } from 'node:crypto';
import { singaporeSnapshotRepositoryFromEnvironment, type SingaporeSnapshotRepository } from '@/lib/singapore/snapshot-repository.server';
import { dubaiEvidenceRepositoryFromEnvironment, type DubaiEvidenceRepository } from '@/lib/dubai/evidence-repository.server';
import type { BudgetFilters, BudgetItem, BudgetResult, OverseasMarket } from './model';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function finish(items: BudgetItem[], all: BudgetItem[], saved: string[], page: number, context: Omit<BudgetResult, 'items' | 'saved' | 'missing' | 'total' | 'page' | 'pageSize'>): BudgetResult {
  const pageSize = 24;
  const selected = new Set(saved);
  const savedItems = all.filter(i => selected.has(i.key));
  const actualPage = Math.min(page, Math.max(1, Math.ceil(items.length / pageSize)));
  return { ...context, items: items.slice((actualPage - 1) * pageSize, actualPage * pageSize), saved: savedItems, missing: saved.filter(key => !savedItems.some(i => i.key === key)), total: items.length, page: actualPage, pageSize };
}
export function singaporeBudget(repository: SingaporeSnapshotRepository, filters: BudgetFilters, saved: string[], page: number): BudgetResult {
  const context = repository.getContext();
  const all: BudgetItem[] = [], matching: BudgetItem[] = [];
  for (const segment of ['CCR', 'RCR', 'OCR']) for (const project of repository.listProjects(segment)) {
    if (!project.published) continue;
    const records = repository.listProjectRecords(segment, project.id).filter(r => r.units === 1 && r.areaBasis === 'strata' && r.saleType === 'resale' && ['condominium', 'apartment', 'executive_condominium'].includes(r.propertyType));
    if (!records.length) continue;
    records.sort((a, b) => b.contractMonth.localeCompare(a.contractMonth) || a.priceSgd - b.priceSgd);
    const hits = records.filter(r => r.priceSgd <= filters.budget && r.areaSqm >= filters.minArea && r.areaSqm <= filters.maxArea && r.propertyType === filters.housing);
    const make = (r: typeof records[number], count: number): BudgetItem => ({
      key: `${segment.toLowerCase()}/${project.id}`, name: project.project, region: segment, price: r.priceSgd,
      description: `${r.areaSqm} m² strata · ${r.contractMonth} · resale`, count,
      signature: digest(records.map(r => [r.contractMonth, r.priceSgd, r.areaSqm, r.floorRange, r.propertyType]).map(v => JSON.stringify(v)).sort()),
      evidenceHref: `/sg/singapore/explore/${segment.toLowerCase()}/${project.id}/`,
      checkHref: `/sg/singapore/check/?${new URLSearchParams({ mode: 'single', 'a-market': 'ura-private-sale', 'a-segment': segment, 'a-project': project.id, 'a-district': project.district, 'a-property-type': r.propertyType, 'a-sale-type': 'resale', 'a-area-min': String(r.areaSqm), 'a-area-max': String(r.areaSqm) })}`,
    });
    all.push(make(records[0]!, records.length));
    if (hits.length && (filters.region === 'all' || filters.region === segment)) matching.push(make(hits[0]!, hits.length));
  }
  matching.sort((a, b) => a.price - b.price || a.key.localeCompare(b.key));
  return finish(matching, all, saved, page, { period: context.period, updated: context.generatedAt, source: 'URA private residential resale transactions', regions: ['CCR', 'RCR', 'OCR'].map(value => ({ value, label: value })) });
}
export function dubaiBudget(repository: DubaiEvidenceRepository, filters: BudgetFilters, saved: string[], page: number): BudgetResult {
  const context = repository.getContext();
  const all: BudgetItem[] = [], matching: BudgetItem[] = [];
  for (const area of repository.listAreas()) for (const segment of area.segments) for (const completion of ['ready', 'off-plan'] as const) {
    const sale = completion === 'ready' ? segment.sales.ready : segment.sales.offPlan;
    if (!sale || sale.n < context.publicationMinimum) continue;
    const item: BudgetItem = { key: `${area.slug}/${segment.housing}-${completion}`, name: area.name, region: area.slug, price: sale.medianPriceAed,
      description: `${segment.housing} · ${completion} · AED ${sale.medianPricePerSqmAed.toLocaleString('en-US')} / m² median`, count: sale.n,
      signature: digest([context.comparisonPeriod, sale]), evidenceHref: `/ae/dubai/explore/${area.slug}/`,
      checkHref: `/ae/dubai/check/?${new URLSearchParams({ area: area.slug, housing: segment.housing, completion })}` };
    all.push(item);
    if (item.price <= filters.budget && segment.housing === filters.housing && completion === filters.completion && (filters.region === 'all' || filters.region === area.slug)) matching.push(item);
  }
  matching.sort((a, b) => a.price - b.price || a.key.localeCompare(b.key));
  return finish(matching, all, saved, page, { period: `${context.comparisonPeriod.from}–${context.comparisonPeriod.to}`, updated: context.generatedAt, source: context.attribution, regions: repository.listAreas().map(a => ({ value: a.slug, label: a.name })) });
}
export async function overseasBudget(market: OverseasMarket, filters: BudgetFilters, saved: string[], page: number): Promise<BudgetResult | null> {
  if (market === 'singapore') { const repository = await singaporeSnapshotRepositoryFromEnvironment(); return repository ? singaporeBudget(repository, filters, saved, page) : null; }
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  return repository ? dubaiBudget(repository, filters, saved, page) : null;
}
