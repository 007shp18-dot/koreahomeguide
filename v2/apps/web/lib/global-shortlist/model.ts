export type OverseasMarket = 'singapore' | 'dubai';
export type BudgetFilters = { budget: number; minArea: number; maxArea: number; region: string; housing: string; completion: string };
export const defaults = (market: OverseasMarket): BudgetFilters => ({ budget: market === 'singapore' ? 1_500_000 : 1_000_000, minArea: 80, maxArea: 100, region: 'all', housing: market === 'singapore' ? 'condominium' : 'apartment', completion: 'ready' });
export function validBudgetFilters(f: BudgetFilters, market: OverseasMarket): boolean {
  return !!f && Number.isFinite(f.budget) && f.budget > 0 && f.budget <= 500_000_000
    && Number.isFinite(f.minArea) && Number.isFinite(f.maxArea) && f.minArea >= 1 && f.maxArea >= f.minArea && f.maxArea <= 2000
    && typeof f.region === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(f.region)
    && (market === 'singapore' ? ['condominium', 'apartment', 'executive_condominium'].includes(f.housing) : ['apartment', 'villa'].includes(f.housing))
    && ['ready', 'off-plan'].includes(f.completion);
}
export type BudgetItem = { key: string; name: string; region: string; price: number; description: string; count: number; evidenceHref: string; checkHref: string; signature: string };
export type BudgetResult = { period: string; updated: string; source: string; regions: { value: string; label: string }[]; items: BudgetItem[]; saved: BudgetItem[]; missing: string[]; total: number; page: number; pageSize: number };
export const cityPaths = { seoul: '/kr/seoul/shortlist/', singapore: '/sg/singapore/shortlist/', dubai: '/ae/dubai/shortlist/' } as const;
