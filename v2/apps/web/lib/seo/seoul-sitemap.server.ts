import 'server-only';
import type { MetadataRoute } from 'next';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { koreaEvidenceRepositoriesFromEnvironment } from '../public-market/korea-evidence-repositories.server';
import { listIndexableKoreaBuildingRouteParams, listIndexableKoreaNeighborhoodRouteParams } from '../public-market/korea-building-index-policy';
import { publicCanonical } from '../public-metadata';

type LocalizedPair = Readonly<{ en: `/${string}`; ko: `/${string}`; 'zh-Hans': `/${string}` }>;
export const seoulSitemapDistricts = SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug);

function latestDate(values: readonly (string | undefined)[]): Date | undefined {
  const dates = values.filter((value): value is string => value !== undefined)
    .map(value => new Date(value)).filter(value => Number.isFinite(value.getTime()));
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}
function sitemapEntry(path: `/${string}`, lastModified?: Date, pair?: LocalizedPair): MetadataRoute.Sitemap[number] {
  return { url: publicCanonical(path), ...(lastModified ? { lastModified } : {}),
    ...(pair ? { alternates: { languages: {
      en: publicCanonical(pair.en), ko: publicCanonical(pair.ko),
      'zh-Hans': publicCanonical(pair['zh-Hans']), 'x-default': publicCanonical(pair.en),
    } } } : {}),
  };
}

export function seoulBuildingSitemap(district?: string): MetadataRoute.Sitemap {
  if (district !== undefined && !seoulSitemapDistricts.some(slug => slug === district)) return [];
  const entries: MetadataRoute.Sitemap = [];
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
      .filter(param => district === undefined || param.district === district)
      .flatMap(({ district, buildingId }) => {
        const pair = Object.freeze({
          en: `/kr/seoul/explore/${district}/${buildingId}/`,
          ko: `/ko/kr/seoul/explore/${district}/${buildingId}/`,
          'zh-Hans': `/zh-cn/kr/seoul/explore/${district}/${buildingId}/`,
        }) satisfies LocalizedPair;
        return [
          sitemapEntry(pair.en, buildingLastModified, pair),
          sitemapEntry(pair.ko, buildingLastModified, pair),
          sitemapEntry(pair['zh-Hans'], buildingLastModified, pair),
        ];
      }));
    entries.push(...listIndexableKoreaNeighborhoodRouteParams(buildingRecords)
      .filter(param => district === undefined || param.district === district)
      .map(({ district, neighborhoodId }) => sitemapEntry(
        `/kr/seoul/explore/${district}/neighborhood/${neighborhoodId}/`,
        buildingLastModified,
      )));
  }
  return entries;
}
