import 'server-only';

import type { MetadataRoute } from 'next';

import {
  buildKoreaPublicRouteModel,
  koreaPublishedSitemapUrls,
} from '../lib/public-market/route-model.server';
import { PublicSummaryUnavailableError } from '../lib/public-market/summary-repository.server';

export default function sitemap(): MetadataRoute.Sitemap {
  try {
    const model = buildKoreaPublicRouteModel('seoul');
    if (model === null) return [];
    return koreaPublishedSitemapUrls(model).map((url) => ({ url }));
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) return [];
    throw error;
  }
}
