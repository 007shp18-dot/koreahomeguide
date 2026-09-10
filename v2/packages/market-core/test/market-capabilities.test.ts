import { describe, expect, it } from 'vitest';

import { getMarketCapability, listMarketCapabilities } from '../src';

describe('market capability registry', () => {
  it('keeps transaction-detail depth honest across the three cities', () => {
    expect(getMarketCapability('kr-seoul', 'transaction_detail', null)).toMatchObject({
      state: 'available',
      publicHref: '/kr/seoul/explore/',
    });
    expect(getMarketCapability('sg-singapore', 'transaction_detail', 'private_residential')).toMatchObject({
      state: 'limited',
      publicHref: '/sg/singapore/explore/',
    });
    expect(getMarketCapability('sg-singapore', 'transaction_detail', 'hdb')).toMatchObject({
      state: 'limited',
      publicHref: '/sg/singapore/explore/?sector=hdb',
    });
    expect(getMarketCapability('ae-dubai', 'transaction_detail', null)).toMatchObject({
      state: 'rights_blocked',
      publicHref: null,
    });
  });

  it('separates Singapore public and private housing capabilities', () => {
    const singapore = listMarketCapabilities('sg-singapore');

    expect(singapore.filter(({ feature }) => feature === 'transaction_detail')).toEqual([
      expect.objectContaining({ housingSector: 'private_residential', state: 'limited' }),
      expect.objectContaining({ housingSector: 'hdb', state: 'limited' }),
    ]);
  });

  it('returns no broad fallback when a sector-specific capability is undeclared', () => {
    expect(getMarketCapability('sg-singapore', 'transaction_detail', null)).toBeNull();
    expect(getMarketCapability('ae-dubai', 'check', 'hdb')).toBeNull();
  });

  it('does not allow consumers to widen a rights-blocked capability', () => {
    const capability = getMarketCapability('ae-dubai', 'transaction_detail', null);
    expect(capability).not.toBeNull();
    const mutable = capability as unknown as { state: string; limitations: string[] };

    for (const mutate of [
      () => { mutable.state = 'available'; },
      () => { mutable.limitations.length = 0; },
    ]) {
      try {
        mutate();
      } catch {
        // Frozen capability records reject mutation in strict mode.
      }
    }

    expect(getMarketCapability('ae-dubai', 'transaction_detail', null)).toMatchObject({
      state: 'rights_blocked',
      limitations: ['Transaction detail requires a licensed display boundary.'],
    });
  });
});
