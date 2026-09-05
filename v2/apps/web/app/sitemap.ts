import 'server-only';

import type { MetadataRoute } from 'next';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { PUBLIC_POLICY_RECORDS } from '../lib/policy/policy-repository.server';
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
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import { listIndexableKoreaBuildingRouteParams } from '../lib/public-market/korea-building-index-policy';

type SitemapEntry = MetadataRoute.Sitemap[number];
type LocalizedPair = Readonly<{
  en: `/${string}`;
  ko?: `/${string}`;
  'zh-Hans'?: `/${string}`;
}>;

const editorialLocalizedPairs: readonly LocalizedPair[] = Object.freeze(EDITORIAL_PORTFOLIO.flatMap((record) => {
  if (record.translationGroupId === null) return [];
  const group = EDITORIAL_PORTFOLIO.filter(({ translationGroupId }) => translationGroupId === record.translationGroupId);
  if (group[0]?.id !== record.id) return [];
  const en = group.find(({ locale }) => locale === 'en');
  const zh = group.find(({ locale }) => locale === 'zh-CN');
  return en === undefined || zh === undefined ? [] : [Object.freeze({
    en: en.canonicalHref as `/${string}`,
    'zh-Hans': zh.canonicalHref as `/${string}`,
  })];
}));

const localizedPairs: readonly LocalizedPair[] = Object.freeze([
  Object.freeze({ en: '/', 'zh-Hans': '/zh-cn/kr/seoul/' }),
  Object.freeze({ en: '/news/', 'zh-Hans': '/zh-cn/news/' }),
  Object.freeze({ en: '/guides/', 'zh-Hans': '/zh-cn/guides/' }),
  Object.freeze({ en: '/kr/seoul/', ko: '/ko/kr/seoul/' }),
  Object.freeze({ en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' }),
  Object.freeze({
    en: '/kr/seoul/check/compare/',
    ko: '/ko/kr/seoul/check/compare/',
  }),
  Object.freeze({ en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/' }),
  Object.freeze({ en: '/kr/seoul/rankings/', ko: '/ko/kr/seoul/rankings/' }),
  ...editorialLocalizedPairs,
] as const);

function languageAlternates(path: string): SitemapEntry['alternates'] | undefined {
  const pair = localizedPairs.find((candidate) => (
    path === candidate.en || path === candidate.ko || path === candidate['zh-Hans']
  ));
  if (pair === undefined) return undefined;
  return {
    languages: {
      en: publicCanonical(pair.en),
      ...(pair.ko === undefined ? {} : { ko: publicCanonical(pair.ko) }),
      ...(pair['zh-Hans'] === undefined ? {} : {
        'zh-Hans': publicCanonical(pair['zh-Hans']),
      }),
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
  const guideLastModified = latestDate(EDITORIAL_PORTFOLIO
    .filter(({ type }) => type === 'guide')
    .map(({ updatedAt }) => updatedAt));
  const entries: MetadataRoute.Sitemap = [
    sitemapEntry('/markets/'),
    sitemapEntry('/prices/', summaryLastModified),
    sitemapEntry('/news/', latestDate([
      newsLastModified?.toISOString(),
      ...EDITORIAL_PORTFOLIO.filter(({ type }) => type !== 'guide').map(({ updatedAt }) => updatedAt),
      ...PUBLIC_POLICY_RECORDS.map(({ lastCheckedOn }) => `${lastCheckedOn}T00:00:00.000Z`),
    ])),
    sitemapEntry('/news/policy/', latestDate(PUBLIC_POLICY_RECORDS.map(
      ({ lastCheckedOn }) => `${lastCheckedOn}T00:00:00.000Z`,
    ))),
    sitemapEntry('/zh-cn/news/', latestDate(EDITORIAL_PORTFOLIO
      .filter(({ locale, type }) => locale === 'zh-CN' && type !== 'guide')
      .map(({ updatedAt }) => updatedAt))),
    sitemapEntry('/zh-cn/guides/', latestDate(EDITORIAL_PORTFOLIO
      .filter(({ locale, type }) => locale === 'zh-CN' && type === 'guide')
      .map(({ updatedAt }) => updatedAt))),
    sitemapEntry('/zh-cn/kr/seoul/'),
    sitemapEntry('/community/'),
    sitemapEntry('/guides/', guideLastModified),
    sitemapEntry('/privacy/'),
    sitemapEntry('/contact/'),
    sitemapEntry('/sg/'),
    sitemapEntry('/sg/singapore/explore/'),
    sitemapEntry('/sg/singapore/explore/ccr/'),
    sitemapEntry('/sg/singapore/explore/rcr/'),
    sitemapEntry('/sg/singapore/explore/ocr/'),
  ];
  entries.push(...EDITORIAL_PORTFOLIO.map((article) => sitemapEntry(
    article.canonicalHref as `/${string}`,
    new Date(article.updatedAt),
  )));
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
  // Building pages carry the same gate the route's own metadata applies, so a
  // URL is never offered here that answers `noindex` when it is crawled.
  const rentEvidence = koreaEvidenceRepositoriesFromEnvironment().rent;
  if (rentEvidence !== null) {
    const buildingLastModified = validDate(rentEvidence.getArtifact().generatedAt);
    entries.push(...listIndexableKoreaBuildingRouteParams(rentEvidence.listBuildingRecords())
      .map(({ district, buildingId }) => sitemapEntry(
        `/kr/seoul/explore/${district}/${buildingId}/`,
        buildingLastModified,
      )));
  }
  return entries;
}
