import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/sitemap';
import {
  generateMetadata,
  generateStaticParams,
  listPrerenderedKoreaBuildingParams,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import { generateMetadata as generateKoreanMetadata } from '../app/(ko)/ko/kr/seoul/explore/[district]/[buildingId]/page';
import {
  listIndexableKoreaBuildingRouteParams,
  listKoreaBuildingDirectory,
} from '../lib/public-market/korea-building-index-policy';
import * as buildingIndexPolicy from '../lib/public-market/korea-building-index-policy';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';

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

    expect(routes).toHaveLength(379);
    expect(new Set(routes.map(({ district, neighborhoodId }) => (
      `${district}/${neighborhoodId}`
    )))).toHaveLength(379);
    const neighborhoodBuildingKeys = routes.flatMap(({ district, neighborhoodId }) => (
      getNeighborhood(records, district, neighborhoodId)?.entries
        .map(({ buildingId }) => `${district}/${buildingId}`) ?? []
    ));
    expect(neighborhoodBuildingKeys).toHaveLength(8_471);
    expect(new Set(neighborhoodBuildingKeys)).toEqual(new Set(buildingRouteKeys));
    expect(gangnam).toContainEqual({
      neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
      name: '역삼동',
      buildings: 133,
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
    expect(yeoksam?.entries).toHaveLength(133);
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

    const buildingUrls = sitemap().map(({ url }) => url).filter((url) => (
      /^https:\/\/www\.signedprice\.com\/kr\/seoul\/explore\/[^/]+\/[^/]+\/$/.test(url)
      && !/(?:apartment|officetel|villa)\/$/.test(url)
    ));
    const neighborhoodUrls = sitemap().map(({ url }) => url).filter((url) => (
      /^https:\/\/www\.signedprice\.com\/kr\/seoul\/explore\/[^/]+\/neighborhood\/[^/]+\/$/.test(url)
    ));
    const prerendered = generateStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));

    expect(buildingUrls).toHaveLength(8_471);
    expect(new Set(buildingUrls)).toHaveLength(8_471);
    expect(neighborhoodUrls).toHaveLength(379);
    expect(new Set(neighborhoodUrls)).toHaveLength(379);
    expect(neighborhoodUrls).toContain(
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/neighborhood/gangnam-gu-dong-1g2fbdb/',
    );
    expect(listPrerenderedKoreaBuildingParams()).toHaveLength(1_031);
    expect(prerendered).toHaveLength(1_086);
    expect(buildingUrls).toContain(
      `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
    );
    expect(prerendered).toContain(
      `${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}`,
    );
    expect(buildingUrls).toContain(
      `https://www.signedprice.com/kr/seoul/explore/${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}/`,
    );
    expect(prerendered).not.toContain(
      `${SALE_ONLY_BUILDING.district}/${SALE_ONLY_BUILDING.buildingId}`,
    );
  }, 20_000);

  it('indexes a sale-only building with a sale canonical cohort', async () => {
    useInstalledEvidence();

    const metadata = await generateMetadata({
      params: Promise.resolve(SALE_ONLY_BUILDING),
      searchParams: Promise.resolve({ transaction: 'monthly' }),
    });

    expect(metadata).toMatchObject({
      title: `${SALE_ONLY_BUILDING.officialName} reported sale prices | signedprice`,
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
      title: `${INDEXABLE_BUILDING.officialName} reported rent evidence | signedprice`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
      },
      openGraph: {
        url: `https://www.signedprice.com/kr/seoul/explore/${INDEXABLE_BUILDING.district}/${INDEXABLE_BUILDING.buildingId}/`,
      },
    });
    expect(metadata.description).toContain('525 reported contracts');
    expect(metadata.description).toContain('2026-02/2026-08');
  }, 20_000);

  it('keeps the Korean duplicate out of search until it owns localized metadata', async () => {
    useInstalledEvidence();

    const metadata = await generateKoreanMetadata({
      params: Promise.resolve(INDEXABLE_BUILDING),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
  }, 20_000);
});
