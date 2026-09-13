import { describe, it, expect } from 'vitest';
import { projectLivingContext, selectLivingContexts } from '../lib/research/living-context';

const metadata = { schema_version: 'property-context-v1', profile: {
  id: 'test', market_id: 'kr-seoul', name_ko: '시험 단지', canonical_name: 'Test', area: 'Seoul',
  headline: '생활권', checked_on: '2026-09-13', identity_note: '단지군',
  publication_status: 'published', linked_entity_ids: ['kr-seoul:estate:exact'],
  facts: [{ id: 'f1', text: '계획 시설', status: 'planned', source_ids: ['s'] }],
  analysis: [{ dimension: '상권', interpretation: '검토 의견', basis_fact_ids: ['f1'] }],
  field_checks: ['영업 확인'], measurements: { footfall: null }, internal_secret: 'never public',
}, sources: { s: { title: '공식', url: 'https://example.com/', scope: '개발계획', checked_on: '2026-09-13' } } };
describe('living context publication boundary', () => {
  const text = { ko: '확인한 근거', en: 'Documented evidence' };
  const point = { title: text, body: text, sourceIds: ['station'], status: 'documented' };
  const review = {
    id: 'test', marketId: 'kr-seoul', name: text, area: text, checkedOn: '2026-09-13',
    verdict: text, summary: text, bestFor: text, holdFor: text,
    strengths: [point], tradeoffs: [point],
    sections: { transport: [point], schools: [point], daily: [point], costs: [point] },
    comparisons: [], sources: [{ id: 'station', title: 'Station', url: 'https://example.com/station', checkedOn: '2026-09-13', publishedOn: null, kind: 'official', note: text }],
  };
  it('publishes both languages of a verified review without internal authoring fields', () => {
    const result = projectLivingContext({ ...metadata, profile: { ...metadata.profile, review: { ...review, authorToken: 'private' } } });
    expect(result).toHaveProperty('review.verdict.en', 'Documented evidence');
    expect(result).toHaveProperty('review.verdict.ko', '확인한 근거');
    expect(result).not.toHaveProperty('review.authorToken');
  });
  it('rejects reviews with a mismatched identity, missing translation or broken evidence link', () => {
    for (const candidate of [
      { ...review, id: 'another-property' },
      { ...review, verdict: { ko: '한글만' } },
      { ...review, strengths: [{ ...point, sourceIds: ['missing'] }] },
    ]) expect(projectLivingContext({ ...metadata, profile: { ...metadata.profile, review: candidate } })).toBeNull();
  });
  it('rejects unpublished and malformed records', () => {
    expect(projectLivingContext({ ...metadata, profile: { ...metadata.profile, publication_status: 'internal_review' } })).toBeNull();
    expect(projectLivingContext({})).toBeNull();
  });
  it('preserves planned status and missing measurements without publishing internal fields', () => {
    const result = projectLivingContext(metadata)!;
    expect(result.facts[0]?.status).toBe('planned');
    expect(result).not.toHaveProperty('internal_secret');
    expect(result).not.toHaveProperty('measurements');
  });
  it('links only exact entity identifiers, never names or substrings', () => {
    const result = projectLivingContext(metadata)!;
    expect(selectLivingContexts([result], 'kr-seoul:estate:exact')).toHaveLength(1);
    expect(selectLivingContexts([result], 'exact')).toEqual([]);
    expect(selectLivingContexts([result], '시험 단지')).toEqual([]);
  });
  it('rejects unsafe source URLs and broken fact references', () => {
    expect(projectLivingContext({ ...metadata, sources: { s: { ...metadata.sources.s, url: 'javascript:alert(1)' } } })).toBeNull();
    expect(projectLivingContext({ ...metadata, profile: { ...metadata.profile, facts: [{ ...metadata.profile.facts[0], source_ids: ['missing'] }] } })).toBeNull();
  });
});
