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
