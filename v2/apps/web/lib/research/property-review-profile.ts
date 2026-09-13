import 'server-only';
import seoul from '../../content/property-reviews/seoul.json';
import singapore from '../../content/property-reviews/singapore.json';
import dubai from '../../content/property-reviews/dubai.json';
import tokyo from '../../content/property-reviews/tokyo.json';
import type { LivingContext } from './living-context';
import { propertyReviewSchema, type PropertyReview } from './property-review';
import { reviewLocation } from './property-review-locations';

export type ReviewedPropertyProfile = LivingContext & { review: PropertyReview };
export type PropertyReviewDirectoryEntry = Pick<PropertyReview, 'id' | 'marketId' | 'name' | 'area'>;

const reviews = [...seoul, ...singapore, ...dubai, ...tokyo].map(review => propertyReviewSchema.parse(review));

function toProfile(review: PropertyReview): ReviewedPropertyProfile {
  return {
    id: review.id,
    market_id: review.marketId,
    name_ko: review.name.ko,
    canonical_name: review.name.en,
    area: review.area.en,
    headline: review.verdict.en,
    checked_on: review.checkedOn,
    identity_note: 'Named property research; no anonymous transaction is assigned to an individual building.',
    publication_status: 'published',
    linked_entity_ids: reviewLocation(review.id)?.entityIds ?? [],
    facts: [],
    analysis: [],
    field_checks: [],
    sources: Object.fromEntries(review.sources.map(source => [source.id, {
      title: source.title, url: source.url, scope: source.note.en, checked_on: source.checkedOn,
    }])),
    review,
  };
}

export function propertyReviewProfile(id: string): ReviewedPropertyProfile | undefined {
  const review = reviews.find(candidate => candidate.id === id);
  return review ? toProfile(review) : undefined;
}

export function propertyReviewProfilesForMarket(market: PropertyReview['marketId']): ReviewedPropertyProfile[] {
  return reviews.filter(review => review.marketId === market && reviewLocation(review.id)).map(toProfile);
}

/** Pass only identity fields across the Explore client boundary. */
export function propertyReviewDirectoryEntries(market: PropertyReview['marketId']): PropertyReviewDirectoryEntry[] {
  return reviews.filter(review => review.marketId === market && reviewLocation(review.id))
    .map(({ id, marketId, name, area }) => ({ id, marketId, name, area }));
}
