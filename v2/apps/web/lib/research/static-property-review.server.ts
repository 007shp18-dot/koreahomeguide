import 'server-only';
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
