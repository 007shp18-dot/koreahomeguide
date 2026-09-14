import React, { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../components/market-ui/property-decision-workspace', () => ({ PropertyDecisionWorkspace: () => null }));

import { AreaDecisionWorkspace } from '../components/market-ui/area-decision-workspace';
import type { AreaDecisionProfile } from '../lib/research/area-decision';
import { reviewLocation } from '../lib/research/property-review-locations';
import { matchesTokyoLocality, tokyoLocalityForAddress } from '../lib/research/tokyo-locality';

describe('Tokyo area report matches the verified street locality', () => {
  it.each(['Kamiosaki', 'Kami-Osaki', 'kami osaki', '上大崎'])('keeps the reviewed Meguro towers visible for %s', neighbourhood => {
    const children = React.createElement('p', null, 'Transactions');
    const result = AreaDecisionWorkspace({ market: 'jp-tokyo', areaKey: '13109', name: 'Kamiosaki',
      neighbourhood, locale: 'en', children });
    expect(result).not.toBe(children);
    expect(isValidElement<{ profile: AreaDecisionProfile }>(result)).toBe(true);
    if (!isValidElement<{ profile: AreaDecisionProfile }>(result)) throw new Error('Missing area report');
    expect(result.props.profile.review.comparisons.map(item => item.name.en)).toEqual(['Brillia Towers Meguro']);
    expect(result.props.profile.review.sections.transport.every(point => point.title.en.includes('Brillia Towers Meguro'))).toBe(true);
  });

  it('does not match Udagawacho through the Shibuya ward name in its address', () => {
    const address = reviewLocation('jp-park-court-shibuya')!.address;
    expect(address).toContain('Shibuya');
    expect(matchesTokyoLocality(address, 'Shibuya')).toBe(false);
    expect(matchesTokyoLocality(address, 'Udagawacho')).toBe(true);
    expect(matchesTokyoLocality(address, 'Udagawa')).toBe(false);
    expect(matchesTokyoLocality(address, '')).toBe(false);
    const children = React.createElement('p', null, 'Transactions');
    expect(AreaDecisionWorkspace({ market: 'jp-tokyo', areaKey: '13113', name: 'Shibuya', neighbourhood: 'Shibuya',
      locale: 'en', children })).toBe(children);
  });

  it('requires the correct ward as well as the matching locality', () => {
    const children = React.createElement('p', null, 'Transactions');
    expect(AreaDecisionWorkspace({ market: 'jp-tokyo', areaKey: '13103', name: 'Kamiosaki', neighbourhood: 'Kamiosaki',
      locale: 'en', children })).toBe(children);
    expect(tokyoLocalityForAddress(reviewLocation('jp-brillia-towers-meguro')!.address)).toContain('Kami-Osaki');
  });
});
