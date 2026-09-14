import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (read: unknown) => read }));

import { createDubaiEvidenceRepository } from '../lib/dubai/evidence-repository.server';
import { dubaiProjectEvidenceForContext } from '../lib/dubai/project-evidence.server';
import type { TokyoAreaSummary } from '../lib/japan/area-map-summary.server';
import { TOKYO_CONDOMINIUM_TYPE } from '../lib/japan/query';
import { namedPropertyDecisionPrice } from '../lib/research/property-decision-price.server';
import { propertyReviewProfilesForMarket } from '../lib/research/property-review-profile';

type Dependencies = NonNullable<Parameters<typeof namedPropertyDecisionPrice>[2]>;
const toyosu = propertyReviewProfilesForMarket('jp-tokyo').find(profile => profile.id === 'jp-bayz-tower-garden')!;
const current = { city: '13108', year: '2026', quarter: '1', sourceCount: 10 };
const older = { city: '13108', year: '2025', quarter: '4', sourceCount: 10 };
const area = (district: string | null, median: number, count: number, period = current): TokyoAreaSummary => ({
  city: period.city, year: period.year, quarter: period.quarter, municipality: 'Koto', district, median, count,
});
function dependencies(overrides: Partial<Dependencies> = {}): Dependencies {
  return { dubaiRepository: () => null, dubaiProjects: dubaiProjectEvidenceForContext,
    tokyoCoverage: async () => [current], tokyoAreas: async () => [], ...overrides };
}

describe('decision prices retain their published source scope', () => {
  it('resolves the installed Dubai catalogue as 24 exact projects and four explicitly identified area references', async () => {
    const serialized = gunzipSync(readFileSync(new URL('../data/dubai-area-evidence.json.gz', import.meta.url))).toString('utf8');
    const repository = await createDubaiEvidenceRepository({ serialized,
      expectedDigest: createHash('sha256').update(serialized).digest('hex') });
    const profiles = propertyReviewProfilesForMarket('ae-dubai');
    const results = await Promise.all(profiles.map(profile => namedPropertyDecisionPrice(profile, 'en', dependencies({
      dubaiRepository: () => repository,
    }))));
    expect(results.filter(result => result.scope === 'property')).toHaveLength(24);
    expect(results.filter(result => result.scope === 'area')).toHaveLength(4);
    for (const result of results) {
      expect(result.currency).toBe('AED');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThanOrEqual(repository.getContext().publicationMinimum);
      expect(result.period).toBe('2026-06-08 – 2026-09-05');
    }
    const skyflame = results[profiles.findIndex(profile => profile.id === 'ae-skyflame-1')]!;
    const publishedArea = repository.getArea('wadi-al-safa-3')!.segments.find(segment => segment.housing === 'apartment')!.sales.offPlan!;
    expect(skyflame.scope).toBe('area');
    expect(skyflame.label).toContain('Wadi Al Safa 3');
    expect(skyflame.amount).toBe(publishedArea.medianPriceAed);
    expect(skyflame.count).toBe(publishedArea.n);
    expect(skyflame.range).toEqual({ low: publishedArea.priceP25Aed, high: publishedArea.priceP75Aed });
    expect(skyflame.note).toContain('not this project');
    for (const [id, areaSlug] of [
      ['ae-park-ridge', 'hadaeq-sheikh-mohammed-bin-rashid'],
      ['ae-creek-horizon', 'al-khairan-first'],
      ['ae-creekside-18', 'al-khairan-first'],
    ]) {
      const result = results[profiles.findIndex(profile => profile.id === id)]!;
      const area = repository.getArea(areaSlug!)!;
      const ready = area.segments.find(segment => segment.housing === 'apartment')!.sales.ready!;
      expect(result.scope).toBe('area');
      expect(result.label).toContain(area.name);
      expect(result.amount).toBe(ready.medianPriceAed);
      expect(result.count).toBe(ready.n);
      expect(result.note).toContain('not this project');
    }
  });

  it('never falls back to the historical catalogue metric when the verified Dubai repository is unavailable', async () => {
    const profile = propertyReviewProfilesForMarket('ae-dubai')[0]!;
    const result = await namedPropertyDecisionPrice(profile, 'en', dependencies());
    expect(result).toMatchObject({ scope: 'unavailable', amount: null, count: null, period: null });
  });

  it('selects the latest activated Tokyo neighbourhood cohort and never presents it as named-building transactions', async () => {
    const summaries = vi.fn(async () => [
      area(null, 65_000_000, 10), area('Toyosu', 82_000_000, 3),
      { ...area('Toyosu', 999_000_000, 30), city: '13103' },
    ]);
    const result = await namedPropertyDecisionPrice(toyosu, 'en', dependencies({
      tokyoCoverage: async () => [older, { ...current, city: '13103' }, current], tokyoAreas: summaries,
    }));
    expect(summaries).toHaveBeenCalledOnce();
    expect(summaries).toHaveBeenCalledWith('13108', '2026', '1', {
      q: '', type: TOKYO_CONDOMINIUM_TYPE, minArea: null, maxArea: null,
    });
    expect(result).toMatchObject({ scope: 'area', currency: 'JPY', amount: 82_000_000, count: 3, period: '2026 Q1', unit: 'total' });
    expect(result.label).toContain('Toyosu');
    expect(result.note).toContain('neither a recorded sale at this building');
    expect(result.range).toBeUndefined();
  });

  it('uses a clearly named ward median when no exact neighbourhood cohort is published', async () => {
    const result = await namedPropertyDecisionPrice(toyosu, 'en', dependencies({
      tokyoAreas: async () => [area(null, 65_000_000, 10), area('Ariake', 95_000_000, 6)],
    }));
    expect(result).toMatchObject({ scope: 'area', amount: 65_000_000, count: 10 });
    expect(result.label).toContain('Koto');
    expect(result.label).not.toContain('Ariake');
  });

  it('retains the older published period when the latest quarter has no qualifying prices', async () => {
    const summaries = vi.fn(async (_city: string, year: string) => year === '2026' ? [] : [area('Toyosu', 78_000_000, 4, older)]);
    const result = await namedPropertyDecisionPrice(toyosu, 'en', dependencies({
      tokyoCoverage: async () => [current, older], tokyoAreas: summaries,
    }));
    expect(summaries).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ scope: 'area', amount: 78_000_000, count: 4, period: '2025 Q4' });
  });

  it('keeps zero, invalid counts, missing coverage and database failures unavailable', async () => {
    const cases: Partial<Dependencies>[] = [
      { tokyoAreas: async () => [area('Toyosu', 0, 3), area(null, 65_000_000, 0)] },
      { tokyoAreas: async () => [area('Toyosu', Number.NaN, 3), area(null, 65_000_000, 2.5)] },
      { tokyoCoverage: async () => [] },
      { tokyoCoverage: async () => { throw new Error('database unavailable'); } },
      { tokyoAreas: async () => { throw new Error('database unavailable'); } },
    ];
    for (const overrides of cases) {
      expect(await namedPropertyDecisionPrice(toyosu, 'en', dependencies(overrides)))
        .toMatchObject({ scope: 'unavailable', amount: null, count: null, period: null });
    }
  });
});
