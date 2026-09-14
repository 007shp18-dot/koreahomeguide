import seoul from '../../content/property-reviews/seoul-editorial.json';
import singapore from '../../content/property-reviews/singapore-editorial.json';
import dubai from '../../content/property-reviews/dubai-editorial.json';
import tokyo from '../../content/property-reviews/tokyo-editorial.json';
import { propertyEditorialSchema, type PropertyReview } from './property-review';

// A prose revision, not a new source-data observation. The original evidence,
// rights checks, identity and source check dates remain unchanged.
const editions = new Map(Object.entries({ ...seoul, ...singapore, ...dubai, ...tokyo })
  .map(([id, editorial]) => [id, propertyEditorialSchema.parse({ ...editorial, revisedOn: '2026-09-14' })]));

export function propertyEditorial(id: string) { return editions.get(id); }
export function withPropertyEditorial(review: PropertyReview): PropertyReview {
  const editorial = propertyEditorial(review.id);
  return editorial ? {
    ...review, editorial, verdict: editorial.headline,
    summary: { ko: editorial.paragraphs.ko[0]!, en: editorial.paragraphs.en[0]! },
  } : review;
}
