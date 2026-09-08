import 'server-only';

import type { MetadataRoute } from 'next';
import { CITY_STORIES, cityStoryHref } from '../content/city-stories';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { PUBLIC_POLICY_RECORDS } from '../lib/policy/policy-repository.server';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '../lib/contract-check/evidence-repositories.server';
import { buildContractCheckRouteModel } from '../lib/contract-check/route-model.server';
import { buildNewsIndexModel } from '../lib/news/news-route-model.server';
import { publicCanonical } from '../lib/public-metadata';
import { dubaiEvidenceRepositoryFromEnvironment } from '../lib/dubai/evidence-repository.server';
import { buildKoreaPublicRouteModel } from '../lib/public-market/route-model.server';
import { buildPublicAreaExploreModel } from '../lib/public-market/area-route-model.server';
import {
  listSignedPricePropertyTypeRoutes,
  signedPricePublicRouteRegistry,
} from '../lib/seo/public-route-registry.server';
import { buildPublicPropertyTypeModel } from '../lib/public-market/property-type-route-model.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import {
  listIndexableKoreaBuildingRouteParams,
  listIndexableKoreaNeighborhoodRouteParams,
} from '../lib/public-market/korea-building-index-policy';

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
  const ko = group.find(({ locale }) => locale === 'ko');
  return en === undefined || (zh === undefined && ko === undefined) ? [] : [Object.freeze({
    en: en.canonicalHref as `/${string}`,
    ...(zh ? { 'zh-Hans': zh.canonicalHref as `/${string}` } : {}),
    ...(ko ? { ko: ko.canonicalHref as `/${string}` } : {}),
  })];
}));

const localizedPairs: readonly LocalizedPair[] = Object.freeze([
  Object.freeze({ en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }),
  Object.freeze({ en: '/tools/', ko: '/ko/tools/', 'zh-Hans': '/zh-cn/tools/' }),
  Object.freeze({ en: '/tools/property-scenario/', ko: '/ko/tools/property-scenario/' }),
  Object.freeze({ en: '/', ko: '/ko/', 'zh-Hans': '/zh-cn/kr/seoul/' }),
  Object.freeze({ en: '/prices/', ko: '/ko/prices/' }),
  Object.freeze({ en: '/rankings/', ko: '/ko/rankings/' }),
  Object.freeze({ en: '/news/', ko: '/ko/news/', 'zh-Hans': '/zh-cn/news/' }),
  Object.freeze({ en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' }),
  Object.freeze({ en: '/kr/seoul/', ko: '/ko/kr/seoul/' }),
  Object.freeze({ en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' }),
  Object.freeze({
    en: '/kr/seoul/check/compare/',
    ko: '/ko/kr/seoul/check/compare/',
  }),
  Object.freeze({ en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/' }),
  Object.freeze({ en: '/kr/seoul/rankings/', ko: '/ko/kr/seoul/rankings/' }),
  Object.freeze({ en: '/sg/singapore/rankings/', ko: '/ko/sg/singapore/rankings/' }),
  Object.freeze({ en: '/kr/seoul/shortlist/', ko: '/ko/kr/seoul/shortlist/' }),
  Object.freeze({ en: '/sg/', ko: '/ko/sg/' }),
  Object.freeze({ en: '/ae/dubai/', ko: '/ko/ae/dubai/' }),
  Object.freeze({ en: '/contact/', ko: '/ko/contact/' }),
  ...['/sg/singapore/explore/', '/sg/singapore/explore/ccr/', '/sg/singapore/explore/rcr/', '/sg/singapore/explore/ocr/', '/ae/dubai/explore/', '/ae/dubai/check/', '/ae/dubai/guide/'].map(en => ({ en: en as `/${string}`, ko: `/ko${en}` as `/${string}` })),
  ...CITY_STORIES.map(story => ({ en: cityStoryHref(story.city) as `/${string}`, ko: cityStoryHref(story.city, 'ko') as `/${string}` })),
  ...editorialLocalizedPairs,
] as const);

function languageAlternates(
  path: string,
  localizedPair?: LocalizedPair,
): SitemapEntry['alternates'] | undefined {
  const pair = localizedPair ?? localizedPairs.find((candidate) => (
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
  localizedPair?: LocalizedPair,
): SitemapEntry {
  const alternates = languageAlternates(path, localizedPair);
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
  const dubaiEvidence = dubaiEvidenceRepositoryFromEnvironment();
  const dubaiLastModified = dubaiEvidence === null
    ? undefined
    : validDate(dubaiEvidence.getContext().generatedAt);
  const entries: MetadataRoute.Sitemap = [
    sitemapEntry('/kr/seoul/shortlist/'),
    sitemapEntry('/ko/kr/seoul/shortlist/'),
    sitemapEntry('/passport/'),
    sitemapEntry('/ko/passport/'),
    sitemapEntry('/ko/'),
    sitemapEntry('/ko/sg/'),
    sitemapEntry('/ko/ae/dubai/'),
    sitemapEntry('/ko/contact/'),
    sitemapEntry('/ko/guides/', guideLastModified),
    sitemapEntry('/ko/prices/', summaryLastModified),
    sitemapEntry('/rankings/'),
    sitemapEntry('/ko/rankings/'),
    sitemapEntry('/ko/news/', latestDate(EDITORIAL_PORTFOLIO.filter(({ locale, type }) => locale === 'ko' && type !== 'guide').map(({ updatedAt }) => updatedAt))),
    ...['/sg/singapore/explore/', '/sg/singapore/explore/ccr/', '/sg/singapore/explore/rcr/', '/sg/singapore/explore/ocr/', '/ae/dubai/explore/', '/ae/dubai/guide/'].map(path => sitemapEntry(`/ko${path}`)),
    sitemapEntry('/zh-cn/passport/'),
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
    sitemapEntry('/ae/dubai/', new Date('2026-09-06')),
    sitemapEntry('/ae/dubai/explore/', new Date('2026-09-06')),
    sitemapEntry('/ae/dubai/guide/', new Date('2026-09-06')),
    sitemapEntry('/sg/'),
    sitemapEntry('/jp/tokyo/'),
    sitemapEntry('/jp/tokyo/explore/'),
    sitemapEntry('/sg/singapore/explore/'),
    sitemapEntry('/sg/singapore/explore/ccr/'),
    sitemapEntry('/sg/singapore/explore/rcr/'),
    sitemapEntry('/sg/singapore/explore/ocr/'),
    sitemapEntry('/sg/singapore/rankings/'),
    sitemapEntry('/ko/sg/singapore/rankings/'),
  ];
  entries.push(...CITY_STORIES.flatMap(story => (['en', 'ko'] as const).map(locale => sitemapEntry(cityStoryHref(story.city, locale) as `/${string}`, new Date('2026-09-08')))));
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
  }
  if (newsReady) {
    entries.push(...newsRecords.map((record) => ({
      url: publicCanonical(`/kr/seoul/news/${record.slug}/`),
      lastModified: new Date(record.updatedAt ?? record.publishedAt),
    })));
  }
  if (area.status === 'ready') {
    const publishedDistricts = new Set<string>(area.districts.flatMap((district) => (
      district.summary.published ? [district.slug] : []
    )));
    entries.push(...area.districts.flatMap((district) => district.summary.published
      ? [sitemapEntry(`/kr/seoul/explore/${district.slug}/`, areaLastModified, {en:`/kr/seoul/explore/${district.slug}/`,ko:`/ko/kr/seoul/explore/${district.slug}/`}), sitemapEntry(`/ko/kr/seoul/explore/${district.slug}/`, areaLastModified, {en:`/kr/seoul/explore/${district.slug}/`,ko:`/ko/kr/seoul/explore/${district.slug}/`})]
      : []));
    entries.push(...listSignedPricePropertyTypeRoutes().flatMap((route) => {
      const [, , , , district, propertyType] = route.path.split('/');
      if (!publishedDistricts.has(district ?? '')) return [];
      const model = buildPublicPropertyTypeModel(district ?? '', propertyType ?? '');
      const en = route.path as `/${string}`;
      const ko = `/ko${route.path}` as `/${string}`;
      const pair = Object.freeze({ en, ko });
      const lastModified = validDate(model?.evidence.generatedAt);
      return [
        sitemapEntry(en, lastModified, pair),
        sitemapEntry(ko, lastModified, pair),
      ];
    }));
  }
  if (dubaiEvidence !== null) {
    const dubaiAreaParams = dubaiEvidence.listAreaRouteParams();
    entries.push(...dubaiAreaParams.flatMap(({ area: slug }) => {
      const pair = { en: `/ae/dubai/explore/${slug}/`, ko: `/ko/ae/dubai/explore/${slug}/` } as const;
      return [sitemapEntry(pair.en, dubaiLastModified, pair), sitemapEntry(pair.ko, dubaiLastModified, pair)];
    }));
    if (dubaiAreaParams.length > 0) {
      entries.push(sitemapEntry('/ae/dubai/check/', dubaiLastModified), sitemapEntry('/ko/ae/dubai/check/', dubaiLastModified));
    }
  }
  const buildingEvidence = koreaEvidenceRepositoriesFromEnvironment();
  if (buildingEvidence.rent !== null || buildingEvidence.sale !== null) {
    const buildingLastModified = latestDate([
      buildingEvidence.rent?.getArtifact().generatedAt,
      buildingEvidence.sale?.getArtifact().generatedAt,
    ]);
    const buildingRecords = {
      rent: buildingEvidence.rent?.listBuildingRecords() ?? [],
      sale: buildingEvidence.sale?.listBuildingRecords() ?? [],
    };
    entries.push(...listIndexableKoreaBuildingRouteParams(buildingRecords)
      .flatMap(({ district, buildingId }) => {
        const pair = Object.freeze({
          en: `/kr/seoul/explore/${district}/${buildingId}/`,
          ko: `/ko/kr/seoul/explore/${district}/${buildingId}/`,
        }) satisfies LocalizedPair;
        return [
          sitemapEntry(pair.en, buildingLastModified, pair),
          sitemapEntry(pair.ko, buildingLastModified, pair),
        ];
      }));
    entries.push(...listIndexableKoreaNeighborhoodRouteParams(buildingRecords)
      .map(({ district, neighborhoodId }) => sitemapEntry(
        `/kr/seoul/explore/${district}/neighborhood/${neighborhoodId}/`,
        buildingLastModified,
      )));
  }
  return entries;
}
