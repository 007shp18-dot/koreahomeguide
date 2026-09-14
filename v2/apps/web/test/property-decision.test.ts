import { describe, expect, it } from 'vitest';
import seoul from '../content/property-reviews/seoul.json';
import singapore from '../content/property-reviews/singapore.json';
import dubai from '../content/property-reviews/dubai.json';
import tokyo from '../content/property-reviews/tokyo.json';
import { propertyReviewSchema, type PropertyReview } from '../lib/research/property-review';
import { DECISION_PERSONAS, getPropertyDecision, type DecisionItem } from '../lib/research/property-decision';

const reviews = [...seoul, ...singapore, ...dubai, ...tokyo].map(value => propertyReviewSchema.parse(value));
const byId = (id: string) => reviews.find(review => review.id === id)!;
const evidencePoint = (review: PropertyReview, item: DecisionItem) => {
  const [section, index] = item.evidence!.pointId.split(':');
  const points = section === 'strengths' || section === 'tradeoffs' ? review[section] : review.sections[section as keyof PropertyReview['sections']];
  return points[Number(index)]!;
};

describe('property decisions preserve the boundary between evidence and interpretation', () => {
  it('keeps every priority tied to its exact profile evidence, without inventing numerical ratings', () => {
    expect(reviews).toHaveLength(100);
    for (const review of reviews) {
      const before = JSON.stringify(review);
      const sourceIds = new Set(review.sources.map(source => source.id));
      for (const persona of DECISION_PERSONAS) {
        const report = getPropertyDecision(review, persona, 'en');
        expect(report.priorities).toHaveLength(5);
        expect(new Set(report.priorities.map(item => item.evidence?.pointId)).size).toBe(5);
        expect(report.checkedOn).toBe(review.checkedOn);
        for (const item of [...report.priorities, ...report.pros, ...report.cons, report.price, ...report.reversals, ...report.checklist]) {
          expect(item.sourceIds.length).toBeGreaterThan(0);
          expect(item.sourceIds.every(id => sourceIds.has(id))).toBe(true);
          expect(item.status).not.toBe('documented');
          if (item.evidence) {
            const point = evidencePoint(review, item);
            expect(item.evidence.status).toBe(point.status);
            expect(item.evidence.title).toBe(point.title.en);
          }
        }
        expect(report).not.toHaveProperty('score');
        expect(report).not.toHaveProperty('fairValue');
        expect(report).not.toHaveProperty('yield');
        expect(report.price.status).toBe('needs-check');
        for (const item of report.pros) expect(evidencePoint(review, item).status).not.toBe('needs-check');
      }
      expect(JSON.stringify(review)).toBe(before);
    }
  });

  it('changes the actual decision narrative and selected priorities for all three personas', () => {
    for (const review of reviews) {
      const reports = DECISION_PERSONAS.map(persona => getPropertyDecision(review, persona, 'ko'));
      expect(new Set(reports.map(report => report.verdict.label)).size).toBe(3);
      expect(new Set(reports.map(report => report.summary)).size).toBe(3);
      expect(new Set(reports.map(report => report.priorities.map(item => item.evidence?.pointId).join(','))).size).toBe(3);
      expect(new Set(reports.map(report => JSON.stringify(report.pros))).size).toBe(3);
      expect(new Set(reports.map(report => JSON.stringify(report.cons))).size).toBe(3);
      expect(new Set(reports.map(report => JSON.stringify(report.checklist))).size).toBe(3);
    }
  });

  it('keeps actual evidence and its qualifications in the body rather than showing five generic instructions', () => {
    const helio = getPropertyDecision(byId('kr-helio-city'), 'family', 'ko');
    expect(helio.priorities.some(item => item.body.includes('해누리'))).toBe(true);
    // The undated classroom size must not be surfaced without its qualification.
    for (const item of helio.priorities) {
      if (item.body.includes('846')) expect(item.body).toContain('통계 적용 연도');
    }
    const meguro = getPropertyDecision(byId('jp-brillia-towers-meguro'), 'investor', 'en');
    expect(meguro.priorities.some(item => `${item.title} ${item.body}`.includes('North') && `${item.title} ${item.body}`.includes('South'))).toBe(true);
    expect(meguro.price.body).toContain('Anonymous area sales');
    expect(meguro.price.body).toContain('do not identify completed sales in this building');
  });

  it('distinguishes local conditions instead of applying a fixed six-factor checklist', () => {
    const shibuya = getPropertyDecision(byId('jp-park-court-shibuya'), 'investor', 'en');
    expect(shibuya.priorities.some(item => /lease|demolition/i.test(item.title))).toBe(true);
    const skyflame = getPropertyDecision(byId('ae-skyflame-1'), 'investor', 'en');
    expect(skyflame.priorities.some(item => /instalment/i.test(item.title))).toBe(true);
    const riche = getPropertyDecision(byId('kr-banpo-riche'), 'family', 'ko');
    expect(riche.priorities.some(item => /서원|원촌/.test(item.body))).toBe(true);
    expect(riche.priorities.map(item => item.title)).not.toEqual(shibuya.priorities.map(item => item.title));
  });

  it('provides genuinely Chinese authored summaries and controls without an unlabelled English paragraph fallback', () => {
    for (const review of reviews) {
      for (const persona of DECISION_PERSONAS) {
        const report = getPropertyDecision(review, persona, 'zh-CN');
        expect(report.summary).toMatch(/[\u4e00-\u9fff]/);
        expect(report.summary).not.toMatch(/[가-힣]/);
        expect(report.summary).not.toBe(getPropertyDecision(review, persona, 'en').summary);
        for (const item of [...report.priorities, ...report.pros, ...report.cons, report.price, ...report.checklist]) {
          expect(item.title).toMatch(/[\u4e00-\u9fff]/);
          expect(item.body).toMatch(/[\u4e00-\u9fff]/);
          expect(item.body).not.toMatch(/[가-힣]/);
          expect(item.originalLanguage).toBeUndefined();
        }
      }
    }
  });
});
