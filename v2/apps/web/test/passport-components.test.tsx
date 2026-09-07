import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PassportEntry } from '../components/passport/passport-entry';
import { PassportWorkspace } from '../components/passport/passport-workspace';
import { buildPassportModel, type PassportMarketEvidence } from '../lib/passport/model';
import { parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';

const evidence: readonly PassportMarketEvidence[] = [
  { id: 'kr-seoul', city: 'Seoul', currency: 'KRW', localBudget: 0, medianPsm: 10_000_000, sample: 120, period: '2026-01/2026-08', scopes: [] },
  { id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0, medianPsm: 20_000, sample: 80, period: '2026-01..2026-08', scopes: [] },
  { id: 'ae-dubai', city: 'Dubai', currency: 'AED', localBudget: 0, medianPsm: 18_000, sample: 60, period: '2026-01-01..2026-08-31', scopes: [] },
];

describe('Passport UI', () => {
  it('puts one budget action before the home market browser', () => {
    const html = renderToStaticMarkup(<PassportEntry locale="en" />);
    expect(html).toContain('Where can your budget become a home?');
    expect(html).toContain('action="/passport/"');
    expect(html).toContain('name="budget"');
  });

  it('renders the three results in fixed, equivalent card slots', () => {
    const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence });
    const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
    expect((html.match(/data-passport-market=/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-passport-row="local-budget"/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-passport-row="area"/g) ?? [])).toHaveLength(3);
    expect(html).toContain('Purchase price only');
  });
});

it.each(['en','ko','zh-CN'] as const)('links each candidate to its own median-price calculator and retains the entered budget: %s', locale => {
  const model = buildPassportModel({budgetWon:10_000_000_000,locale,evidence:evidence.map((market) => ({...market,scopes:[{name:'Candidate',href:market.id==='kr-seoul'?'/kr/seoul/explore/mapo-gu/tower/?transaction=sale&propertyType=apartment':market.id==='sg-singapore'?'/sg/singapore/explore/ocr/project/':'/ae/dubai/explore/area/',medianPrice:400_000,sample:12,kind:market.id==='kr-seoul'?'building':market.id==='sg-singapore'?'project':'ready-area'}]}))});
  const html=renderToStaticMarkup(<PassportWorkspace initialModel={model}/>);
  const links=[...html.matchAll(/href="([^"]*\/tools\/property-scenario\/?[^"]+)"/g)].map(match=>match[1]!.replaceAll('&amp;','&'));
  expect(links).toHaveLength(3);
  for(const [index,href] of links.entries()) {
    const context=parsePropertyScenarioContext(Object.fromEntries(new URL(href,'https://signedprice.test').searchParams),locale==='ko'?'ko':'en');
    expect(context.market).toBe(['kr-seoul','sg-singapore','ae-dubai'][index]);
    expect(context.currency).toBe(['KRW','SGD','AED'][index]);
    expect(context.price).toBe(400_000);
    expect(context.propertyName).toBe('Candidate');
    expect(context.passportHref).toBe(locale==='ko'?'/ko/passport/?budget=10000000000':locale==='zh-CN'?'/zh-cn/passport/?budget=10000000000':'/passport/?budget=10000000000');
    expect(context.returnTo).toBe(model.markets[index]!.scopes[0]!.href.replace('/kr/seoul/',locale==='ko'?'/ko/kr/seoul/':'/kr/seoul/'));
  }
});

it('distinguishes missing comparison data from a budget with no matches', () => {
  const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence: [
    { ...evidence[0]!, medianPsm: null, sample: 0, scopes: [] },
    { ...evidence[1]!, scopes: [{ name: 'Above budget', href: '/sg/singapore/explore/', medianPrice: 99_000_000 }] },
  ] });
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
  expect(html).toContain('Comparable price data is not available yet.');
  expect(html).toContain('No published median within this budget.');
});

it('limits the initial candidate page to three and offers navigation for the remaining results', () => {
  const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence: [{
    ...evidence[0]!, scopes: Array.from({length:4}, (_,index) => ({name:`Building ${index + 1}`,kind:'building',sample:7,medianPrice:400_000_000-index*10_000_000,href:`/kr/seoul/explore/mapo-gu/building-${index + 1}/`})),
  }] });
  const html=renderToStaticMarkup(<PassportWorkspace initialModel={model}/>);
  expect((html.match(/data-passport-candidate="building"/g) ?? [])).toHaveLength(3);
  expect(html).toContain('Building 1');
  expect(html).not.toContain('Building 4');
  expect(html).toContain('1 / 2');
  expect(html).toMatch(/<button[^>]+disabled[^>]*>Previous/);
  expect(html).toMatch(/<button type="button">Next/);
});
