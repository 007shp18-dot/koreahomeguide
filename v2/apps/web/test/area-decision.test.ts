import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { areaDecisionProfile, getAreaDecision } from '../lib/research/area-decision';
import { DECISION_PERSONAS } from '../lib/research/property-decision';
import { propertyReviewSchema } from '../lib/research/property-review';
import { propertyReviewProfilesForMarket } from '../lib/research/property-review-profile';

const profiles = propertyReviewProfilesForMarket('jp-tokyo').filter(profile =>
  ['jp-bayz-tower-garden', 'jp-branz-tower-toyosu'].includes(profile.id));
const input = { market: 'jp-tokyo' as const, areaKey: 'toyosu', name: { ko: '도요스', en: 'Toyosu' }, profiles };

describe('area decisions preserve each named property boundary', () => {
  it('retains original facts and qualifications while namespacing sources and identifying every example', () => {
    const before = JSON.stringify(profiles);
    const profile = areaDecisionProfile(input)!;
    const review = propertyReviewSchema.parse(profile.review);
    const sources = new Map(review.sources.map(source => [source.id, source]));
    expect(sources.size).toBe(review.sources.length);
    for (const original of profiles) {
      for (const source of original.review.sources) {
        expect(sources.get(`${original.id}::${source.id}`)).toMatchObject({ url: source.url, checkedOn: source.checkedOn });
      }
    }
    for (const section of ['transport', 'schools', 'daily', 'costs'] as const) {
      const points = review.sections[section];
      expect(points[0]!.title.en).toContain(profiles[0]!.review.name.en);
      expect(points[1]!.title.en).toContain(profiles[1]!.review.name.en);
      for (const point of points) {
        const owner = profiles.find(candidate => point.sourceIds.every(id => id.startsWith(`${candidate.id}::`)))!;
        const original = owner.review.sections[section].find(candidate => candidate.title.en === point.title.en.replace(/^「[^」]+」\s*/, ''))!;
        expect(point.body).toEqual(original.body);
        expect(point.status).toBe(original.status);
        expect(point.title.ko).toContain(owner.review.name.ko);
        expect(point.sourceIds.every(id => sources.has(id))).toBe(true);
      }
    }
    expect(profile.checked_on).toBe(profiles.map(item => item.checked_on).sort()[0]);
    expect(JSON.stringify(profiles)).toBe(before);
    expect(review).not.toHaveProperty('score');
    expect(review).not.toHaveProperty('price');
  });

  it('prevents colliding original source IDs from merging different property evidence', () => {
    const first = profiles[0]!;
    const second = { ...first, id: 'test-other-building', review: { ...first.review,
      id: 'test-other-building', name: { ko: '별도 단지', en: 'Another building' } } };
    const result = areaDecisionProfile({ ...input, profiles: [first, second, first] })!;
    const originalSource = first.review.sources[0]!;
    expect(result.review.sources.filter(source => source.id.endsWith(`::${originalSource.id}`))).toHaveLength(2);
    expect(result.review.comparisons).toHaveLength(2);
    expect(propertyReviewSchema.safeParse(result.review).success).toBe(true);
  });

  it('keeps five identified priorities and changes the actual area narrative for all personas and languages', () => {
    const profile = areaDecisionProfile(input)!;
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const reports = DECISION_PERSONAS.map(persona => getAreaDecision(profile.review, persona, locale));
      expect(new Set(reports.map(report => report.summary)).size).toBe(3);
      expect(new Set(reports.map(report => report.verdict.label)).size).toBe(3);
      expect(new Set(reports.map(report => report.priorities.map(item => item.evidence?.pointId).join(','))).size).toBe(3);
      for (const report of reports) {
        expect(report.priorities).toHaveLength(5);
        for (const item of [...report.priorities, ...report.pros, ...report.cons, ...report.reversals, ...report.checklist]) {
          expect(item.title).toMatch(/^「[^」]+」/);
          expect(item.evidence?.title).toMatch(/^「[^」]+」/);
          expect(item.sourceIds.every(id => profile.sources[id])).toBe(true);
        }
        expect(report.price.status).toBe('needs-check');
        expect(report.price).not.toHaveProperty('amount');
      }
    }
  });

  it('does not fabricate a regional report for empty or wrong-market examples', () => {
    expect(areaDecisionProfile({ ...input, profiles: [] })).toBeNull();
    expect(areaDecisionProfile({ ...input, market: 'ae-dubai' })).toBeNull();
  });
});
