import 'server-only';

import type { MetadataRoute } from 'next';
import { GUIDES } from '../lib/guide/guide-content';
import { publicCanonical } from '../lib/public-metadata';
import { buildKoreaPublicRouteModel } from '../lib/public-market/route-model.server';
import { buildPublicAreaExploreModel } from '../lib/public-market/area-route-model.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: `/${string}`[] = [
    '/',
    '/compare/',
    '/trust/',
  ];
  try {
    if (buildKoreaPublicRouteModel('seoul')?.summary.published === true) {
      paths.push('/kr/', '/kr/check/seoul/', '/kr/seoul/');
    }
  } catch {
    // Evidence-dependent routes stay out of the sitemap when validation fails.
  }
  const area = buildPublicAreaExploreModel(undefined);
  if (area.status === 'ready') {
    paths.push('/kr/seoul/explore/', '/kr/seoul/rankings/');
    paths.push(...area.districts.flatMap((district) => district.summary.published
      ? [`/kr/seoul/explore/${district.slug}/` as const]
      : []));
  }
  paths.push(
    '/kr/seoul/guide/',
    ...GUIDES.map(({ slug }) => `/kr/seoul/guide/${slug}/` as const),
  );
  return paths.map((path) => ({ url: publicCanonical(path) }));
}
