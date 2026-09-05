import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BuildingDirectory } from '@/components/public-market/building-directory';

const entries = [
  {
    buildingId: 'heliocity',
    districtSlug: 'songpa-gu' as const,
    name: '헬리오시티',
    neighborhoodName: '가락동',
    contracts: 82,
    href: '/kr/seoul/explore/songpa-gu/heliocity/',
  },
  {
    buildingId: 'jamsil-5',
    districtSlug: 'songpa-gu' as const,
    name: '잠실주공5단지',
    neighborhoodName: '잠실동',
    contracts: 61,
    href: '/kr/seoul/explore/songpa-gu/jamsil-5/',
  },
];

describe('BuildingDirectory', () => {
  it('renders no empty navigation shell when the district has no published wave', () => {
    expect(renderToStaticMarkup(
      <BuildingDirectory districtName="Songpa-gu" entries={[]} />,
    )).toBe('');
  });

  it('server-renders an accessible list with evidence depth for every building', () => {
    const html = renderToStaticMarkup(
      <BuildingDirectory districtName="Songpa-gu" entries={entries} />,
    );

    expect(html).toContain('<nav');
    expect(html).toContain('aria-labelledby="building-directory-heading"');
    expect(html).toContain('<h2 id="building-directory-heading">Buildings published for Songpa-gu</h2>');
    expect(html).toContain('2 buildings meet the current evidence publication threshold.');
    expect(html).toContain('Counts show contracts in each building’s widest published cohort.');
    expect(html).toContain('href="/kr/seoul/explore/songpa-gu/heliocity"');
    expect(html).toContain('헬리오시티');
    expect(html).toContain('가락동');
    expect(html).toContain('82 contracts');
    expect(html.match(/<li/g)).toHaveLength(2);
  });
});
