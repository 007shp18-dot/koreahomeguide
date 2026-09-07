import { expect, it } from 'vitest';
import { parsePropertyScenarioContext, createPropertyScenarioHref } from '../lib/tools/property-scenario-context';
it('keeps Singapore and Dubai in their native currencies on the neutral route', () => {
  expect(createPropertyScenarioHref({locale:'en', market:'sg-singapore',currency:'SGD',price:1200000})).toContain('/tools/property-scenario/?market=sg-singapore&currency=SGD');
  expect(parsePropertyScenarioContext({market:'ae-dubai',currency:'AED',price:'2000000'}).price).toBe(2000000);
});
it('rejects mismatches, arrays, unsafe return links and invalid amounts', () => {
  for (const price of ['Infinity','1e999','-1','0','9007199254740992']) expect(parsePropertyScenarioContext({price}).price).toBeNull();
  expect(parsePropertyScenarioContext({price:['10','20']}).price).toBeNull();
  expect(parsePropertyScenarioContext({market:'sg-singapore',currency:'KRW',price:'10'}).price).toBeNull();
  for(const returnTo of ['//evil.test/','https://evil.test/','/sg/singapore/explore/','/kr/seoul/../../prices/']) expect(parsePropertyScenarioContext({returnTo}).returnTo).toBeNull();
  expect(parsePropertyScenarioContext({property:'x\u0000y'}).propertyName).toBeNull();
});
it('preserves known context and same-locale source return', () => {
 const href = createPropertyScenarioHref({locale:'ko',market:'kr-seoul',currency:'KRW',propertyName:'서울 건물',entity:'tower-1',price:100000,returnTo:'/ko/kr/seoul/explore/gangnam-gu/tower-1/'});
 const parsed = parsePropertyScenarioContext(Object.fromEntries(new URL(href,'https://signedprice.test').searchParams),'ko');
 expect(parsed.propertyName).toBe('서울 건물'); expect(parsed.returnTo).toBe('/ko/kr/seoul/explore/gangnam-gu/tower-1/');
});

it('retains a valid budget-comparison return without allowing arbitrary links or extra data', () => {
  const href = createPropertyScenarioHref({locale:'ko',market:'sg-singapore',currency:'SGD',price:400000,passportHref:'/ko/passport/?budget=500000&currency=USD'});
  expect(parsePropertyScenarioContext(Object.fromEntries(new URL(href,'https://signedprice.test').searchParams),'ko').passportHref).toBe('/ko/passport/?budget=500000&currency=USD');
  for(const passport of ['https://evil.test/passport/?budget=500000','//evil.test/passport/?budget=500000','/passport/?budget=-1','/passport/?budget=Infinity','/passport/?budget=500000&currency=EUR','/passport/?budget=500000&email=someone','/passport/?budget=1&budget=2','/passport/?budget=500000#private']) {
    expect(parsePropertyScenarioContext({passport}).passportHref).toBeUndefined();
  }
});
