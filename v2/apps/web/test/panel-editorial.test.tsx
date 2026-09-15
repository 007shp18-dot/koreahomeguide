import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { staticSeoulReview } from '../lib/research/static-property-review.server';
import { PropertyDecisionWorkspace } from '../components/market-ui/property-decision-workspace';
import { panelCopy } from '../lib/brief/panel-copy';
it('ships the compact Banpo analysis in initial HTML and removes the old water-play claim', () => {
  const review = staticSeoulReview('kr-seoul:estate:seocho-gu-q5se5y')!;
  expect(review.editorial!.paragraphs.en.join(' ').split(/\s+/).length).toBeLessThan(200);
  expect(review.sources.some(s => s.id === 'waterplay')).toBe(false);
  const html = renderToStaticMarkup(<PropertyDecisionWorkspace initialReview={review} entity="kr-seoul:estate:seocho-gu-q5se5y" locale="ko"><main>거래 자료</main></PropertyDecisionWorkspace>);
  expect(html).toContain('data-property-decision="kr-banpo-xi"');
  expect(html).not.toContain('Read the full property guide');
  expect(html).not.toContain('단지 분석을 불러오고');
  expect(html).not.toContain('판단이 바뀌는 조건');
  expect(html).not.toContain('먼저 볼 5가지');
});
it('omits numerical interpretation without a matching publishable property cohort', () => {
  expect(panelCopy(undefined, 'ko', String)).toEqual([]);
});

import { manualBuildingSchema, repeatedResidentItems } from '../lib/brief/manual';
it('does not turn a single review or an unverified number into resident consensus', () => {
  const manual = manualBuildingSchema.parse({ residents: { reviewCount: 10, readAt: '2026-09', sourceLabel: { ko: '공개 입주민 후기', en: 'Public resident reviews' }, items: [
    { topic: 'noise', text: { ko: '반복된 관찰', en: 'A recurring observation' }, mentions: 2 },
    { topic: 'parking', text: { ko: '주차 100대', en: '100 parking spaces' }, mentions: 3 },
    { topic: 'facilities', text: { ko: '한 사람의 경험', en: 'One experience' }, mentions: 1 },
  ] } });
  expect(repeatedResidentItems(manual).map(item => item.topic)).toEqual(['noise']);
  expect(manualBuildingSchema.safeParse({ commute: [{ to: { ko: '목적지', en: 'Destination' }, route: { ko: '경로', en: 'Route' }, minutes: 20, transfers: 1 }] }).success).toBe(false);
  expect(manualBuildingSchema.parse({})).toEqual({ commute: [], schools: [] });
});
