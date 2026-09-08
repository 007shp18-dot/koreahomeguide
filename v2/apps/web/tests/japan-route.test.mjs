import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/japan/transactions/route.ts';
const originalFetch = globalThis.fetch;
const originalKey = process.env.SIGNEDPRICE_REINFOLIB_API_KEY;
afterEach(() => { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.SIGNEDPRICE_REINFOLIB_API_KEY; else process.env.SIGNEDPRICE_REINFOLIB_API_KEY = originalKey; });
const request = (query='city=13103&year=2025&quarter=4') => new Request('https://example.test/api/japan/transactions?'+query);
test('rejects invalid or repeated filters before calling the provider', async () => {
  globalThis.fetch = () => { throw Error('must not call'); };
  for (const query of ['city=99999&year=2025&quarter=4','city=13103&year=2025&quarter=5','city=13103&city=13102&year=2025&quarter=4','city=13103&year=2025&quarter=4&url=https://evil.test']) assert.equal((await GET(request(query))).status,400);
});
test('missing key is a configuration failure, not empty market data', async () => {
  delete process.env.SIGNEDPRICE_REINFOLIB_API_KEY;
  const r=await GET(request()); assert.equal(r.status,503); assert.equal((await r.json()).error,'source_not_configured');
});
test('uses registered key server-side and preserves anonymized transaction evidence', async () => {
  process.env.SIGNEDPRICE_REINFOLIB_API_KEY='test-only-secret';
  globalThis.fetch=async (url,options)=>{
    assert.equal(new URL(url).hostname,'www.reinfolib.mlit.go.jp'); assert.equal(new URL(url).searchParams.get('language'),'en'); assert.equal(new URL(url).searchParams.get('priceClassification'),'01');
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'test-only-secret');
    return Response.json({status:'OK',data:[{Type:'Pre-owned Condominiums, etc.',MunicipalityCode:'13103',Municipality:'Minato Ward',DistrictName:'Azabu',TradePrice:'85000000',Area:'70',FloorPlan:'2LDK',BuildingYear:'2010',Period:'4th quarter 2025',PriceCategory:'Real estate transaction prices'}, {Type:'Residential Land',MunicipalityCode:'13103',TradePrice:'100000000',Area:'2000 or greater'}]});
  };
  const r=await GET(request()); assert.equal(r.status,200); const body=await r.json(); assert.equal(body.records.length,2); assert.equal(body.records[0].price,85000000); assert.equal(body.records[0].areaSqm,70); assert.equal(body.records[1].areaSqm,null); assert.equal(body.records[1].areaLabel,'2000 or greater'); assert.equal(body.identityPrecision,'anonymized_transaction'); assert.equal(body.periodPrecision,'quarter'); assert.equal(JSON.stringify(body).includes('test-only-secret'),false); assert.equal('buildingId' in body.records[0],false);
});
test('provider rejection does not leak the response or masquerade as zero records', async () => {
  process.env.SIGNEDPRICE_REINFOLIB_API_KEY='test-only-secret'; globalThis.fetch=async()=>new Response('test-only-secret',{status:401}); const r=await GET(request());assert.equal(r.status,502); assert.equal((await r.text()).includes('test-only-secret'),false);
});
test('malformed provider payload fails closed', async () => {
  process.env.SIGNEDPRICE_REINFOLIB_API_KEY='test-only-secret'; globalThis.fetch=async()=>Response.json({status:'ERROR',data:[]}); assert.equal((await GET(request())).status,502);
});
test('a successful empty quarter remains a successful empty result', async () => {
  process.env.SIGNEDPRICE_REINFOLIB_API_KEY='test-only-secret'; globalThis.fetch=async()=>Response.json({status:'OK',data:[]}); const r=await GET(request());assert.equal(r.status,200);assert.deepEqual((await r.json()).records,[]);
});

