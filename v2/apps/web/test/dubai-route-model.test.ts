import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createDubaiEvidenceRepository } from '../lib/dubai/evidence-repository.server';
import {
  buildDubaiAreaModel,
  buildDubaiAreaSeo,
  buildDubaiCheckModel,
  buildDubaiExploreModel,
} from '../lib/dubai/route-model.server';
import type { DubaiAreaEvidenceSnapshot } from '../lib/dubai/evidence-contract';
import {
  dubaiComparableEvidenceFixture,
  dubaiEvidenceFixture,
  withDubaiEvidenceDataDigest,
} from './dubai-evidence-fixture';

async function repositoryFor(value: unknown = dubaiEvidenceFixture()) {
  const serialized = JSON.stringify(value);
  return createDubaiEvidenceRepository({
    serialized,
    expectedDigest: createHash('sha256').update(serialized).digest('hex'),
  });
}

describe('Dubai area route models', () => {
  it('uses one released model for Explore, detail, and Check options', async () => {
    const repository = await repositoryFor();
    const explore = buildDubaiExploreModel(repository);
    const area = buildDubaiAreaModel(repository, 'marsa-dubai');
    const check = buildDubaiCheckModel(repository);

    expect(explore).toMatchObject({
      status: 'ready',
      areas: [{
        name: 'Marsa Dubai',
        href: '/ae/dubai/explore/marsa-dubai/',
      }],
    });
    expect(area).toMatchObject({
      status: 'ready',
      identity: { name: 'Marsa Dubai', slug: 'marsa-dubai' },
      checkHref: '/ae/dubai/check/?area=marsa-dubai&housing=apartment&completion=ready&returnTo=%2Fae%2Fdubai%2Fexplore%2Fmarsa-dubai%2F',
    });
    expect(check).toMatchObject({
      status: 'ready',
      areas: [{ slug: 'marsa-dubai', housing: ['apartment'] }],
    });
  });

  it('resolves Ready and Off-Plan comparable routes independently', async () => {
    const repository = await repositoryFor(dubaiComparableEvidenceFixture());
    const area = buildDubaiAreaModel(repository, 'marsa-dubai');
    if (area === null) throw new Error('fixture unavailable');

    expect(area.segments[0]?.comparableAreas.ready.map(({ slug }) => slug))
      .toEqual(['business-bay']);
    expect(area.segments[0]?.comparableAreas.offPlan.map(({ slug }) => slug))
      .toEqual(['business-bay']);
  });

  it('composes SEO from the actual segment, stage, yield, and as-of year', async () => {
    const repository = await repositoryFor();
    const model = buildDubaiAreaModel(repository, 'marsa-dubai');
    if (model?.status !== 'ready') throw new Error('fixture unavailable');

    expect(buildDubaiAreaSeo(model)).toEqual({
      title: 'Marsa Dubai apartment sale prices and rent evidence 2026 | signedprice',
      description: expect.stringContaining('Ready apartment'),
    });

    const fixture = dubaiEvidenceFixture();
    const offPlanOnly: DubaiAreaEvidenceSnapshot = {
      ...fixture,
      areas: [{
        ...fixture.areas[0]!,
        segments: [{
          ...fixture.areas[0]!.segments[0]!,
          housing: 'villa',
          sales: {
            ready: null,
            offPlan: fixture.areas[0]!.segments[0]!.sales.ready,
          },
          readyGrossYieldPct: null,
        }],
      }],
    };
    const offPlanRepository = await repositoryFor(withDubaiEvidenceDataDigest(offPlanOnly));
    const offPlanModel = buildDubaiAreaModel(offPlanRepository, 'marsa-dubai');
    if (offPlanModel?.status !== 'ready') throw new Error('fixture unavailable');
    const seo = buildDubaiAreaSeo(offPlanModel);
    expect(seo.title).toBe('Marsa Dubai off-plan villa prices 2026 | signedprice');
    expect(seo.title).not.toMatch(/apartment|rent evidence|Ready/u);
  });

  it('returns null instead of substituting an unknown area', async () => {
    expect(buildDubaiAreaModel(await repositoryFor(), 'dubai-marina')).toBeNull();
  });

  it('shows stale display evidence without publishing routes or Check links', async () => {
    const repository = await repositoryFor({
      ...dubaiEvidenceFixture(),
      publication: { displayState: 'stale', indexState: 'noindex' },
    });
    const explore = buildDubaiExploreModel(repository);

    expect(explore).toMatchObject({
      status: 'ready',
      context: { displayState: 'stale' },
      areas: [{ href: null }],
    });
    expect(buildDubaiAreaModel(repository, 'marsa-dubai')).toBeNull();
    expect(buildDubaiCheckModel(repository)).toEqual({
      status: 'unavailable',
      message: 'Verified Dubai area evidence unavailable',
    });
  });
});
