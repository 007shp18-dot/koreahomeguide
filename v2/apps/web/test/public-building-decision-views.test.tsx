import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { BuildingDecisionView } from '../components/public-market/building-decision-views';
import { buildBuildingDecisionModel } from '../lib/public-market/building-decision-model';
import type {
  BuildingContractCohort,
  BuildingDecisionMode,
} from '../lib/public-market/building-decision-state';
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

function render(mode: BuildingDecisionMode, contract: BuildingContractCohort): string {
  const model = buildingModel();
  const decision = buildBuildingDecisionModel(model, { mode, contract });
  return renderToStaticMarkup(
    <BuildingDecisionView
      model={model}
      decision={decision}
      base="/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/"
    />,
  );
}

describe('building decision views', () => {
  it('keeps Overview concise and points to the supported Rent decision', () => {
    const overview = render('overview', 'new');
    expect(overview).toContain('Evidence is ready for a rent comparison');
    expect(overview).toContain('Official sale evidence is not ready');
    expect(overview).toContain('Check my contract');
    expect(overview).not.toContain('Privacy-safe reported contracts');
  });

  it('publishes All but never substitutes it for an insufficient New cohort', () => {
    const rentAll = render('rent', 'all');
    expect(rentAll).toContain('data-plot-variant="full"');
    expect(rentAll).toContain('6 reported contracts');
    expect(rentAll).toContain('Open full Rent Check');

    const rentNew = render('rent', 'new');
    expect(rentNew).toContain('New contract evidence is not published');
    expect(rentNew).not.toContain('₩320,000,000');
  });

  it('keeps Buy and Invest visible without invented prices or forecasts', () => {
    const buy = render('buy', 'new');
    expect(buy).toContain('Official sale evidence is not ready');
    expect(buy).not.toMatch(/asking price.*official sale/i);

    const invest = render('invest', 'new');
    expect(invest).toContain('Investment evidence is incomplete');
    expect(invest).not.toMatch(/expected return|forecast|appreciation rate/i);
  });

  it('renders the current source, rights policy, and missing evidence ledger', () => {
    const evidence = render('evidence', 'new');
    expect(evidence).toContain('MOLIT');
    expect(evidence).toContain('kr-molit-rent-v1');
    expect(evidence).toContain('Official sale evidence');
    expect(evidence).toContain('Building visual');
    expect(evidence).toContain('Community');
  });
});
