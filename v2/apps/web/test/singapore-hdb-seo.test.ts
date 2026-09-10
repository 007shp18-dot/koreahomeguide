import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import singaporeSitemap, { buildSingaporeSitemap } from '../app/(en)/sg/singapore/sitemap';
import { generateMetadata as generateEnglishCheckMetadata } from '../app/(en)/sg/singapore/check/page';
import { generateMetadata as generateKoreanCheckMetadata } from '../app/(ko)/ko/sg/singapore/check/page';
import EnglishTownPage, { generateMetadata as generateEnglishTownMetadata } from '../app/(en)/sg/singapore/hdb/[town]/page';
import { generateMetadata as generateKoreanTownMetadata } from '../app/(ko)/ko/sg/singapore/hdb/[town]/page';
import EnglishBlockPage, { generateMetadata as generateEnglishBlockMetadata } from '../app/(en)/sg/singapore/hdb/[town]/[blockId]/page';
import { generateMetadata as generateKoreanBlockMetadata } from '../app/(ko)/ko/sg/singapore/hdb/[town]/[blockId]/page';
import { hdbSnapshotRepositoryFromEnvironment, type HdbSnapshotRepository } from '../lib/singapore/hdb-snapshot-repository.server';
import { listPublishedHdbRouteParams } from '../lib/singapore/hdb-index-policy.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '../lib/singapore/snapshot-repository.server';

afterEach(() => vi.unstubAllEnvs());

describe('Singapore HDB public SEO', () => {
  it('uses one evidence-qualified policy for towns and blocks', () => {
    const repository: HdbSnapshotRepository = {
      getContext: () => ({ generatedAt: '2026-09-02T00:00:00.000Z', resalePeriod: '2026-01/2026-08', rentalPeriod: '2026-01/2026-08', propertyThrough: '2026-08', resale: 10, rental: 10, properties: 2, publicationMinimum: 5 }),
      listTowns: () => [
        { town: 'ANG MO KIO', resaleCount: 5, resaleMedianSgd: 430_000, rentalCount: 0, rentalMedianSgd: null },
        { town: 'BEDOK', resaleCount: 4, resaleMedianSgd: null, rentalCount: 4, rentalMedianSgd: null },
      ],
      listBlocks: (town) => town === 'ANG MO KIO' ? [
        { blockId: '10-ang-mo-kio-street', town, block: '10', street: 'ANG MO KIO STREET', resaleCount: 5, resaleMedianSgd: 430_000, rentalCount: 0, rentalMedianSgd: null, property: null },
        { blockId: '11-ang-mo-kio-street', town, block: '11', street: 'ANG MO KIO STREET', resaleCount: 4, resaleMedianSgd: null, rentalCount: 0, rentalMedianSgd: null, property: null },
      ] : [],
    };

    expect(listPublishedHdbRouteParams(repository)).toEqual({
      towns: [{ town: 'ang-mo-kio' }],
      blocks: [{ town: 'ang-mo-kio', blockId: '10-ang-mo-kio-street' }],
    });
  });

  it('gives every published town and block unique reciprocal English and Korean metadata', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const repository = hdbSnapshotRepositoryFromEnvironment();
    expect(repository).not.toBeNull();
    const published = listPublishedHdbRouteParams(repository!);
    const town = published.towns[0]!;
    const block = published.blocks.find((candidate) => candidate.town === town.town)!;

    const [enTown, koTown, enBlock, koBlock] = await Promise.all([
      generateEnglishTownMetadata({ params: Promise.resolve(town) }),
      generateKoreanTownMetadata({ params: Promise.resolve(town) }),
      generateEnglishBlockMetadata({ params: Promise.resolve(block) }),
      generateKoreanBlockMetadata({ params: Promise.resolve(block) }),
    ]);
    const pairs = [
      [enTown, koTown, `https://www.signedprice.com/sg/singapore/hdb/${town.town}/`, `https://www.signedprice.com/ko/sg/singapore/hdb/${town.town}/`],
      [enBlock, koBlock, `https://www.signedprice.com/sg/singapore/hdb/${block.town}/${block.blockId}/`, `https://www.signedprice.com/ko/sg/singapore/hdb/${block.town}/${block.blockId}/`],
    ] as const;
    for (const [en, ko, enUrl, koUrl] of pairs) {
      expect(en.robots).toEqual({ index: true, follow: true });
      expect(ko.robots).toEqual({ index: true, follow: true });
      expect(en.alternates).toEqual({ canonical: enUrl, languages: { en: enUrl, ko: koUrl, 'x-default': enUrl } });
      expect(ko.alternates).toEqual({ canonical: koUrl, languages: { en: enUrl, ko: koUrl, 'x-default': enUrl } });
      expect(en.title).not.toBe(ko.title);
    }
    expect(enTown.title).not.toBe(enBlock.title);
  });

  it('keeps unknown and insufficient HDB routes out of indexing metadata', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const unknownTown = await generateEnglishTownMetadata({ params: Promise.resolve({ town: 'unknown-town' }) });
    const unknownBlock = await generateEnglishBlockMetadata({ params: Promise.resolve({ town: 'ang-mo-kio', blockId: 'unknown-block' }) });
    expect(unknownTown.robots).toEqual({ index: false, follow: true });
    expect(unknownTown).not.toHaveProperty('alternates');
    expect(unknownBlock.robots).toEqual({ index: false, follow: true });
    expect(unknownBlock).not.toHaveProperty('alternates');
  });

  it('returns a 404 for unknown town and block identifiers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(EnglishTownPage({ params: Promise.resolve({ town: 'unknown-town' }) }))
      .rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    await expect(EnglishBlockPage({ params: Promise.resolve({ town: 'ang-mo-kio', blockId: 'unknown-block' }) }))
      .rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('appends only published HDB routes and retains them if private evidence is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const repository = hdbSnapshotRepositoryFromEnvironment();
    expect(repository).not.toBeNull();
    const published = listPublishedHdbRouteParams(repository!);
    expect(published.towns).toHaveLength(28);
    expect(published.blocks).toHaveLength(9_485);

    const entries = buildSingaporeSitemap({ privateRepository: null, hdbRepository: repository!, checkRepositories: null });
    expect(entries).toHaveLength((28 + 9_485) * 2);
    const urls = new Set(entries.map(({ url }) => url));
    const town = published.towns[0]!;
    expect(urls).toContain(`https://www.signedprice.com/sg/singapore/hdb/${town.town}/`);
    expect(urls).toContain(`https://www.signedprice.com/ko/sg/singapore/hdb/${town.town}/`);

    const privateRepository = await singaporeSnapshotRepositoryFromEnvironment();
    expect(privateRepository).not.toBeNull();
    const privateOnly = buildSingaporeSitemap({ privateRepository, hdbRepository: null, checkRepositories: null });
    expect(privateOnly).toHaveLength(privateRepository!.listProjectRouteParams().length * 2);
  }, 20_000);

  it('loads the complete Singapore sitemap with Check and without duplicate URLs', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const entries = await singaporeSitemap();
    const urls = entries.map(({ url }) => url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain('https://www.signedprice.com/sg/singapore/check/');
    expect(urls).toContain('https://www.signedprice.com/ko/sg/singapore/check/');
  }, 20_000);
});

describe('Singapore Check metadata', () => {
  it('indexes only a query-free landing backed by published evidence', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const [en, ko] = await Promise.all([
      generateEnglishCheckMetadata({ searchParams: Promise.resolve({}) }),
      generateKoreanCheckMetadata({ searchParams: Promise.resolve({}) }),
    ]);
    expect(en.robots).toEqual({ index: true, follow: true });
    expect(ko.robots).toEqual({ index: true, follow: true });
    expect(en.alternates).toEqual({
      canonical: 'https://www.signedprice.com/sg/singapore/check/',
      languages: { en: 'https://www.signedprice.com/sg/singapore/check/', ko: 'https://www.signedprice.com/ko/sg/singapore/check/', 'x-default': 'https://www.signedprice.com/sg/singapore/check/' },
    });
    expect(ko.alternates).toEqual({
      canonical: 'https://www.signedprice.com/ko/sg/singapore/check/',
      languages: { en: 'https://www.signedprice.com/sg/singapore/check/', ko: 'https://www.signedprice.com/ko/sg/singapore/check/', 'x-default': 'https://www.signedprice.com/sg/singapore/check/' },
    });
  });

  it('keeps submitted and preference query URLs private while canonicalizing to the clean landing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const query of [{ submitted: '1', 'a-amount': '900000' }, { mode: 'compare' }]) {
      const metadata = await generateEnglishCheckMetadata({ searchParams: Promise.resolve(query) });
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.alternates?.canonical).toBe('https://www.signedprice.com/sg/singapore/check/');
    }
  });

  it('does not index a generic landing without verified evidence', async () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    const metadata = await generateEnglishCheckMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
