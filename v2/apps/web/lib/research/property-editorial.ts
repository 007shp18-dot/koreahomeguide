import { createHash } from 'node:crypto';
import seoul from '../../content/property-reviews/seoul-editorial.json';
import singapore from '../../content/property-reviews/singapore-editorial.json';
import dubai from '../../content/property-reviews/dubai-editorial.json';
import tokyo from '../../content/property-reviews/tokyo-editorial.json';
import seoulProse from '../../content/property-reviews/seoul.json';
import singaporeProse from '../../content/property-reviews/singapore.json';
import dubaiProse from '../../content/property-reviews/dubai.json';
import tokyoProse from '../../content/property-reviews/tokyo.json';
import baselines from '../../content/property-reviews/property-prose-baselines.json';
import { propertyEditorialSchema, type PropertyReview } from './property-review';

// A prose revision, not a new source-data observation. The original evidence,
// rights checks, identity and source check dates remain unchanged.
const editions = new Map(Object.entries({ ...seoul, ...singapore, ...dubai, ...tokyo })
  .map(([id, editorial]) => [id, propertyEditorialSchema.parse({ ...editorial, revisedOn: '2026-09-15' })]));

export function propertyEditorial(id: string) { return editions.get(id); }
const prose = new Map([...seoulProse, ...singaporeProse, ...dubaiProse, ...tokyoProse].map(review => [review.id, review]));
const originalEvidence: Record<string, { sources: string; points: Record<string, string> }> = baselines;
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function withReaderProse(review: PropertyReview): PropertyReview {
  const revision = prose.get(review.id);
  const baseline = originalEvidence[review.id];
  if (!revision || !baseline || revision.checkedOn !== review.checkedOn
    || digest(review.sources.map(source => [source.id, source.url, source.checkedOn])) !== baseline.sources) return review;
  const revise = (point: PropertyReview['strengths'][number], key: string, edited?: typeof revision.strengths[number]) => {
    if (!edited) return point;
    const fingerprint = (value: typeof point | typeof edited) => digest([value.title.en, value.body.en, value.status, value.sourceIds]);
    const current = fingerprint(point);
    return current === baseline.points[key] || current === fingerprint(edited)
      ? { ...point, title: { ...edited.title }, body: { ...edited.body } }
      : point;
  };
  return {
    ...review,
    strengths: review.strengths.map((point, i) => revise(point, `strengths:${i}`, revision.strengths[i])),
    tradeoffs: review.tradeoffs.map((point, i) => revise(point, `tradeoffs:${i}`, revision.tradeoffs[i])),
    sections: {
      transport: review.sections.transport.map((point, i) => revise(point, `transport:${i}`, revision.sections.transport[i])),
      schools: review.sections.schools.map((point, i) => revise(point, `schools:${i}`, revision.sections.schools[i])),
      daily: review.sections.daily.map((point, i) => revise(point, `daily:${i}`, revision.sections.daily[i])),
      costs: review.sections.costs.map((point, i) => revise(point, `costs:${i}`, revision.sections.costs[i])),
    },
  };
}

export function withPropertyEditorial(review: PropertyReview): PropertyReview {
  review = withReaderProse(review);
  if (review.id === 'kr-banpo-xi') {
    review = { ...review, sources: review.sources.filter(source => source.id !== 'waterplay'), sections: { ...review.sections, daily: review.sections.daily.filter(point => !point.sourceIds.includes('waterplay')) } };
  }
  const editorial = propertyEditorial(review.id);
  return editorial ? {
    ...review, editorial, verdict: editorial.headline,
    summary: { ko: editorial.paragraphs.ko[0]!, en: editorial.paragraphs.en[0]! },
  } : review;
}
