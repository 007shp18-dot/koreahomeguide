import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { staticSeoulReview } from '../lib/research/static-property-review.server';
import { PropertyDecisionWorkspace } from '../components/market-ui/property-decision-workspace';
import { panelCopy } from '../lib/brief/panel-copy';
it('ships the authored Banpo guide in initial HTML and removes the old water-play claim', () => {
  const review = staticSeoulReview('kr-seoul:estate:seocho-gu-q5se5y')!;
  expect(review.editorial!.paragraphs.en.join(' ').split(/\s+/).length).toBeGreaterThanOrEqual(800);
  expect(review.sources.some(s => s.id === 'waterplay')).toBe(false);
  const html = renderToStaticMarkup(<PropertyDecisionWorkspace initialReview={review} entity="kr-seoul:estate:seocho-gu-q5se5y" locale="ko"><main>거래 자료</main></PropertyDecisionWorkspace>);
  expect(html).toContain(review.editorial!.paragraphs.ko[0]);
  expect(html).not.toContain('단지 분석을 불러오고');
  expect(html).not.toContain('판단이 바뀌는 조건');
  expect(html).not.toContain('먼저 볼 5가지');
});
it('omits numerical interpretation without a matching publishable property cohort', () => {
  expect(panelCopy(undefined, 'ko', String)).toEqual([]);
});
