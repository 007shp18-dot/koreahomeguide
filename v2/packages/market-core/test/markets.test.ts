import { describe, expect, it } from 'vitest';
import {
  createRightsPolicy,
  evaluateReadiness,
  getIntentHref,
  getMarketByRoute,
  getMarketProfile,
  marketProfiles,
} from '../src';

const initialMarketIds = ['kr-seoul', 'sg-singapore', 'ae-dubai'] as const;

describe('market contracts', () => {
  it('keeps exactly three initial markets in a single registry', () => {
    expect(marketProfiles.map((market) => market.id)).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(initialMarketIds.map(getMarketProfile)).toHaveLength(3);
  });

  it('keeps intent separate from market identity and produces canonical English URLs', () => {
    expect(getIntentHref('ae-dubai', 'invest')).toBe('/ae/dubai/invest/');
    expect(getMarketByRoute('ae', 'dubai')?.id).toBe('ae-dubai');
    expect(getMarketByRoute('ko', 'seoul')).toBeUndefined();
  });

  it('uses only approved product depth and rights-blocked capability states', () => {
    expect(getMarketProfile('kr-seoul').productDepth).toBe('full_product');
    expect(getMarketProfile('sg-singapore').productDepth).toBe('market_intelligence');
    expect(getMarketProfile('ae-dubai').productDepth).toBe('market_intelligence');
    expect(getMarketProfile('sg-singapore').capabilities.buy).toBe('limited');
    expect(getMarketProfile('ae-dubai').capabilities.buy).toBe('limited');
  });

  it('keeps canonical profiles and nested market copy immutable at runtime', () => {
    const profile = getMarketProfile('kr-seoul');
    const originalRegistryIds = marketProfiles.map((market) => market.id);
    const originalDataLabel = profile.dataLabel;
    const originalLimitations = [...profile.limitations];
    const originalRentCapability = profile.capabilities.rent;
    const privateDetail = getMarketProfile('sg-singapore').dataCapabilities.find(
      (capability) => capability.housingSector === 'private_residential',
    );
    const mutableProfile = profile as unknown as {
      id: string;
      citySlug: string;
      dataLabel: string;
      limitations: string[];
      capabilities: Record<'rent', string>;
    };
    const mutableRegistry = marketProfiles as unknown as unknown[];
    const mutablePrivateDetail = privateDetail as unknown as {
      limitations: string[];
      state: string;
    };

    for (const mutate of [
      () => {
        mutableRegistry.reverse();
      },
      () => {
        mutableProfile.id = 'ae-dubai';
      },
      () => {
        mutableProfile.citySlug = 'tampered';
      },
      () => {
        mutableProfile.dataLabel = 'invented data';
      },
      () => {
        mutableProfile.limitations.push('invented limitation');
      },
      () => {
        mutableProfile.capabilities.rent = 'rights_blocked';
      },
      () => {
        mutablePrivateDetail.limitations.push('invented limitation');
      },
      () => {
        mutablePrivateDetail.state = 'available';
      },
    ]) {
      try {
        mutate();
      } catch {
        // Frozen contract objects reject mutation in strict mode.
      }
    }

    expect(getMarketProfile('kr-seoul')).toMatchObject({
      id: 'kr-seoul',
      citySlug: 'seoul',
      dataLabel: originalDataLabel,
      capabilities: { rent: originalRentCapability },
    });
    expect(getMarketProfile('kr-seoul').limitations).toEqual(originalLimitations);
    expect(getMarketByRoute('kr', 'seoul')?.id).toBe('kr-seoul');
    expect(marketProfiles.map((market) => market.id)).toEqual(originalRegistryIds);
    expect(
      getMarketProfile('sg-singapore').dataCapabilities.find(
        (capability) => capability.housingSector === 'private_residential',
      ),
    ).toMatchObject({
      state: 'limited',
      limitations: expect.not.arrayContaining(['invented limitation']),
    });
  });

  it('exposes deeply readonly public profile types', () => {
    const profile = getMarketProfile('sg-singapore');

    if (false) {
      // @ts-expect-error Market identity cannot be reassigned by consumers.
      profile.citySlug = 'tampered';
      // @ts-expect-error Nested intent capabilities are immutable too.
      profile.capabilities.buy = 'available';
      // @ts-expect-error Structured limitations cannot be appended to.
      profile.dataCapabilities[0].limitations.push('invented limitation');
    }

    expect(profile.id).toBe('sg-singapore');
  });

  it('models sector and detail rights separately from route intent', () => {
    const singapore = getMarketProfile('sg-singapore');
    const privateSaleIntelligence = singapore.dataCapabilities.find(
      (capability) =>
        capability.housingSector === 'private_residential' &&
        capability.dataScope === 'market_intelligence',
    );
    const dubaiTransactionDetails = getMarketProfile('ae-dubai').dataCapabilities.filter(
      (capability) => capability.dataScope === 'transaction_detail',
    );

    expect(singapore.dataLabel).toBe('URA private residential sale intelligence');
    expect(privateSaleIntelligence?.state).toBe('limited');
    expect(singapore.dataCapabilities).toHaveLength(1);
    expect(dubaiTransactionDetails).toEqual([
      expect.objectContaining({
        housingSector: null,
        state: 'rights_blocked',
      }),
    ]);
    expect(
      singapore.dataCapabilities.map((capability) => capability.housingSector),
    ).not.toEqual(expect.arrayContaining(['freehold', 'leasehold']));
  });

  it('denies indexing until every readiness condition passes', () => {
    expect(
      evaluateReadiness({ contentReady: true, rightsCanIndex: false, domainReady: false }),
    ).toBe('noindex');
    expect(
      evaluateReadiness({ contentReady: true, rightsCanIndex: true, domainReady: true }),
    ).toBe('indexable');
  });

  it('denies every undeclared data right', () => {
    expect(createRightsPolicy({ id: 'unapproved-source' })).toMatchObject({
      canFetch: false,
      canStore: false,
      canCache: false,
      canDisplay: false,
      canCreateDerived: false,
      canUseCommercially: false,
      canIndex: false,
    });
  });

  it('exposes deeply readonly rights policy types', () => {
    const policy = createRightsPolicy({
      id: 'approved-source',
      attribution: ['Publisher'],
    });

    if (false) {
      // @ts-expect-error Publication rights cannot be reassigned by consumers.
      policy.canIndex = true;
      // @ts-expect-error Nested attribution cannot be appended to by consumers.
      policy.attribution.push('Invented publisher');
    }

    expect(policy.id).toBe('approved-source');
  });

  it('clones and deeply freezes rights policies at runtime', () => {
    const attribution = ['Publisher'];
    const policy = createRightsPolicy({
      id: 'approved-source',
      canDisplay: true,
      attribution,
    });
    const mutablePolicy = policy as unknown as {
      canDisplay: boolean;
      attribution: string[];
    };

    attribution.push('Caller mutation');

    for (const mutate of [
      () => {
        mutablePolicy.canDisplay = false;
      },
      () => {
        mutablePolicy.attribution.push('Policy mutation');
      },
    ]) {
      try {
        mutate();
      } catch {
        // Frozen contract objects reject mutation in strict mode.
      }
    }

    expect(policy).toMatchObject({
      canDisplay: true,
      attribution: ['Publisher'],
    });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.attribution)).toBe(true);
  });
});
