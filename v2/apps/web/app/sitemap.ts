import 'server-only';

import type { MetadataRoute } from 'next';
import { GUIDES } from '../lib/guide/guide-content';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '../lib/contract-check/evidence-repositories.server';
import { buildContractCheckRouteModel } from '../lib/contract-check/route-model.server';
import { buildNewsIndexModel } from '../lib/news/news-route-model.server';
import { publicCanonical } from '../lib/public-metadata';
import { buildKoreaPublicRouteModel } from '../lib/public-market/route-model.server';
import { buildPublicAreaExploreModel } from '../lib/public-market/area-route-model.server';
import {
  listSignedPricePropertyTypeRoutes,
  signedPricePublicRouteRegistry,
} from '../lib/seo/public-route-registry.server';
import { buildPublicPropertyTypeModel } from '../lib/public-market/property-type-route-model.server';

type SitemapEntry = MetadataRoute.Sitemap[number];

const localizedPairs = Object.freeze([
  Object.freeze({ en: '/kr/seoul/', ko: '/ko/kr/seoul/' }),
  Object.freeze({ en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' }),
  Object.freeze({
    en: '/kr/seoul/check/compare/',
    ko: '/ko/kr/seoul/check/compare/',
  }),
  Object.freeze({ en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/' }),
  Object.freeze({ en: '/kr/seoul/rankings/', ko: '/ko/kr/seoul/rankings/' }),
] as const);

function languageAlternates(path: string): SitemapEntry['alternates'] | undefined {
  const pair = localizedPairs.find(({ en, ko }) => path === en || path === ko);
  if (pair === undefined) return undefined;
  return {
    languages: {
      en: publicCanonical(pair.en),
      ko: publicCanonical(pair.ko),
      'x-default': publicCanonical(pair.en),
    },
  };
}

function validDate(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function latestDate(values: readonly (string | undefined)[]): Date | undefined {
  return values
    .map(validDate)
    .filter((value): value is Date => value !== undefined)
    .sort((left, right) => right.getTime() - left.getTime())[0];
}

function sitemapEntry(
  path: `/${string}`,
  lastModified?: Date,
): SitemapEntry {
  const alternates = languageAlternates(path);
  return {
    url: publicCanonical(path),
    ...(lastModified === undefined ? {} : { lastModified }),
    ...(alternates === undefined ? {} : { alternates }),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const conversionReady = buildContractCheckRouteModel().status === 'ready';
  const koreaEvidence = contractCheckEvidenceRepositoriesFromEnvironment();
  const singleQuoteReady = process.env.VERCEL_ENV !== 'preview'
    && (koreaEvidence.rent !== null || koreaEvidence.sale !== null);
  const singleQuoteLastModified = latestDate([
    koreaEvidence.rent?.getArtifact().generatedAt,
    koreaEvidence.sale?.getArtifact().generatedAt,
  ]);
  let summaryReady = false;
  let summaryLastModified: Date | undefined;
  try {
    const model = buildKoreaPublicRouteModel('seoul');
    if (model?.summary.published === true) {
      summaryReady = true;
      summaryLastModified = validDate(model.source.evidence?.generatedAt);
    }
  } catch {
    // Evidence-dependent routes stay out of the sitemap when validation fails.
  }
  const area = buildPublicAreaExploreModel(undefined);
  const areaLastModified = area.status === 'ready'
    ? validDate(area.source.evidence?.generatedAt)
    : undefined;
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
  const newsLastModified = latestDate(newsRecords.map(
    (record) => record.updatedAt ?? record.publishedAt,
  ));
  const guideLastModified = latestDate(GUIDES.map(
    ({ lastVerified }) => `${lastVerified}T00:00:00.000Z`,
  ));
  const entries: MetadataRoute.Sitemap = [
    sitemapEntry('/markets/'),
    sitemapEntry('/prices/', summaryLastModified),
    sitemapEntry('/news/', newsLastModified),
    sitemapEntry('/community/'),
    sitemapEntry('/guides/', guideLastModified),
    sitemapEntry('/privacy/'),
    sitemapEntry('/contact/'),
  ];
  const modifiedByPath = new Map<string, Date | undefined>([
    ['/kr/seoul/', summaryLastModified],
    ['/ko/kr/seoul/', summaryLastModified],
    ['/kr/seoul/check/', singleQuoteLastModified],
    ['/ko/kr/seoul/check/', singleQuoteLastModified],
    ['/kr/seoul/explore/', areaLastModified],
    ['/ko/kr/seoul/explore/', areaLastModified],
    ['/kr/seoul/rankings/', areaLastModified],
    ['/ko/kr/seoul/rankings/', areaLastModified],
    ['/kr/seoul/news/', newsLastModified],
    ['/kr/seoul/guide/', guideLastModified],
  ]);
  for (const path of paths) {
    entries.push(sitemapEntry(
      path as `/${string}`,
      modifiedByPath.get(path),
    ));
    if (path === '/kr/seoul/news/') {
      entries.push(...newsRecords.map((record) => ({
        url: publicCanonical(`/kr/seoul/news/${record.slug}/`),
        lastModified: new Date(record.updatedAt ?? record.publishedAt),
      })));
    }
    if (path === '/kr/seoul/guide/') {
      entries.push(...GUIDES.map(({ slug, lastVerified }) => ({
        url: publicCanonical(`/kr/seoul/guide/${slug}/`),
        lastModified: new Date(`${lastVerified}T00:00:00.000Z`),
      })));
    }
  }
  if (area.status === 'ready') {
    const publishedDistricts = new Set<string>(area.districts.flatMap((district) => (
      district.summary.published ? [district.slug] : []
    )));
    entries.push(...area.districts.flatMap((district) => district.summary.published
      ? [sitemapEntry(`/kr/seoul/explore/${district.slug}/`, areaLastModified)]
      : []));
    entries.push(...listSignedPricePropertyTypeRoutes().flatMap((route) => {
      const [, , , , district, propertyType] = route.path.split('/');
      if (!publishedDistricts.has(district ?? '')) return [];
      const model = buildPublicPropertyTypeModel(district ?? '', propertyType ?? '');
      return [sitemapEntry(
        route.path as `/${string}`,
        validDate(model?.evidence.generatedAt),
      )];
    }));
  }
  return entries;
}
