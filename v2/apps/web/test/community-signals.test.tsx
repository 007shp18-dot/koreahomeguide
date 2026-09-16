import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import seoul from '../content/property-reviews/seoul.json';
import { propertyReviewSchema, type PropertyReview } from '../lib/research/property-review';
import { allReviewLocations } from '../lib/research/property-review-locations';
import { getCommunityDiscussions, communityEvidenceRecords, communitySignalSchema, getCommunitySignals, selectCommunitySignals, type CommunitySignal } from '../lib/research/community-signals';
import { PropertyDecisionReport } from '../components/market-ui/property-decision-report';

const helio = propertyReviewSchema.parse(seoul.find(review => review.id === 'kr-helio-city'));
const translated = { ko: '등교와 출근이 겹치는 시간에 출입구를 보세요.', en: 'Visit the gate when the school run overlaps with commuting.', 'zh-CN': '在上学与通勤重叠的时段观察出入口。' };
function signal(id: string, overrides: Partial<CommunitySignal> = {}): CommunitySignal {
  return { id, marketId: 'kr-seoul', profileIds: [helio.id], areaKeys: [], personas: ['family'],
    title: translated, body: translated, visitQuestion: translated,
    evidenceKind: 'community-anecdote', mappingScope: 'named-property',
    sources: [{ url: 'https://example.com/public-discussion', title: 'A test discussion', publishedOn: null,
      inspectedOn: '2026-09-14', context: 'Synthetic fixture for selection tests, not a published research observation.', scope: 'public-discussion' }],
    ...overrides };
}

describe('community experience remains scoped evidence for viewing questions', () => {
  it('does not import another property, market or persona’s anecdote into the report', () => {
    const exact = signal('helio-school-route');
    const otherProperty = signal('different-estate', { profileIds: ['kr-parkrio'] });
    const otherPersona = signal('rental-condition', { personas: ['investor'] });
    const otherMarket = signal('other-market', { marketId: 'sg-singapore', profileIds: ['sg-the-interlace'] });
    expect(selectCommunitySignals([otherProperty, otherPersona, otherMarket, exact], helio, 'family').map(item => item.id)).toEqual([exact.id]);
    const uncovered = { ...helio, id: 'kr-unreviewed-property' };
    expect(selectCommunitySignals([exact], uncovered, 'family')).toEqual([]);
  });

  it('uses exact namespaced property examples for areas without broad locality substring matching', () => {
    const area: PropertyReview = { ...helio, id: 'area-kr-seoul-11710:Garak',
      sources: helio.sources.map(source => ({ ...source, id: `${helio.id}::${source.id}` })) };
    const exact = signal('same-named-example');
    const districtOnly = signal('ward-only', { profileIds: [], areaKeys: ['11710'] });
    const similarName = signal('similar-place-name', { profileIds: [], areaKeys: ['11710:Garakbon'] });
    const exactArea = signal('exact-area', { profileIds: [], areaKeys: ['11710:Garak'] });
    expect(selectCommunitySignals([districtOnly, similarName, exactArea, exact], area, 'family', 'area').map(item => item.id)).toEqual([exact.id, exactArea.id]);
    expect(selectCommunitySignals([exactArea], helio, 'family', 'property')).toEqual([]);
  });

  it('prefers more specific supported scopes, caps at three and never fills a gap with a generic claim', () => {
    const broad = signal('two-estates', { profileIds: [helio.id, 'kr-parkrio'] });
    const exact = ['one', 'two', 'three', 'four'].map(id => signal(id));
    expect(selectCommunitySignals([broad, ...exact], helio, 'family').map(item => item.id)).toEqual(['one', 'two', 'three']);
    expect(selectCommunitySignals([exact[0]!, exact[0]!], helio, 'family')).toHaveLength(1);
    expect(selectCommunitySignals([], helio, 'family')).toEqual([]);
    const comparison = signal('adjacent-place', { mappingScope: 'comparable-setting' });
    const area = signal('area-experience', { mappingScope: 'area-context' });
    expect(selectCommunitySignals([comparison, area, broad], helio, 'family').map(item => item.id)).toEqual([broad.id, area.id, comparison.id]);
  });

  it('requires traceable inspected source records and rejects cross-market mappings', () => {
    expect(communitySignalSchema.safeParse(signal('valid')).success).toBe(true);
    expect(communitySignalSchema.safeParse(signal('no-evidence', { sources: [] })).success).toBe(false);
    expect(communitySignalSchema.safeParse(signal('unmapped', { profileIds: [], areaKeys: [] })).success).toBe(false);
    expect(communitySignalSchema.safeParse(signal('cross-market', { profileIds: ['jp-brillia-towers-meguro'] })).success).toBe(false);
    expect(communitySignalSchema.safeParse(signal('made-up-id', { profileIds: ['kr-fake-property'] })).success).toBe(false);
    expect(communitySignalSchema.safeParse({ ...signal('missing-applicability'), mappingScope: undefined }).success).toBe(false);
    expect(communitySignalSchema.safeParse({ ...signal('false-kind'), evidenceKind: 'documented' }).success).toBe(false);
    const future = signal('future-source');
    future.sources[0]!.publishedOn = '2026-09-15';
    expect(communitySignalSchema.safeParse(future).success).toBe(false);
    future.sources[0]!.publishedOn = '2026-02-30';
    expect(communitySignalSchema.safeParse(future).success).toBe(false);
  });

  it('validates the published mapping and keeps private verification notes out of localized report copy', () => {
    const knownProfiles = new Set(allReviewLocations().map(location => location.reviewId));
    for (const record of communityEvidenceRecords()) {
      expect(communitySignalSchema.safeParse(record).success).toBe(true);
      expect(record.profileIds.every(id => knownProfiles.has(id))).toBe(true);
      for (const locale of ['en', 'ko', 'zh-CN'] as const) {
        expect(record.title[locale].trim()).not.toBe('');
        expect(record.body[locale].trim()).not.toBe('');
        expect(record.visitQuestion[locale].trim()).not.toBe('');
        expect(record.body[locale]).not.toMatch(/https?:\/\//);
      }
      expect(record.body.en).not.toMatch(/[가-힣]/);
      expect(record.body['zh-CN']).toMatch(/[\u4e00-\u9fff]/);
    }
    for (const check of getCommunitySignals(helio, 'family', 'en')) {
      expect(check.evidenceKind).toBe('community-anecdote');
      expect(check).not.toHaveProperty('sources');
      expect(check).not.toHaveProperty('score');
    }
  });

  it('renders inspected accounts and dates without external community links without claiming a resident survey', () => {
    const html = renderToStaticMarkup(createElement(PropertyDecisionReport, { review: helio, locale: 'en', persona: 'family', onPersonaChange: () => {} }));
    const records = getCommunityDiscussions(helio, 'en');
    expect(records.length).toBeGreaterThan(0);
    expect(html).toContain('data-community-discussion');
    expect(html).toContain('data-community-scope="named-property"');
    expect(html).not.toContain(records[0]!.sources[0]!.url.replaceAll('&', '&amp;'));
    expect(records.every(record => record.mappingScope === 'named-property')).toBe(true);
    expect(html).toContain('2026-09-14');
    expect(html).not.toContain('Recurring observations in reviews');
    expect(html).not.toContain('reviewers agreed');
    expect(html).toContain('data-document-checks');
    const uncovered = getCommunityDiscussions({ ...helio, id: 'kr-unreviewed-property' }, 'en');
    expect(uncovered).toEqual([]);
  });

  it('keeps direct and area accounts separate in every city and exposes no researcher notes', () => {
    for (const city of ['seoul', 'singapore', 'dubai', 'tokyo']) {
      const rows = communityEvidenceRecords().filter(row => row.marketId.endsWith(city));
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every(row => row.reaction?.en && row.reaction?.ko)).toBe(true);
      for (const row of rows) {
        const review = { ...helio, id: row.profileIds[0] ?? helio.id, marketId: row.marketId };
        const cards = getCommunityDiscussions(review, 'en');
        expect(cards.length).toBeLessThanOrEqual(6);
        expect(cards.every(card => card.mappingScope !== 'comparable-setting')).toBe(true);
        for (const card of cards) for (const source of card.sources) expect(source).not.toHaveProperty('context');
        expect(new Set(cards.map(card => card.id)).size).toBe(cards.length);
      }
    }
  });
});
