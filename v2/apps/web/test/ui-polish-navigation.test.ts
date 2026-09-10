import { describe, expect, it } from 'vitest';
import { marketDestination } from '../lib/navigation/site-navigation';

describe('city switching keeps the current task', () => {
  it.each([
    ['sg-singapore', '/kr/seoul/explore/gangnam-gu/example/', 'en', '/sg/singapore/explore/'],
    ['kr-seoul', '/sg/singapore/check/', 'ko', '/ko/kr/seoul/check/'],
    ['ae-dubai', '/kr/seoul/shortlist/', 'en', '/ae/dubai/shortlist/'],
    ['jp-tokyo', '/kr/seoul/explore/', 'en', '/jp/tokyo/explore/'],
    ['jp-tokyo', '/kr/seoul/check/', 'ko', '/ko/tools/property-scenario/?market=jp-tokyo&currency=JPY'],
    ['sg-singapore', '/news/', 'en', '/news/?market=singapore'],
    ['ae-dubai', '/ko/guides/', 'ko', '/ko/guides/?market=dubai'],
    ['kr-seoul', '/', 'en', '/kr/seoul/'],
  ] as const)('%s from %s', (market, path, locale, want) => {
    expect(marketDestination(market, path, locale)).toBe(want);
  });
});
