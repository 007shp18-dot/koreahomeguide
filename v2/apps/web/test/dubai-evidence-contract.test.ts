import { describe, expect, it } from 'vitest';

import { parseDubaiAreaEvidence } from '../lib/dubai/evidence-contract';
import {
  approvedDubaiRights,
  dubaiEvidenceFixture,
  pendingDubaiRights,
  pendingDubaiUnits,
  verifiedDubaiUnits,
  withDubaiEvidenceDataDigest,
} from './dubai-evidence-fixture';

describe('Dubai area evidence contract', () => {
  it('accepts a complete aggregate snapshot and freezes every public layer', () => {
    const parsed = parseDubaiAreaEvidence(dubaiEvidenceFixture());

    expect(parsed.version).toBe('signedprice-dubai-area-evidence-v1');
    expect(parsed.areas[0]?.segments[0]?.readyGrossYieldPct).toBe(6);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.areas)).toBe(true);
    expect(Object.isFrozen(parsed.areas[0])).toBe(true);
    expect(Object.isFrozen(parsed.areas[0]?.segments)).toBe(true);
    expect(Object.isFrozen(parsed.areas[0]?.segments[0]?.comparableAreaIds.ready)).toBe(true);
  });

  it('accepts an explicit pending licence for local validation', () => {
    const parsed = parseDubaiAreaEvidence({
      ...dubaiEvidenceFixture(),
      rights: pendingDubaiRights,
      units: { ...dubaiEvidenceFixture().units, currencyBasis: 'inferred-dld-reporting' },
      unitVerification: pendingDubaiUnits,
      publication: { displayState: 'draft', indexState: 'noindex' },
    });

    expect(parsed.rights.state).toBe('pending');
    expect(parsed.rights.licenseUrl).toBeNull();
    expect(parsed.unitVerification.state).toBe('pending');
    expect(parsed.publication).toEqual({ displayState: 'draft', indexState: 'noindex' });
  });

  it('rejects a data digest that does not bind the published aggregates', () => {
    expect(() => parseDubaiAreaEvidence({
      ...dubaiEvidenceFixture(),
      dataDigest: 'f'.repeat(64),
    })).toThrow('Dubai area evidence unavailable');
  });

  it.each([
    ['comparison window outside a source period', (() => {
      const fixture = dubaiEvidenceFixture();
      return {
        ...fixture,
        sourcePeriods: {
          ...fixture.sourcePeriods,
          transactions: { from: '2026-06-09', to: fixture.sourcePeriods.transactions.to },
        },
      };
    })()],
    ['published sale counts above mapped rows', (() => {
      const fixture = dubaiEvidenceFixture();
      return { ...fixture, totals: { ...fixture.totals, mappedSaleRows: 30 } };
    })()],
    ['published rent counts above qualifying rows', (() => {
      const fixture = dubaiEvidenceFixture();
      return { ...fixture, totals: { ...fixture.totals, qualifyingRentRows: 59 } };
    })()],
    ['excluded sale count unrelated to source totals', (() => {
      const fixture = dubaiEvidenceFixture();
      return { ...fixture, totals: { ...fixture.totals, excludedSaleRows: 1 } };
    })()],
    ['a ratio unrelated to the released medians', (() => {
      const fixture = dubaiEvidenceFixture();
      return {
        ...fixture,
        areas: [{
          ...fixture.areas[0]!,
          segments: [{ ...fixture.areas[0]!.segments[0]!, readyGrossYieldPct: 7 }],
        }],
      };
    })()],
  ])('rejects %s even with a recomputed data digest', (_label, value) => {
    expect(() => parseDubaiAreaEvidence(withDubaiEvidenceDataDigest(value)))
      .toThrow('Dubai area evidence unavailable');
  });

  it('rejects pending rights that claim granted permissions', () => {
    expect(() => parseDubaiAreaEvidence({
      ...dubaiEvidenceFixture(),
      rights: { ...approvedDubaiRights, state: 'pending', licenseUrl: null },
      publication: { displayState: 'draft', indexState: 'noindex' },
    })).toThrow('Dubai area evidence unavailable');
  });

  it.each([
    ['approved rights without a named reviewer', { ...approvedDubaiRights, reviewedBy: null }],
    ['pending rights that claim a completed review', { ...pendingDubaiRights, reviewedBy: 'Release owner' }],
  ])('rejects %s', (_label, rights) => {
    expect(() => parseDubaiAreaEvidence({
      ...dubaiEvidenceFixture(),
      rights,
      ...(rights.state === 'pending' ? {
        units: { ...dubaiEvidenceFixture().units, currencyBasis: 'inferred-dld-reporting' },
        unitVerification: pendingDubaiUnits,
        publication: { displayState: 'draft', indexState: 'noindex' },
      } : {}),
    })).toThrow('Dubai area evidence unavailable');
  });

  it.each([
    ['wrong market', { marketId: 'sg-singapore' }],
    ['wrong area unit', { units: { ...dubaiEvidenceFixture().units, area: 'sqft' } }],
    ['unknown currency basis', { units: { ...dubaiEvidenceFixture().units, currencyBasis: 'declared-by-source' } }],
    ['indexed pending rights', { rights: pendingDubaiRights }],
    ['approved rights with pending units', {
      units: { ...dubaiEvidenceFixture().units, currencyBasis: 'inferred-dld-reporting' },
      unitVerification: pendingDubaiUnits,
    }],
    ['verified units with pending rights', { rights: pendingDubaiRights }],
    ['verified units without evidence', {
      unitVerification: { ...verifiedDubaiUnits, evidenceUrl: null },
    }],
    ['indexed stale release', { publication: { displayState: 'stale', indexState: 'index' } }],
    ['thin sale cohort', {
      areas: [{
        ...dubaiEvidenceFixture().areas[0],
        segments: [{
          ...dubaiEvidenceFixture().areas[0]!.segments[0],
          sales: {
            ready: { ...dubaiEvidenceFixture().areas[0]!.segments[0]!.sales.ready!, n: 29 },
            offPlan: null,
          },
        }],
      }],
    }],
    ['inverted quartiles', {
      areas: [{
        ...dubaiEvidenceFixture().areas[0],
        segments: [{
          ...dubaiEvidenceFixture().areas[0]!.segments[0],
          sales: {
            ready: {
              ...dubaiEvidenceFixture().areas[0]!.segments[0]!.sales.ready!,
              priceP25Aed: 1_700_000,
            },
            offPlan: null,
          },
        }],
      }],
    }],
    ['duplicate area slug', { areas: [dubaiEvidenceFixture().areas[0], dubaiEvidenceFixture().areas[0]] }],
    ['legacy flat comparable list', {
      areas: [{
        ...dubaiEvidenceFixture().areas[0],
        segments: [{
          ...dubaiEvidenceFixture().areas[0]!.segments[0],
          comparableAreaIds: [] as never,
        }],
      }],
    }],
  ])('rejects %s', (_label, override) => {
    expect(() => parseDubaiAreaEvidence({
      ...dubaiEvidenceFixture(),
      ...override,
    })).toThrow('Dubai area evidence unavailable');
  });

  it.each([
    ['unknown comparable area', { ready: ['ae-dubai:area:missing'], offPlan: [] }],
    ['comparison attached to an unavailable stage', { ready: [], offPlan: ['ae-dubai:area:missing'] }],
  ])('rejects %s after validating the aggregate digest', (_label, comparableAreaIds) => {
    const fixture = dubaiEvidenceFixture();
    const changed = {
      ...fixture,
      areas: [{
        ...fixture.areas[0]!,
        segments: [{ ...fixture.areas[0]!.segments[0]!, comparableAreaIds }],
      }],
    };
    expect(() => parseDubaiAreaEvidence(withDubaiEvidenceDataDigest(changed)))
      .toThrow('Dubai area evidence unavailable');
  });
});
