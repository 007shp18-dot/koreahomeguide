import { describe, expect, it } from 'vitest';
import { scenarioCostOptions } from '../lib/evidence-pool/costs';
import type { Evidence } from '../lib/evidence-pool/contract';
import type { PropertyScenarioContext } from '../lib/tools/property-scenario-context';
const context: PropertyScenarioContext = {market:'sg-singapore',currency:'SGD',propertyName:'Test Tower',housing:'apartment',areaSqm:80,entity:'test-tower',transaction:'sale',price:null,returnTo:null};
const row: Evidence = {id:'e1',sourceId:'s1',status:'approved',sourceStatus:'approved',sourceKind:'official',sourceName:'Management',version:1,createdAt:'2026-09-09',market:'singapore',currency:'SGD',tier:'essential',metric:'service_charge',basis:'invoiced',amount:300,unit:'monthly',area:'District 1',building:'Test Tower',sizeSqm:80,housingType:'apartment',conditions:'Residential unit; excludes special levies',observedOn:'2026-09-01',expiresOn:'2026-12-31',url:'https://example.com/fees'};
const options = (change: Partial<Evidence> = {}, ctx = context) => scenarioCostOptions([{...row,...change}],ctx,'2026-09-09');
describe('approved operating-cost suggestions', () => {
 it('annualises monthly whole-home and per-square-metre recurring costs with provenance', () => {
  expect(options()[0]).toMatchObject({annualAmount:3600,basis:'invoiced',observedOn:'2026-09-01',conditions:row.conditions,url:row.url});
  expect(options({amount:5,unit:'sqm',billingPeriod:'monthly',sizeSqm:null})[0]?.annualAmount).toBe(4800);
  expect(options({amount:500,unit:'annual'})[0]?.annualAmount).toBe(500);
 });
 it.each<Partial<Evidence>>([
  {status:'pending'}, {sourceStatus:'withdrawn'}, {expiresOn:'2026-09-08'}, {observedOn:'2026-09-10'},
  {observedOn:'2024-09-01'}, {duplicate:true}, {conditions:''}, {basis:'reported'}, {basis:'asking'}, {sourceKind:'community'},
  {currency:'AED'}, {market:'dubai'}, {building:'Other Tower'}, {housingType:'villa'}, {housingType:undefined},
  {sizeSqm:81}, {sizeSqm:null}, {amount:Infinity}, {amount:0}, {url:'javascript:alert(1)'},
  {unit:'monthly',billingPeriod:'annual'}, {metric:'transaction_cost'},
  {metric:'repair_cost',unit:'total',billingPeriod:'once'}, {unit:'sqm',billingPeriod:undefined},
 ])('excludes unfit or inapplicable evidence %j', change => expect(options(change)).toEqual([]));
 it('requires an explicit building, housing type and size; never fills missing cost with zero', () => {
  for (const change of [{propertyName:null},{housing:null},{areaSqm:null}]) expect(options({}, {...context,...change})).toEqual([]);
  expect(scenarioCostOptions([],context,'2026-09-09')).toEqual([]);
 });
 it('keeps quotes labelled and separate; never sums overlapping cost records', () => {
  const result = scenarioCostOptions([row,{...row,id:'e2',basis:'quoted',amount:400}],context,'2026-09-09');
  expect(result.map(r=>[r.basis,r.annualAmount])).toEqual([['invoiced',3600],['quoted',4800]]);
 });
});
