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
    const context=parsePropertyScenarioContext(Object.fromEntries(new URL(href,'https://signedprice.test').searchParams),locale);
    expect(context.market).toBe(['kr-seoul','sg-singapore','ae-dubai'][index]);
    expect(context.currency).toBe(['KRW','SGD','AED'][index]);
    expect(context.price).toBe(400_000);
    expect(context.propertyName).toBe('Candidate');
    expect(context.passportHref).toBe(locale==='ko'?'/ko/passport/?budget=10000000000':locale==='zh-CN'?'/zh-cn/passport/?budget=10000000000':'/passport/?budget=10000000000');
    const returned = new URL(context.returnTo!, 'https://signedprice.test');
    expect(returned.searchParams.get('passport')).toBe(context.passportHref);
    returned.searchParams.delete('passport');
    expect(`${returned.pathname}${returned.search}`).toBe(`${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}${model.markets[index]!.scopes[0]!.href}`);
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


it.each(['en', 'ko', 'zh-CN'] as const)('requires a bounded purchase-price budget and offers an explicit reset: %s', locale => {
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={buildPassportModel({budgetWon: 500_000_000, locale, evidence})} />);
  const input = html.match(/<input[^>]*id="passport-result-budget"[^>]*>/)?.[0];
  expect(input).toContain('required=""');
  expect(input).toContain('min="10000000"');
  expect(input).toContain('max="100000000000"');
  expect(input).toContain('step="0.01"');
  expect(input).toContain('aria-describedby="passport-result-budget-help passport-result-budget-error"');
  expect(html).toContain('type="reset"');
  expect(html).toContain(locale === 'ko' ? '보유 현금이나 대출 한도가 아닌 매매가격 기준 예산' : locale === 'zh-CN' ? '用于比较购房价格，不代表可用现金或贷款额度' : 'A purchase-price budget, not your cash savings or borrowing limit');
});

it('keeps Chinese market exploration and candidate calculation in Chinese', () => {
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={buildPassportModel({budgetWon: 500_000_000, locale: 'zh-CN', evidence})} />);
  expect(html).toContain('href="/zh-cn/kr/seoul/explore');
  expect(html).toContain('href="/zh-cn/sg/singapore/explore');
  expect(html).toContain('迪拜交房状态');
});
