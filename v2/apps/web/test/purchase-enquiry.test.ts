import {describe,it,expect} from 'vitest';
import {enquiryContext,enquiryMailto} from '../lib/operator/purchase-enquiry';
import {consultationHref} from '../content/city-buying-content';
import {CITY_BUDGET_COMPARISONS} from '../content/city-budget-comparisons';
describe('purchase enquiry handoff',()=>{
 it('does not carry an unknown market budget into Seoul',()=>{
  expect(enquiryContext('invalid','50000000')).toEqual({city:'seoul',budget:''});
  expect(enquiryContext('tokyo','50000000')).toEqual({city:'tokyo',budget:'50000000'});
  for(const budget of ['-1','Infinity','1e9','9999999999999','0']) expect(enquiryContext('tokyo',budget).budget).toBe('');
 });
 it('encodes user content without adding email recipients or query headers',()=>{
  const href=enquiryMailto('문의 &cc=other@example.com','hello\n&bcc=other@example.com # ?');
  const url=new URL(href);
  expect(url.pathname).toBe('contact@signedprice.com');
  expect([...url.searchParams.keys()]).toEqual(['subject','body']);
  expect(url.searchParams.get('body')).toBe('hello\n&bcc=other@example.com # ?');
 });
 it('preserves locale, city and currency-specific budget in the three translated Tokyo article handoffs',()=>{
  expect(CITY_BUDGET_COMPARISONS).toHaveLength(3);
  for(const locale of ['en','ko','zh-CN'] as const) {
   const href=consultationHref('tokyo',locale,50000000);
   expect(href).toContain('city=tokyo&budget=50000000#purchase-enquiry');
   const article=CITY_BUDGET_COMPARISONS.find(a=>a.locale===locale&&a.marketId==='jp-tokyo')!;
   expect(article.bodyMarkdown).toContain(href);
   expect(article.evidenceReleaseIds.length).toBeGreaterThanOrEqual(5);
  }
 });
});
