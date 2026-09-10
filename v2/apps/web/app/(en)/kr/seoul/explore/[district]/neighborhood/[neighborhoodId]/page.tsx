import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';

import { BuildingDirectory } from '@/components/public-market/building-directory';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  getKoreaNeighborhoodBuildingDirectory,
  listIndexableKoreaNeighborhoodRouteParams,
} from '@/lib/public-market/korea-building-index-policy';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildBreadcrumbJsonLd, indexableMetadata, safeJsonLd } from '@/lib/public-metadata';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '@/lib/site-copy';

import styles from './neighborhood-page.module.css';

type NeighborhoodPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; neighborhoodId: string }>>;
}>;

function evidenceRecords() {
  const evidence = koreaEvidenceRepositoriesFromEnvironment();
  return {
    rent: evidence.rent?.listBuildingRecords() ?? [],
    sale: evidence.sale?.listBuildingRecords() ?? [],
  };
}

function resolveNeighborhood(districtSlug: string, neighborhoodId: string) {
  const district = getSeoulDistrictBySlug(districtSlug);
  if (district === null) return null;
  const neighborhood = getKoreaNeighborhoodBuildingDirectory(
    evidenceRecords(),
    district.slug,
    neighborhoodId,
  );
  return neighborhood === null ? null : Object.freeze({ district, neighborhood });
}

function headerFor(
  district: NonNullable<ReturnType<typeof getSeoulDistrictBySlug>>,
  neighborhoodId: string,
): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${district.nameEn} neighborhood evidence navigation`,
    marketLabel: 'Seoul',
    languageLabel: 'EN',
    languageSwitch: {
      label: '한국어',
      href: `/ko/kr/seoul/explore/?district=${district.slug}&neighborhood=${neighborhoodId}`,
      hrefLang: 'ko',
    },
    links: [
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/', isCurrent: true },
    ],
  };
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul reported-sale and rent evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District Explorer', href: '/kr/seoul/explore/' },
    { label: 'Trust', href: '/trust/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...listIndexableKoreaNeighborhoodRouteParams(evidenceRecords())];
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { district, neighborhoodId } = await params;
  const resolved = resolveNeighborhood(district, neighborhoodId);
  if (resolved === null) notFound();
  const path = `/kr/seoul/explore/${resolved.district.slug}/neighborhood/${resolved.neighborhood.neighborhoodId}/` as const;
  return indexableMetadata({
    path,
    title: `${resolved.neighborhood.name} property prices in ${resolved.district.nameEn} | signedprice`,
    description: `Browse ${resolved.neighborhood.entries.length.toLocaleString('en-US')} buildings with transaction histories in ${resolved.neighborhood.name}, ${resolved.district.nameEn}, using reported sale and rent evidence.`,
  });
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { district, neighborhoodId } = await params;
  const resolved = resolveNeighborhood(district, neighborhoodId);
  if (resolved === null) notFound();
  const districtPath = `/kr/seoul/explore/${resolved.district.slug}/` as const;
  const neighborhoodPath = `${districtPath}neighborhood/${resolved.neighborhood.neighborhoodId}/` as const;
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Seoul Explore', path: '/kr/seoul/explore/' },
    { name: resolved.district.nameEn, path: districtPath },
    { name: resolved.neighborhood.name, path: neighborhoodPath },
  ]);

  return (
    <div id="top" className={styles.page} data-neighborhood-detail="published">
      <SiteHeader copy={headerFor(resolved.district, resolved.neighborhood.neighborhoodId)} />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol>
            <li><Link href="/kr/seoul/explore/">Explore</Link></li>
            <li><Link href={districtPath}>{resolved.district.nameEn}</Link></li>
            <li aria-current="page" lang="ko">{resolved.neighborhood.name}</li>
          </ol>
        </nav>
        <header className={styles.hero}>
          <p>{resolved.district.nameEn} · <span lang="ko">{resolved.district.nameKo}</span></p>
          <h1><span lang="ko">{resolved.neighborhood.name}</span> reported property prices</h1>
          <p>
            Browse building sale and rental histories in this neighborhood.
            Individual transactions remain visible when a price summary has too few contracts to publish.
          </p>
          <dl>
            <div><dt>Buildings with history</dt><dd>{resolved.neighborhood.entries.length.toLocaleString('en-US')}</dd></div>
            <div><dt>Price summary minimum</dt><dd>5 contracts</dd></div>
          </dl>
        </header>
        <BuildingDirectory
          districtName={resolved.neighborhood.name}
          entries={resolved.neighborhood.entries}
        />
        <nav className={styles.returnLinks} aria-label="Neighborhood navigation">
          <Link href={districtPath}>All {resolved.district.nameEn} neighborhoods</Link>
          <Link href="/kr/seoul/explore/">Explore all Seoul districts</Link>
        </nav>
      </main>
      <script
        type="application/ld+json"
        data-structured-data="breadcrumb"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <SiteFooter copy={footer} />
    </div>
  );
}
