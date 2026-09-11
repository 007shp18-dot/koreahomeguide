import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const coverage = vi.hoisted(() => vi.fn());
const evidence = vi.hoisted(() => vi.fn());
vi.mock('../lib/japan/publication-cache.server', () => ({ readCachedJapanCoverage:coverage }));
vi.mock('../lib/japan/price-check.server', () => ({ readCachedTokyoPriceEvidence:evidence }));
import { TokyoPriceCheck } from '../components/japan/tokyo-price-check';

beforeEach(() => {
 coverage.mockReset().mockResolvedValue([{city:'13103',year:'2026',quarter:'1'}]);
 evidence.mockReset().mockResolvedValue({count:12,median:1000000,lower:800000,upper:1200000,retrievedAt:'2026-08-01'});
});
it.each(['en','ko','zh-CN'] as const)('renders the same dedicated comparison and next-step inputs in %s', async locale => {
 const html = renderToStaticMarkup(await TokyoPriceCheck({locale,searchParams:Promise.resolve({city:'13103',area:'60',price:'90000000',neighbourhood:'Azabu'})}));
 expect(html).toContain('+50.0%'); expect(html).toContain('¥1,500,000'); expect(html).toContain('2026 Q1');
 expect(html).toContain('name="price"'); expect(html).not.toContain('name="budget"');
 expect(html).toContain('price=90000000&amp;area=60');
 expect(html).toContain('neighbourhood=Azabu'); expect(html).toContain('minArea=48&amp;maxArea=72');
 expect(evidence).toHaveBeenCalledWith({city:'13103',year:'2026',quarter:'1',minArea:48,maxArea:72,neighbourhood:'Azabu'});
 const prefix=locale==='en'?'':locale==='ko'?'/ko':'/zh-cn';
 expect(html).toContain(`action="${prefix}/jp/tokyo/tools/"`);
 expect(html).toContain(`href="${prefix}/tools/property-scenario?`);
});
it('keeps blank input blank and performs no evidence query before submit', async () => {
 const html=renderToStaticMarkup(await TokyoPriceCheck({searchParams:Promise.resolve({})}));
 expect(coverage).not.toHaveBeenCalled(); expect(evidence).not.toHaveBeenCalled();
 expect(html).not.toContain('+50.0%'); expect(html).not.toContain('Saved across cities');
});
it('does not turn an outage or a thin sample into a price verdict', async () => {
 for(const mode of ['outage','thin']) {
  if(mode==='outage') evidence.mockRejectedValue(new Error('private database detail'));
  else evidence.mockResolvedValue({count:3,median:1000000,lower:800000,upper:1200000,retrievedAt:null});
  const html=renderToStaticMarkup(await TokyoPriceCheck({searchParams:Promise.resolve({area:'60',price:'90000000'})}));
  expect(html).not.toContain('+50.0%'); expect(html).not.toContain('private database detail');
  expect(html).toContain(mode==='outage'?'temporarily unavailable':'Not enough published evidence');
 }
});
