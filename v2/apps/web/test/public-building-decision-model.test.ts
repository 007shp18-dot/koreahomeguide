import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildBuildingDecisionModel } from '../lib/public-market/building-decision-model';
import { buildPublicBuildingModel } from '../lib/public-market/building-route-model.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
} from './public-building-fixture';

function buildingModel() {
  const model = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
    source: createPublicBuildingFixture(),
    period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    referenceInstant: '2026-09-01T00:00:00.000Z',
  });
  if (model === null) throw new Error('Expected verified building model.');
  return model;
}

describe('building decision model', () => {
  it('keeps New selected but fails the unpublished cohort closed', () => {
    const decision = buildBuildingDecisionModel(buildingModel(), {
      mode: 'rent', contract: 'new',
    });
    expect(decision.rent).toMatchObject({
      cohort: 'new',
      readiness: {
        state: 'insufficient', count: 3,
        title: 'New contract evidence is not published',
      },
      summary: null,
    });
    expect(decision.rent.axis).toEqual({ min: 300_000_000, max: 340_000_000 });
  });

  it('publishes All from the verified artifact and keeps future modes gated', () => {
    const decision = buildBuildingDecisionModel(buildingModel(), {
      mode: 'overview', contract: 'all',
    });
    expect(decision.rent.summary).toMatchObject({
      published: true, n: 6, med: 320_000_000,
    });
    expect(decision.overview.primaryMode).toBe('rent');
    expect(decision.buy).toMatchObject({
      readiness: { state: 'unavailable', title: 'Official sale evidence is not ready' },
    });
    expect(decision.invest).toMatchObject({
      readiness: { state: 'insufficient', title: 'Investment evidence is incomplete' },
    });
    expect(decision.rentCheckHref)
      .toBe('/kr/seoul/check/?lawdCd=11680&type=apartment');
  });
});
