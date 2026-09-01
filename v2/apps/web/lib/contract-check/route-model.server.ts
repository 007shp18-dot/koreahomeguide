import 'server-only';

import {
  KR_MOLIT_RENT_RIGHTS,
  type KoreaConversionCurveProjection,
  type MolitRightsLookup,
} from '@signedprice/korea-rent';

import { createConversionRepository } from './conversion-repository.server';

export type ContractCheckNavigationItem = Readonly<{
  label: 'Check' | 'Explore' | 'News' | 'Guide';
  href: string | null;
  available: boolean;
}>;

export type ContractCheckUnavailableRouteModel = Readonly<{
  status: 'unavailable';
  message: 'Verified conversion evidence is unavailable.';
  navigation: readonly ContractCheckNavigationItem[];
}>;

export type ContractCheckReadyRouteModel = Readonly<{
  status: 'ready';
  curves: readonly KoreaConversionCurveProjection[];
  disclosure: Readonly<{
    source: 'MOLIT reported rental contracts';
    basis: 'Matched contracts in the same building and filed area';
    period: string;
    boundary: string;
  }>;
  secondaryCheckHref: '/kr/seoul/tools/rent-check/';
  navigation: readonly ContractCheckNavigationItem[];
}>;

export type ContractCheckRouteModel =
  | ContractCheckReadyRouteModel
  | ContractCheckUnavailableRouteModel;

export type ContractCheckRouteDependencies = Readonly<{
  source: unknown;
  period: string;
  sha256: string;
  referenceInstant: string;
}>;

export type ConversionEnvironmentDiagnosticCode =
  | 'artifact_missing'
  | 'period_missing'
  | 'sha_missing'
  | 'artifact_json_invalid'
  | 'artifact_contract_invalid'
  | 'curve_missing'
  | 'ready';

const navigation = Object.freeze([
  Object.freeze({ label: 'Check', href: '/kr/seoul/check/', available: true }),
  Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/', available: true }),
  Object.freeze({ label: 'News', href: '/kr/seoul/news/', available: true }),
  Object.freeze({ label: 'Guide', href: '/kr/seoul/guide/', available: true }),
] as const satisfies readonly ContractCheckNavigationItem[]);

const rightsLookup: MolitRightsLookup = (policyId) =>
  policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined;

function repositoryFor(dependencies: ContractCheckRouteDependencies) {
  return createConversionRepository({
    source: dependencies.source,
    expected: {
      marketId: 'kr-seoul',
      period: dependencies.period,
      sha256: dependencies.sha256,
      rightsLookup,
    },
    referenceInstant: dependencies.referenceInstant,
  });
}

export function diagnoseConversionEnvironment(input: Readonly<{
  serialized: string | undefined;
  period: string | undefined;
  sha256: string | undefined;
  referenceInstant: string;
}>): Readonly<{ code: ConversionEnvironmentDiagnosticCode }> {
  if (input.serialized === undefined) return Object.freeze({ code: 'artifact_missing' });
  if (input.period === undefined || input.period === '') {
    return Object.freeze({ code: 'period_missing' });
  }
  if (input.sha256 === undefined || input.sha256 === '') {
    return Object.freeze({ code: 'sha_missing' });
  }
  let source: unknown;
  try {
    source = JSON.parse(input.serialized);
  } catch {
    return Object.freeze({ code: 'artifact_json_invalid' });
  }
  try {
    const repository = repositoryFor({
      source,
      period: input.period,
      sha256: input.sha256,
      referenceInstant: input.referenceInstant,
    });
    try {
      repository.getCurve('apartment');
      repository.getCurve('officetel');
    } catch {
      return Object.freeze({ code: 'curve_missing' });
    }
    return Object.freeze({ code: 'ready' });
  } catch {
    return Object.freeze({ code: 'artifact_contract_invalid' });
  }
}

function environmentDependencies(): ContractCheckRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT;
  const period = process.env.SIGNEDPRICE_CONVERSION_CURVE_PERIOD;
  const sha256 = process.env.SIGNEDPRICE_CONVERSION_CURVE_SHA256;
  const referenceInstant = new Date().toISOString();
  const diagnostic = diagnoseConversionEnvironment({
    serialized,
    period,
    sha256,
    referenceInstant,
  });
  if (process.env.VERCEL_ENV === 'preview' && diagnostic.code !== 'ready') {
    console.warn(`[signedprice:conversion-curve] ${diagnostic.code}`);
  }
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return Object.freeze({
    source,
    period: period ?? '',
    sha256: sha256 ?? '',
    referenceInstant,
  });
}

export function buildContractCheckRouteModel(
  dependencies: ContractCheckRouteDependencies = environmentDependencies(),
): ContractCheckRouteModel {
  try {
    const repository = repositoryFor(dependencies);
    const apartment = repository.getCurve('apartment');
    const officetel = repository.getCurve('officetel');
    const curves = Object.freeze([apartment, officetel] as const);
    return Object.freeze({
      status: 'ready',
      curves,
      disclosure: Object.freeze({
        source: 'MOLIT reported rental contracts',
        basis: 'Matched contracts in the same building and filed area',
        period: apartment.period,
        boundary:
          'Between verified anchors rates are interpolated. Deposits outside the observed range are not compared.',
      }),
      secondaryCheckHref: '/kr/seoul/tools/rent-check/',
      navigation,
    });
  } catch {
    return Object.freeze({
      status: 'unavailable',
      message: 'Verified conversion evidence is unavailable.',
      navigation,
    });
  }
}
