import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {extractAmktcTariffs} from '../lib/data-operations/amktc-tariffs';
import {importAmktcDrafts} from '../lib/data-operations/tariff-import.server';
const rows=[[1,61.10,23.10],[2,64.90,34.10],[3,75.10,53.20],[4,81.20,70.60]];
const page=`Tier 2 S&amp;CC Increment - 1st July 2024<table><tr><th>Types of Property</th><th>Normal Rate*</th><th>Reduced Rates</th></tr>${rows.map(([r,a,b])=>`<tr><td>${r}.${r}-room flat</td><td>$${a!.toFixed(2)}</td><td>$${b!.toFixed(2)}</td></tr>`).join('')}<tr><td>5. 4-room Design and Build or Design Plus Flat</td><td>$86.30</td><td>$75.10</td></tr></table>Tier 1 S&amp;CC Increment<table><tr><td>4.4-room flat</td><td>$77.50</td><td>$67.50</td></tr></table>`;
describe('verified AMK tariff import',()=>{
 it('extracts only current standard room rates, excluding older tiers and special designs',()=>{
  const rows=extractAmktcTariffs(page);expect(rows).toHaveLength(8);expect(rows.filter((r)=>r.rooms===4)).toMatchObject([{rateType:'normal',amount:81.2},{rateType:'reduced',amount:70.6}]);
 });
 it('requires review when the effective date, section structure or amount format changes',()=>{
  expect(()=>extractAmktcTariffs('Tier 3 S&amp;CC Increment'+page)).toThrow('amktc_newer_tier_unreviewed');
  expect(()=>extractAmktcTariffs(page.replace('1st July 2024','1st July 2027'))).toThrow('amktc_section_changed');
  expect(()=>extractAmktcTariffs(page.replace('$81.20','81.20 to 90'))).toThrow('amktc_amount_changed');
  expect(()=>extractAmktcTariffs(page.replace('4.4-room flat','4.4-room other'))).toThrow('amktc_rows_missing');
 });
 it('cannot import an unreviewed or unrelated snapshot',async()=>{
  const query=vi.fn().mockResolvedValue([]);await expect(importAmktcDrafts({query},'00000000-0000-0000-0000-000000000001','test')).rejects.toThrow('reviewed_amktc_snapshot_required');expect(query).toHaveBeenCalledTimes(1);
 });
 it('creates pending authority-level evidence without inventing building, area or tax eligibility',async()=>{
  const query=vi.fn().mockResolvedValueOnce([{content:page,source_url:'https://www.amktc.org.sg/service-and-conservancy-charges-scc/index.html',fetched_at:'2026-09-09T00:00:00Z'}]).mockResolvedValueOnce([{id:'00000000-0000-0000-0000-000000000002',status:'pending'}]).mockResolvedValueOnce([{inserted:8}]);
  const result=await importAmktcDrafts({query},'00000000-0000-0000-0000-000000000001','test');expect(result).toMatchObject({inserted:8,status:'pending'});
  const payload=JSON.parse(query.mock.calls[2]![1][0]);expect(payload[0].data).toMatchObject({building:'',sizeSqm:null,basis:'published',billingPeriod:'monthly',currency:'SGD'});
  expect(payload[0].data.conditions).toContain('require address verification');expect(payload[0].data.conditions).toContain('Tax inclusion unconfirmed');expect(query.mock.calls[2]![0]).toContain('ON CONFLICT(fingerprint) DO NOTHING');
 });
});
