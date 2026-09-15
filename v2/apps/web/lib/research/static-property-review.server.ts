import 'server-only';
import singapore from '../../content/property-reviews/singapore.json';
import seoul from '../../content/property-reviews/seoul.json';
import { reviewLocationForEntity } from './property-review-locations';
import { propertyReviewSchema } from './property-review';
import { withPropertyEditorial } from './property-editorial';

/** Authored, source-linked evidence already checked into the repository. No database or LLM call. */
export function staticSeoulReview(entity: string) {
  const location = reviewLocationForEntity(entity);
  if (!location) return undefined;
  const review = seoul.find(item => item.id === location.reviewId);
  return review ? withPropertyEditorial(propertyReviewSchema.parse(review)) : undefined;
}

/** Resolve only a matching Singapore project; never substitute another property's copy. */
export function staticSingaporeReview(entity: string) {
  const location = reviewLocationForEntity(entity);
  if (!location) return undefined;
  const review = singapore.find(item => item.id === location.reviewId);
  return review ? withPropertyEditorial(propertyReviewSchema.parse(review)) : undefined;
}
