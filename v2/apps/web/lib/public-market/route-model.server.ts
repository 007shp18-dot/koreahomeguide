import 'server-only';

import {
  getPublicMarketConfig,
  type PublicMarketConfig,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import type { Metadata } from 'next';

import type { SiteFooterModel, SiteHeaderModel } from '../site-copy';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  createPublicSummaryRepository,
} from './summary-repository.server';

export { PUBLIC_SUMMARY_ARTIFACT_VERSION } from './summary-repository.server';

export type KoreaPublicRouteDependencies = Readonly<{
  source: unknown;
  period: string;
}>;

export type KoreaPublicRouteModel = Readonly<{
  config: PublicMarketConfig;
  summary: PublicMarketSummary;
  header: SiteHeaderModel;
  footer: SiteFooterModel;
  pageCopy: Readonly<Record<'home' | 'check' | 'area', Readonly<{
    eyebrow: string;
    heading: string;
    description: string;
  }>>>;
  methodology: Readonly<{
    label: string;
    disclosure: string;
  }>;
  navigation: Readonly<{
    label: string;
    links: readonly Readonly<{ href: string; label: string }>[];
  }>;
}>;

export const koreaPublicMetadata = {
  title: 'Seoul rent prices | signedprice',
  description:
    'Compare a monthly rent quote with a verified distribution of officially reported Seoul rental contracts.',
  robots: { index: false, follow: true },
} as const satisfies Metadata;

const PUBLISHED_PATHS = [
  '/kr/',
  '/kr/check/seoul/',
  '/kr/seoul/',
] as const;

export function buildKoreaPublicPageMetadata(
  model: KoreaPublicRouteModel,
  path: string,
): Metadata {
  if (!PUBLISHED_PATHS.includes(path as (typeof PUBLISHED_PATHS)[number])) {
    throw new TypeError('Unknown Korea public canonical path.');
  }
  if (!model.summary.published) return koreaPublicMetadata;

  return {
    ...koreaPublicMetadata,
    robots: { index: true, follow: true },
    alternates: { canonical: new URL(path, 'https://signedprice.com').href },
  };
}

export function koreaPublishedSitemapUrls(model: KoreaPublicRouteModel): readonly string[] {
  if (!model.summary.published) return [];
  return PUBLISHED_PATHS.map((path) => new URL(path, 'https://signedprice.com').href);
}

const header = {
  brand: 'signedprice',
  homeLabel: 'signedprice Korea home',
  navigationLabel: 'Korea navigation',
  links: [
    { label: 'Korea', href: '/kr/', ariaLabel: 'Korea market home' },
    { label: 'Rent check', href: '/kr/check/seoul', ariaLabel: 'Check Seoul rent' },
    { label: 'Seoul evidence', href: '/kr/seoul', ariaLabel: 'Seoul market evidence' },
  ],
} as const satisfies SiteHeaderModel;

const footer = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul rental evidence, with publication limits shown.',
  navigationLabel: 'Korea footer navigation',
  links: [
    { label: 'Korea home', href: '/kr/' },
    { label: 'Check rent', href: '/kr/check/seoul' },
    { label: 'Evidence', href: '/kr/seoul' },
  ],
  status: 'Korea public P1 preview. Production launch is not authorized.',
} as const satisfies SiteFooterModel;

const pageCopy = {
  home: {
    eyebrow: 'Korea · Seoul rental evidence',
    heading: 'Put a rent quote against reported contracts.',
    description:
      'Choose the area and edit the quote. The market distribution is already in this page; your input never requests new market data.',
  },
  check: {
    eyebrow: 'Seoul rent check',
    heading: 'Where does this monthly rent sit?',
    description:
      'Your marker is calculated in the browser from the verified five-number distribution shown below.',
  },
  area: {
    eyebrow: 'Seoul market evidence',
    heading: 'Reported monthly-rent distribution.',
    description:
      'This server-rendered evidence page shows the verified period, publication count and full published distribution.',
  },
} as const;

const methodology = {
  label: '5.0%/year signedprice comparison assumption',
  disclosure:
    'Deposit conversion is a signedprice comparison assumption, not an official conversion rule.',
} as const;

const navigation = {
  label: 'Korea public pages',
  links: [
    { href: '/kr/', label: 'Korea home' },
    { href: '/kr/check/seoul', label: 'Check a Seoul quote' },
    { href: '/kr/seoul', label: 'Read Seoul evidence' },
  ],
} as const;

function environmentDependencies(): KoreaPublicRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT;
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return {
    source,
    period: process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '',
  };
}

export function buildKoreaPublicRouteModel(
  area: string,
  dependencies: KoreaPublicRouteDependencies = environmentDependencies(),
): KoreaPublicRouteModel | null {
  const config = getPublicMarketConfig('kr-seoul');
  if (config.availability !== 'ready' || area !== config.areaSlug) return null;

  const repository = createPublicSummaryRepository({
    source: dependencies.source,
    expected: {
      artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
      marketId: 'kr-seoul',
      period: dependencies.period,
    },
  });
  return Object.freeze({
    config,
    summary: repository.getSummary({ area, deal: 'rent', band: 'all-homes' }),
    header,
    footer,
    pageCopy,
    methodology,
    navigation,
  });
}
