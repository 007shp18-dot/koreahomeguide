import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { tokyoBudget } from '../lib/global-shortlist/tokyo-budget.server';
import { defaults, validBudgetFilters } from '../lib/global-shortlist/model';
import { parseGlobalSaved } from '../lib/global-shortlist/storage';
import { passportReturn, parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';
import type { MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';
it('screens anonymous neighbourhood medians and keeps saved areas outside budget', async () => {
  const query = vi.fn().mockResolvedValue([{ city:'13113', year:2025, quarter:4, district:'Ebisu', updated:'2026-09-10',median:90000000,count:12,district_key:'a'.repeat(32) }]);
  const port = {query,transaction:vi.fn()} as MarketRefreshSqlPort;
  const result = await tokyoBudget({...defaults('tokyo'),budget:1},['13113/'+ 'a'.repeat(32)],1,port);
  expect(result?.total).toBe(0);
  expect(result?.saved).toHaveLength(1);
  const item=result!.saved[0]!;
  expect(item.description).toContain('2025 Q4');
  expect(item.checkHref).toContain('currency=JPY');
  expect(item.checkHref).not.toContain('property=');
  expect(item.evidenceHref).toContain('neighbourhood=Ebisu');
  expect(query.mock.calls[0]![0]).toContain("r.state='published'");
  expect(query.mock.calls[0]![1][1]).toBe('Pre-owned Condominiums, etc.');
});
it('upgrades old saved state without losing places and admits only housing filters', () => {
 const old={version:1,filters:{singapore:defaults('singapore'),dubai:defaults('dubai')},places:[]};
 const state=parseGlobalSaved(JSON.stringify(old));
 expect(state.filters.tokyo.budget).toBe(100000000);
 expect(validBudgetFilters({...defaults('tokyo'),housing:'villa'},'tokyo')).toBe(false);
 state.places.push({market:'tokyo',key:'13113/'+ 'a'.repeat(32),name:'Ebisu',signature:'b'.repeat(64),checkedAt:'2026-09-10'});
 expect(parseGlobalSaved(JSON.stringify(state)).places).toEqual(state.places);
});
it('preserves Japan context and rejects foreign return links', () => {
 const context=parsePropertyScenarioContext({market:'jp-tokyo',currency:'JPY',price:'90000000',returnTo:'/jp/tokyo/explore/?city=13113'});
 expect(context.market).toBe('jp-tokyo');
 expect(context.price).toBe(90000000);
 expect(context.returnTo).toContain('/jp/tokyo/');
 expect(parsePropertyScenarioContext({market:'jp-tokyo',currency:'JPY',returnTo:'/ae/dubai/'}).returnTo).toBeNull();
});

it('preserves JPY Passport return context',()=>{ expect(passportReturn('/passport/?budget=100000000&currency=JPY')).toBe('/passport/?budget=100000000&currency=JPY'); });
