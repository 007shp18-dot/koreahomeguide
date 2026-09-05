import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const exploreCss = readFileSync(new URL('../components/public-market/area-explorer.module.css', import.meta.url), 'utf8');
const newsCss = readFileSync(new URL('../components/global-product-hub.module.css', import.meta.url), 'utf8');

describe('mobile content visibility', () => {
  it('restores the untruncated building list before the map on mobile', () => {
    expect(exploreCss).toMatch(/\.discoveryRail \{ order: 2;/);
    expect(exploreCss).toMatch(/\.mapPanel \{ order: 3;/);
    expect(exploreCss).toMatch(/\.buildingBrowser \{ height: auto; max-height: none;/);
    expect(exploreCss).toMatch(/\.buildingList \.buildingCardCopy > small:nth-of-type\(n \+ 4\) \{ display: block;/);
    expect(exploreCss).toMatch(/\.resultSummary \{ display: block;/);
  });

  it('keeps live-news source status visible on a narrow screen', () => {
    expect(newsCss).toMatch(/\.newsFilters > span \{ grid-column: 1 \/ -1; display: block;/);
  });
});
