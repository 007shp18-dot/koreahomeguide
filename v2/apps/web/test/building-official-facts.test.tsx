import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { BuildingOfficialFacts } from '../components/public-market/building-official-facts';

describe('building official facts panel', () => {
  test('starts with an honest loading boundary and an encoded installed identity request', () => {
    const html = renderToStaticMarkup(
      <BuildingOfficialFacts districtSlug="gangnam-gu" buildingId="gangnam-alpha" />,
    );
    expect(html).toContain('data-building-section="official-facts"');
    expect(html).toContain('Loading official building facts');
    expect(html).not.toMatch(/households|parking spaces|approval date/i);
  });
});
