import 'server-only';

import {
  type EvidenceDescriptor,
  getPublicMarketConfig,
  type PublicMarketConfig,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import { KR_MOLIT_RENT_RIGHTS } from '@signedprice/korea-rent';
import type { Metadata } from 'next';

import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../site-copy';
import type { PublicSourceBoundaryModel } from './area-route-types';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  createPublicSummaryRepository,
} from './summary-repository.server';
import { parsePublicSummaryArtifact } from './summary-schema';

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
  source: PublicSourceBoundaryModel;
  navigation: Readonly<{
    label: string;
    links: readonly Readonly<{ href: string; label: string }>[];
  }>;
}>;

export const koreaPublicMetadata = {
  title: 'Seoul jeonse deposits | signedprice',
  description:
    'Compare a refundable deposit with verified Seoul jeonse contracts reported for 45–55㎡ homes.',
  robots: { index: false, follow: true },
} as const satisfies Metadata;

const KOREA_PUBLIC_PATHS = [
  '/kr/',
  '/kr/check/seoul/',
  '/kr/seoul/',
] as const;

export function buildKoreaPublicPageMetadata(
  path: string,
): Metadata {
  if (!KOREA_PUBLIC_PATHS.includes(path as (typeof KOREA_PUBLIC_PATHS)[number])) {
    throw new TypeError('Unknown Korea public canonical path.');
  }
  return koreaPublicMetadata;
}

const header = {
  brand: 'signedprice',
  homeLabel: 'signedprice Korea home',
  navigationLabel: 'Korea navigation',
  links: [
    { label: 'Korea', href: '/kr/', ariaLabel: 'Korea market home' },
    { label: 'Deposit check', href: '/kr/check/seoul', ariaLabel: 'Check Seoul jeonse deposit' },
    { label: 'Seoul evidence', href: '/kr/seoul', ariaLabel: 'Seoul market evidence' },
  ],
} as const satisfies SiteHeaderModel;

const footer = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
  navigationLabel: 'Korea footer navigation',
  links: [
    { label: 'Korea home', href: '/kr/' },
    { label: 'Check deposit', href: '/kr/check/seoul' },
    { label: 'Evidence', href: '/kr/seoul' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
} as const satisfies SiteFooterModel;

const pageCopy = {
  home: {
    eyebrow: 'Korea · Seoul jeonse evidence',
    heading: 'Put a refundable deposit against reported contracts.',
    description:
      'Compare a 45–55㎡ jeonse deposit with the verified distribution already embedded in this page.',
  },
  check: {
    eyebrow: 'Seoul jeonse deposit check',
    heading: 'Where does this refundable deposit sit?',
    description:
      'Your marker is calculated in the browser from the verified five-number distribution shown below.',
  },
  area: {
    eyebrow: 'Seoul jeonse market evidence',
    heading: 'Reported refundable-deposit distribution.',
    description:
      'This page shows the verified seven-month period, publication count and 45–55㎡ jeonse distribution.',
  },
} as const;

const methodology = {
  label: 'Seven completed months · 45–55㎡ · zero-rent jeonse',
  disclosure:
    'Amounts are reported refundable deposits; canceled contracts and contracts with monthly rent are excluded.',
} as const;

const navigation = {
  label: 'Korea public pages',
  links: [
    { href: '/kr/', label: 'Korea home' },
    { href: '/kr/check/seoul', label: 'Check a Seoul deposit' },
    { href: '/kr/seoul', label: 'Read Seoul evidence' },
  ],
} as const;

function sourceBoundary(
  period: string,
  evidence: EvidenceDescriptor,
): PublicSourceBoundaryModel {
  return Object.freeze({
    evidence,
    provider: 'MOLIT',
    period,
    attribution: Object.freeze([...KR_MOLIT_RENT_RIGHTS.attribution]),
    band: '45–55㎡',
    publicationMinimum: 5,
    includesNewAndRenewal: true,
    includesUnknownContractType: true,
    includesUnknownRecordStatus: true,
  });
}

export type PublicSummaryEnvironmentDiagnosticCode =
  | 'artifact_missing'
  | 'period_missing'
  | 'artifact_json_invalid'
  | 'artifact_contract_invalid'
  | 'required_summary_missing'
  | 'ready';

export function diagnosePublicSummaryEnvironment(
  serialized: string | undefined,
  period: string | undefined,
): Readonly<{ code: PublicSummaryEnvironmentDiagnosticCode }> {
  if (serialized === undefined) return { code: 'artifact_missing' };
  if (period === undefined || period === '') return { code: 'period_missing' };

  let source: unknown;
  try {
    source = JSON.parse(serialized);
  } catch {
    return { code: 'artifact_json_invalid' };
  }

  try {
    const artifact = parsePublicSummaryArtifact(source, {
      artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
      marketId: 'kr-seoul',
      period,
    });
    const requiredSummary = artifact.summaries.some((summary) => (
      summary.area === 'seoul' &&
      summary.deal === 'jeonse' &&
      summary.band === '45-55sqm'
    ));
    return { code: requiredSummary ? 'ready' : 'required_summary_missing' };
  } catch {
    return { code: 'artifact_contract_invalid' };
  }
}

function environmentDependencies(): KoreaPublicRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT;
  const period = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD;
  const diagnostic = diagnosePublicSummaryEnvironment(serialized, period);
  if (process.env.VERCEL_ENV === 'preview' && diagnostic.code !== 'ready') {
    console.warn(`[signedprice:public-summary] ${diagnostic.code}`);
  }
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return {
    source,
    period: period ?? '',
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
  const summary = repository.getSummary({ area, deal: 'jeonse', band: '45-55sqm' });
  return Object.freeze({
    config,
    summary,
    header,
    footer,
    pageCopy,
    methodology,
    source: sourceBoundary(summary.period, repository.getEvidenceDescriptor()),
    navigation,
  });
}
