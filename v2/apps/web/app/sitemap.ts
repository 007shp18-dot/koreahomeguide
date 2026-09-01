import 'server-only';

import type { MetadataRoute } from 'next';
import { GUIDES } from '../lib/guide/guide-content';
import { buildNewsIndexModel } from '../lib/news/news-route-model.server';
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
      paths.push('/kr/', '/kr/check/seoul/');
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
  const entries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: publicCanonical(path),
  }));
  try {
    const news = buildNewsIndexModel();
    entries.push({ url: publicCanonical('/kr/seoul/news/') });
    entries.push(...news.records.map((record) => ({
      url: publicCanonical(`/kr/seoul/news/${record.slug}/`),
      lastModified: new Date(record.updatedAt ?? record.publishedAt),
    })));
  } catch {
    // Strict News records stay out if their repository cannot be validated.
  }
  entries.push(
    { url: publicCanonical('/kr/seoul/guide/') },
    ...GUIDES.map(({ slug }) => ({
      url: publicCanonical(`/kr/seoul/guide/${slug}/`),
    })),
  );
  return entries;
}
