import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PropertyLivingContext } from '../components/market-ui/living-context';

it('offers analysis inside a selected property, initially closed', () => {
  const html = renderToStaticMarkup(<PropertyLivingContext profileId="kr-banpo-riche" locale="ko" />);
  expect(html).toContain('<details');
  expect(html).toContain('id="property-review"');
  expect(html).toContain('단지 분석 읽기');
  expect(html).not.toContain(' open');
  expect(html).not.toContain('Loading');
  expect(renderToStaticMarkup(<PropertyLivingContext profileId="unknown" locale="en" />)).toBe('');
});

it('does not prepend a second property directory to any city explorer', () => {
  for (const path of ['public-market/area-explorer', 'singapore/singapore-explorer', 'dubai/dubai-explorer', 'japan/tokyo-explorer']) {
    const source = readFileSync(new URL(`../components/${path}.tsx`, import.meta.url), 'utf8');
    expect(source).not.toContain('PropertyReviewDirectory');
  }
});
