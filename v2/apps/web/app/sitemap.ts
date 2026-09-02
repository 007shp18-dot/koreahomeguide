import 'server-only';

import type { MetadataRoute } from 'next';
import { GUIDES } from '../lib/guide/guide-content';
import { buildContractCheckRouteModel } from '../lib/contract-check/route-model.server';
import { buildNewsIndexModel } from '../lib/news/news-route-model.server';
import { publicCanonical } from '../lib/public-metadata';
import { buildKoreaPublicRouteModel } from '../lib/public-market/route-model.server';
import { buildPublicAreaExploreModel } from '../lib/public-market/area-route-model.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import { checkedInSnapshotsAreEnabled } from '../lib/snapshots/installed-snapshot-repository.server';
import {
  listSignedPricePropertyTypeRoutes,
  signedPricePublicRouteRegistry,
} from '../lib/seo/public-route-registry.server';
import { operatorProfileFromEnvironment } from '../lib/operator/operator-profile.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const conversionReady = buildContractCheckRouteModel().status === 'ready';
  const koreaEvidence = koreaEvidenceRepositoriesFromEnvironment({
    useCheckedInSnapshot: checkedInSnapshotsAreEnabled(),
    retainLastVerified: false,
  });
  const singleQuoteReady = process.env.VERCEL_ENV !== 'preview'
    && (koreaEvidence.rent !== null || koreaEvidence.sale !== null);
  let summaryReady = false;
  try {
    if (buildKoreaPublicRouteModel('seoul')?.summary.published === true) {
      summaryReady = true;
    }
  } catch {
    // Evidence-dependent routes stay out of the sitemap when validation fails.
  }
  const area = buildPublicAreaExploreModel(undefined);
  let newsRecords: ReturnType<typeof buildNewsIndexModel>['records'] = [];
  let newsReady = false;
  try {
    newsRecords = buildNewsIndexModel().records;
    newsReady = true;
  } catch {
    // Strict News records stay out if their repository cannot be validated.
  }
  const paths = signedPricePublicRouteRegistry.listSitemapPaths({
    summaryReady,
    areaReady: area.status === 'ready',
    newsReady,
    singleQuoteReady,
    conversionReady,
  });
  const entries: MetadataRoute.Sitemap = [];
  const operatorReady = operatorProfileFromEnvironment().status === 'ready';
  let operatorAdded = false;
  for (const path of paths) {
    if (
      operatorReady
      && !operatorAdded
      && (path === '/kr/seoul/news/' || path === '/kr/seoul/guide/')
    ) {
      entries.push(
        { url: publicCanonical('/privacy/') },
        { url: publicCanonical('/contact/') },
      );
      operatorAdded = true;
    }
    entries.push({ url: publicCanonical(path as `/${string}`) });
    if (path === '/ko/kr/seoul/rankings/' && area.status === 'ready') {
      const publishedDistricts = new Set<string>(area.districts.flatMap((district) => (
        district.summary.published ? [district.slug] : []
      )));
      entries.push(...area.districts.flatMap((district) => district.summary.published
        ? [{ url: publicCanonical(`/kr/seoul/explore/${district.slug}/`) }]
        : []));
      entries.push(...listSignedPricePropertyTypeRoutes().flatMap((route) => (
        publishedDistricts.has(route.path.split('/')[4] ?? '')
          ? [{ url: publicCanonical(route.path as `/${string}`) }]
          : []
      )));
    }
    if (path === '/kr/seoul/news/') {
      entries.push(...newsRecords.map((record) => ({
        url: publicCanonical(`/kr/seoul/news/${record.slug}/`),
        lastModified: new Date(record.updatedAt ?? record.publishedAt),
      })));
    }
    if (path === '/kr/seoul/guide/') {
      entries.push(...GUIDES.map(({ slug }) => ({
        url: publicCanonical(`/kr/seoul/guide/${slug}/`),
      })));
    }
  }
  return entries;
}
