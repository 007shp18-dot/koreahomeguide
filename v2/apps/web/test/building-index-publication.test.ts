import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/sitemap';
import {
  generateMetadata,
  resolveKoreaEvidenceBuildingRoute,
  generateStaticParams,
  listPrerenderedKoreaBuildingParams,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import {
  generateMetadata as generateKoreanMetadata,
  generateStaticParams as generateKoreanStaticParams,
} from '../app/(ko)/ko/kr/seoul/explore/[district]/[buildingId]/page';
import {
  listIndexableKoreaBuildingRouteParams,
  listKoreaBuildingDirectory,
} from '../lib/public-market/korea-building-index-policy';
import * as buildingIndexPolicy from '../lib/public-market/korea-building-index-policy';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
} from './public-building-fixture';

const INDEXABLE_BUILDING = Object.freeze({
  district: 'songpa-gu',
  buildingId: 'songpa-gu-1j88w6f',
  officialName: '헬리오시티',
});
const SALE_ONLY_BUILDING = Object.freeze({
  district: 'dobong-gu',
  buildingId: 'dobong-gu-1sr7v7',
  officialName: '극동',
});

function useInstalledEvidence() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
  vi.stubEnv('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT', undefined);
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', undefined);
}

afterEach(() => vi.unstubAllEnvs());

describe('Korea building search publication', () => {
  it('indexes a real three-row history without publishing a small-sample median', async () => {
    useInstalledEvidence();
    const repositories = koreaEvidenceRepositoriesFromEnvironment();
    const rent = repositories.rent?.listBuildingRecords() ?? [];
    const sale = repositories.sale?.listBuildingRecords() ?? [];
    const rentById = new Map(rent.map((record) => [record.buildingId, record]));
    const record = sale.find((candidate) => candidate.recentSales.length === 3
      && buildingIndexPolicy.koreaBuildingEvidenceDepth({
        sale: candidate, rent: rentById.get(candidate.buildingId),
      }) === 0)!;
    expect(record).toBeDefined();
    const params = { district: record.districtSlug, buildingId: record.buildingId };
    const pair = { sale: record, rent: rentById.get(record.buildingId) };
    expect(buildingIndexPolicy.isKoreaBuildingIndexable(pair)).toBe(true);
    const selection = buildingIndexPolicy.koreaBuildingCanonicalSelection(pair)!;
    const detail = resolveKoreaEvidenceBuildingRoute(params.district, params.buildingId, selection, repositories)!;
    expect(detail.model.recentTransactions.length).toBeGreaterThanOrEqual(3);
    expect(detail.model.evidence.medianWon).toBeNull();
    expect(detail.model.evidence.state).toBe('withheld');
    const metadata = await generateMetadata({ params: Promise.resolve(params), searchParams: Promise.resolve({}) });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com/kr/seoul/explore/${params.district}/${params.buildingId}/`);
    expect(listIndexableKoreaBuildingRouteParams({ rent, sale })).toContainEqual(params);
    expect(listKoreaBuildingDirectory({ rent, sale }, record.districtSlug).some((entry) => entry.buildingId === record.buildingId)).toBe(true);
    expect(buildingIndexPolicy.isKoreaBuildingIndexable({ sale: { ...record, recentSales: record.recentSales.slice(0, 2) } })).toBe(false);
    expect(buildingIndexPolicy.isKoreaBuildingIndexable({ sale: { ...record, officialName: '' } })).toBe(false);
  }, 20_000);

  it('groups every indexable building into a crawlable neighborhood directory', () => {
    useInstalledEvidence();
    const repositories = koreaEvidenceRepositoriesFromEnvironment();
    const records = {
      rent: repositories.rent?.listBuildingRecords() ?? [],
      sale: repositories.sale?.listBuildingRecords() ?? [],
    };
    const policy = buildingIndexPolicy as typeof buildingIndexPolicy & {
      listIndexableKoreaNeighborhoodRouteParams?: (input: typeof records) => readonly Readonly<{
        district: string;
        neighborhoodId: string;
      }>[];
      listKoreaNeighborhoodDirectory?: (
        input: typeof records,
        district: string,
      ) => readonly Readonly<{
        neighborhoodId: string;
        name: string;
        buildings: number;
        href: string;
      }>[];
      getKoreaNeighborhoodBuildingDirectory?: (
        input: typeof records,
        district: string,
        neighborhoodId: string,
      ) => Readonly<{
        districtSlug: string;
        neighborhoodId: string;
        name: string;
        entries: readonly Readonly<{ buildingId: string; href: string }>[];
      }> | null;
    };

    expect(policy.listIndexableKoreaNeighborhoodRouteParams).toBeTypeOf('function');
    expect(policy.listKoreaNeighborhoodDirectory).toBeTypeOf('function');
    expect(policy.getKoreaNeighborhoodBuildingDirectory).toBeTypeOf('function');
    if (policy.listIndexableKoreaNeighborhoodRouteParams === undefined
      || policy.listKoreaNeighborhoodDirectory === undefined
      || policy.getKoreaNeighborhoodBuildingDirectory === undefined) return;

    const routes = policy.listIndexableKoreaNeighborhoodRouteParams(records);
    const gangnam = policy.listKoreaNeighborhoodDirectory(records, 'gangnam-gu');
    const getNeighborhood = policy.getKoreaNeighborhoodBuildingDirectory;
    const buildingRouteKeys = listIndexableKoreaBuildingRouteParams(records)
      .map(({ district, buildingId }) => `${district}/${buildingId}`);

    expect(routes).toHaveLength(388);
    expect(new Set(routes.map(({ district, neighborhoodId }) => (
      `${district}/${neighborhoodId}`
    )))).toHaveLength(388);
    const neighborhoodBuildingKeys = routes.flatMap(({ district, neighborhoodId }) => (
      getNeighborhood(records, district, neighborhoodId)?.entries
        .map(({ buildingId }) => `${district}/${buildingId}`) ?? []
    ));
    expect(neighborhoodBuildingKeys).toHaveLength(15_883);
    expect(new Set(neighborhoodBuildingKeys)).toEqual(new Set(buildingRouteKeys));
    expect(gangnam).toContainEqual({
      neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
      name: '역삼동',
      buildings: 281,
      href: '/kr/seoul/explore/gangnam-gu/neighborhood/gangnam-gu-dong-1g2fbdb/',
    });
    const yeoksam = policy.getKoreaNeighborhoodBuildingDirectory(
      records,
      'gangnam-gu',
      'gangnam-gu-dong-1g2fbdb',
    );
    expect(yeoksam).toMatchObject({
      districtSlug: 'gangnam-gu',
      neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
      name: '역삼동',
    });
    expect(yeoksam?.entries).toHaveLength(281);
    expect(policy.getKoreaNeighborhoodBuildingDirectory(
      records,
      'songpa-gu',
      'gangnam-gu-dong-1g2fbdb',
    )).toBeNull();
  }, 20_000);

  it('reuses the derived union and district directory for one evidence snapshot', () => {
    useInstalledEvidence();
    const repositories = koreaEvidenceRepositoriesFromEnvironment();
    const records = {
      rent: repositories.rent?.listBuildingRecords() ?? [],
      sale: repositories.sale?.listBuildingRecords() ?? [],
    };

    expect(listIndexableKoreaBuildingRouteParams(records)).toBe(
      listIndexableKoreaBuildingRouteParams(records),
    );
    expect(listKoreaBuildingDirectory(records, 'songpa-gu')).toBe(
      listKoreaBuildingDirectory(records, 'songpa-gu'),
    );
  }, 20_000);

  it('indexes every published building while prerendering only the evidence-rich wave', () => {
    useInstalledEvidence();

    const sitemapEntries = sitemap();
    const buildingUrls = sitemapEntries.map(({ url }) => url).filter((url) => (
      /^https:\/\/www\.signedprice\.com\/kr\/seoul\/explore\/[^/]+\/[^/]+\/$/.test(url)
      && !/(?:apartment|officetel|villa)\/$/.test(url)
    ));
    const koreanBuildingUrls = sitemapEntries.map(({ url }) => url).filter((url) => (
      /^https:\/\/www\.signedprice\.com\/ko\/kr\/seoul\/explore\/[^/]+\/[^/]+\/$/.test(url)
      && !/(?:apartment|officetel|villa)\/$/.test(url)
    ));
    const neighborhoodUrls = sitemapEntries.map(({ url }) => url).filter((url) => (
      /^https:\/\/www\.signedprice\.com\/kr\/seoul\/explore\/[^/]+\/neighborhood\/[^/]+\/$/.test(url)
    ));
    const prerendered = generateStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));
    const koreanPrerendered = generateKoreanStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));

    expect(buildingUrls).toHaveLength(15_883);
    expect(new Set(buildingUrls)).toHaveLength(15_883);
    expect(koreanBuildingUrls).toHaveLength(15_883);
    expect(new Set(koreanBuildingUrls)).toHaveLength(15_883);
    expect(new Set(koreanBuildingUrls.map((url) => url.replace(
      'https://www.signedprice.com/ko/kr/seoul/explore/',
      '',
    )))).toEqual(new Set(buildingUrls.map((url) => url.replace(
      'https://www.signedprice.com/kr/seoul/explore/',
      '',
    ))));
    expect(sitemapEntries.length).toBeLessThan(50_000);
    expect(neighborhoodUrls).toHaveLength(388);
    expect(new Set(neighborhoodUrls)).toHaveLength(388);
    expect(neighborhoodUrls).toContain(
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/neighborhood/gangnam-gu-dong-1g2fbdb/',
    );
    expect(listPrerenderedKoreaBuildingParams()).toHaveLength(1_031);
    expect(prerendered).toHaveLength(1_086);
    expect(koreanPrerendered).toHaveLength(1_031);
    expect(buildingUrls).toContain(
      `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
    );
    expect(prerendered).toContain(
      `${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}`,
    );
    expect(koreanPrerendered).toContain(
      `${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}`,
    );
    expect(buildingUrls).toContain(
      `https://www.signedprice.com/kr/seoul/explore/${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}/`,
    );
    expect(prerendered).not.toContain(
      `${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}`,
    );
    expect(koreanPrerendered).not.toContain(
      `${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}`,
    );

    const englishHelio = sitemapEntries.find(({ url }) => url === (
      `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`
    ));
    const koreanHelio = sitemapEntries.find(({ url }) => url === (
      `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`
    ));
    const helioLanguages = {
      en: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
      ko: `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
      'x-default': `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
    };
    expect(englishHelio?.alternates?.languages).toEqual(helioLanguages);
    expect(koreanHelio?.alternates?.languages).toEqual(helioLanguages);
  }, 20_000);

  it('keeps legacy-only summaries out of the Korean build-time cohort', () => {
    useInstalledEvidence();
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);

    const englishPrerendered = generateStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));
    const koreanPrerendered = generateKoreanStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));

    expect(englishPrerendered).toContain('gangnam-gu/gangnam-evidence-tower');
    expect(koreanPrerendered).not.toContain('gangnam-gu/gangnam-evidence-tower');
  }, 20_000);

  it('indexes a sale-only building with a sale canonical cohort', async () => {
    useInstalledEvidence();

    const metadata = await generateMetadata({
      params: Promise.resolve(SALE_ONLY_BUILDING),
      searchParams: Promise.resolve({ transaction: 'monthly' }),
    });

    expect(metadata).toMatchObject({
      title: `${SALE_ONLY_BUILDING.officialName} 실거래가 · 매매 전세 월세 | Dobong-gu Seoul | signedprice`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://www.signedprice.com/kr/seoul/explore/${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}/`,
      },
    });
    expect(metadata.description).toContain('8 reported contracts');
  }, 20_000);

  it('publishes self-canonical English metadata for an evidence-rich building', async () => {
    useInstalledEvidence();

    const metadata = await generateMetadata({
      params: Promise.resolve(INDEXABLE_BUILDING),
      searchParams: Promise.resolve({ transaction: 'sale', area: '40-60' }),
    });

    expect(metadata).toMatchObject({
      title: `${INDEXABLE_BUILDING.officialName} 실거래가 · 매매 전세 월세 | Songpa-gu Seoul | signedprice`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
        languages: {
          en: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
          ko: `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
          'x-default': `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
        },
      },
      openGraph: {
        url: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
      },
    });
    expect(metadata.description).toContain('525 reported contracts');
    expect(metadata.description).toContain('2026-02/2026-08');
  }, 20_000);

  it('publishes Korean search metadata for an evidence-rich building', async () => {
    useInstalledEvidence();

    const metadata = await generateKoreanMetadata({
      params: Promise.resolve(INDEXABLE_BUILDING),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: `${INDEXABLE_BUILDING.officialName} 실거래가 · 매매 전세 월세 | 송파구 가락동 | signedprice`,
      description: `${INDEXABLE_BUILDING.officialName}의 전세·월세 신고 거래를 송파구 2026-02/2026-08 기준으로 확인하세요. 대표 공개 표본 525건과 출처·공개 기준을 함께 제공합니다.`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
        languages: {
          en: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
          ko: `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
          'x-default': `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
        },
      },
      openGraph: {
        locale: 'ko_KR',
        url: `https://www.signedprice.com/ko/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
        images: ['https://www.signedprice.com/og/ko/'],
      },
    });
  }, 20_000);

  it('uses Korean sale search terms for a sale-only building', async () => {
    useInstalledEvidence();

    const metadata = await generateKoreanMetadata({
      params: Promise.resolve(SALE_ONLY_BUILDING),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: `${SALE_ONLY_BUILDING.officialName} 실거래가 · 매매 전세 월세 | 도봉구 도봉동 | signedprice`,
      description: `${SALE_ONLY_BUILDING.officialName}의 매매 신고 거래를 도봉구 2026-02/2026-08 기준으로 확인하세요. 대표 공개 표본 8건과 출처·공개 기준을 함께 제공합니다.`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://www.signedprice.com/ko/kr/seoul/explore/${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}/`,
      },
    });
  }, 20_000);
});
