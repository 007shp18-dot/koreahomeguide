import 'server-only';

import {
  SEOUL_RENT_CHECK_DISTRICTS,
} from '@signedprice/korea-rent/browser';

import {
  buildIntentPageModel,
  publicIntentRouteParams,
  type IntentPageModel,
} from '../route-model';
import {
  buildPublicDistrictModel,
} from './area-route-model.server';
import type { PublicDistrictModel } from './area-route-types';

export type PublicThirdSegmentModel =
  | Readonly<{ kind: 'intent'; model: IntentPageModel }>
  | Readonly<{ kind: 'district'; model: PublicDistrictModel }>;

const districtRouteParams = SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => Object.freeze({
  country: 'kr' as const,
  city: 'seoul' as const,
  intent: slug,
}));

export const publicThirdSegmentRouteParams = Object.freeze([
  ...publicIntentRouteParams,
  ...districtRouteParams,
]);

export function resolvePublicThirdSegment(
  country: string,
  city: string,
  segment: string,
): PublicThirdSegmentModel | null {
  const intentModel = buildIntentPageModel(country, city, segment);
  if (intentModel !== undefined) {
    return Object.freeze({ kind: 'intent', model: intentModel });
  }
  if (country !== 'kr' || city !== 'seoul') return null;
  const model = buildPublicDistrictModel(segment);
  return model === null ? null : Object.freeze({ kind: 'district', model });
}
