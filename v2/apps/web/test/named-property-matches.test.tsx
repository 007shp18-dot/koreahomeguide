import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { NamedPropertyMatches } from '../components/market-ui/named-property-matches';

it('finds named Tokyo properties without assigning anonymous transactions to them', () => {
  const html = renderToStaticMarkup(<NamedPropertyMatches market="jp-tokyo" query="브란즈 타워 시바우라" locale="ko" />);
  expect(html).toContain('/ko/jp/tokyo/explore/properties/jp-branz-tower-shibaura');
  expect(html).toContain('시바하마초');
  expect(html).not.toContain('실거래가 중앙값');
  expect(html).not.toContain('ae-park-ridge');
});

it('finds Dubai groups by name even without an exact DLD project match', () => {
  const html = renderToStaticMarkup(<NamedPropertyMatches market="ae-dubai" query="PARK-RIDGE" locale="en" />);
  expect(html).toContain('/ae/dubai/explore/projects/ae-park-ridge');
  expect(html).toContain('Dubai Hills Estate');
  expect(html).toContain('park-oriented');
  expect(html).not.toContain('AED');
});

it('keeps Chinese links and summaries localised', () => {
  const html = renderToStaticMarkup(<NamedPropertyMatches market="ae-dubai" query="Creekside 18" locale="zh-CN" />);
  expect(html).toContain('/zh-cn/ae/dubai/explore/projects/ae-creekside-18');
  expect(html).toMatch(/[\u4e00-\u9fff]/);
  expect(html).not.toMatch(/[가-힣]/);
});

it('does not add a second catalogue for empty or unmatched searches', () => {
  for (const query of ['', ' ', '...', 'unknown development']) {
    expect(renderToStaticMarkup(<NamedPropertyMatches market="jp-tokyo" query={query} locale="en" />)).toBe('');
  }
});
