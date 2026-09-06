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
    const prerendered = generateStaticParams().map(({ district, buildingId }) => (
      `${district}/${buildingId}`
    ));

    expect(buildingUrls).toHaveLength(8_471);
    expect(new Set(buildingUrls)).toHaveLength(8_471);
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
