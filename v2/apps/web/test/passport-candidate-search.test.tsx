import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PassportCandidates } from '../components/passport/passport-candidates';
import { buildPassportModel } from '../lib/passport/model';

const state = vi.hoisted(() => ({ query: '' }));
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => [typeof initial === 'string' ? state.query : initial, () => {}] };
});
const model = buildPassportModel({budgetWon:500_000_000,locale:'en',evidence:[{
  id:'kr-seoul',city:'Seoul',currency:'KRW',localBudget:0,medianPsm:10_000_000,sample:20,period:'2026-08',scopes:[
    {name:'(554-31)',neighborhoodName:'역삼동',districtSlug:'gangnam-gu',medianPrice:400_000_000,href:'/kr/seoul/explore/gangnam-gu/lot/'},
    {name:'Other',neighborhoodName:'대치동',districtSlug:'gangnam-gu',medianPrice:450_000_000,href:'/kr/seoul/explore/gangnam-gu/other/'},
    {name:'Above budget',neighborhoodName:'역삼동',districtSlug:'gangnam-gu',medianPrice:900_000_000,href:'/kr/seoul/explore/gangnam-gu/expensive/'},
  ],
}]});
function render(query: string) {
  state.query=query;
  return renderToStaticMarkup(<PassportCandidates market={model.markets[0]!} locale="en" passportHref={model.href}/>);
}
describe('Passport candidate filtering',()=>{
  it.each(['역삼동','Yeoksam-dong','yeoksam dong','YEOKSAMDONG'])('keeps the same affordable candidate and count for %s',query=>{
    const html=render(query);
    expect(html).toMatch(/data-passport-match-count="true">1<\/strong>/);
    expect(html).toContain('Lot 554-31');
    expect(html).not.toContain('Above budget');
    expect(html).not.toContain('>Other<');
    expect(html).toContain('price=400000000');
  });
  it('reports zero for no match and restores all affordable candidates when cleared',()=>{
    expect(render('no-such-building')).toMatch(/data-passport-match-count="true">0<\/strong>/);
    expect(render('no-such-building')).toContain('No candidates match this search');
    expect(render('')).toMatch(/data-passport-match-count="true">2<\/strong>/);
  });
});
