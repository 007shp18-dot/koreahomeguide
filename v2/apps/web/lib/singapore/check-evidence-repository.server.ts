import 'server-only';

import {
  SINGAPORE_CHECK_MARKETS,
  parseSingaporeCheckArtifact,
  type SingaporeCheckArtifact,
  type SingaporeCheckMarket,
} from '@signedprice/singapore-property';
import {
  checkedInSnapshotsAreEnabled,
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
} from '../snapshots/installed-snapshot-repository.server';

type CheckEvidenceSource = Readonly<{
  serialized?: string;
  load?: () => Promise<string>;
  expectedDigest: string;
  expectedPeriod: string;
}>;

export type SingaporeCheckEvidenceSources = Partial<Readonly<
  Record<SingaporeCheckMarket, CheckEvidenceSource>
>>;

export type SingaporeCheckEvidenceRepositories = Readonly<{
  get<TMarket extends SingaporeCheckMarket>(
    market: TMarket,
  ): SingaporeCheckArtifact<TMarket> | null;
  availability(): Readonly<Record<SingaporeCheckMarket, boolean>>;
}>;

function validExpectation(source: CheckEvidenceSource): boolean {
  return /^[a-f0-9]{64}$/.test(source.expectedDigest)
    && /^20\d{2}-(0[1-9]|1[0-2])\/20\d{2}-(0[1-9]|1[0-2])$/.test(source.expectedPeriod)
    && ((source.serialized === undefined) !== (source.load === undefined));
}

export async function createSingaporeCheckEvidenceRepositories(
  sources: SingaporeCheckEvidenceSources,
): Promise<SingaporeCheckEvidenceRepositories> {
  const installed = new Map<SingaporeCheckMarket, SingaporeCheckArtifact>();
  await Promise.all(SINGAPORE_CHECK_MARKETS.map(async (market) => {
    const source = sources[market];
    if (source === undefined || !validExpectation(source)) return;
    try {
      const serialized = source.serialized ?? await source.load!();
      const artifact = parseSingaporeCheckArtifact(serialized, market);
      const period = `${artifact.period.from}/${artifact.period.to}`;
      if (artifact.digest !== source.expectedDigest || period !== source.expectedPeriod) return;
      installed.set(market, artifact);
    } catch {
      // Each market fails closed without changing the readiness of another market.
    }
  }));
  return Object.freeze({
    get<TMarket extends SingaporeCheckMarket>(market: TMarket) {
      return (installed.get(market) as SingaporeCheckArtifact<TMarket> | undefined) ?? null;
    },
    availability: () => Object.freeze(Object.fromEntries(
      SINGAPORE_CHECK_MARKETS.map((market) => [market, installed.has(market)]),
    ) as Record<SingaporeCheckMarket, boolean>),
  });
}

const DATASETS = Object.freeze({
  'ura-private-sale': 'sg-check-ura-private-sale',
  'hdb-resale': 'sg-check-hdb-resale',
  'hdb-rent': 'sg-check-hdb-rent',
} as const);

const ENVIRONMENT = Object.freeze({
  'ura-private-sale': {
    artifact: 'SIGNEDPRICE_SINGAPORE_CHECK_URA_ARTIFACT',
    digest: 'SIGNEDPRICE_SINGAPORE_CHECK_URA_SHA256',
    period: 'SIGNEDPRICE_SINGAPORE_CHECK_URA_PERIOD',
  },
  'hdb-resale': {
    artifact: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_ARTIFACT',
    digest: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_SHA256',
    period: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_PERIOD',
  },
  'hdb-rent': {
    artifact: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_ARTIFACT',
    digest: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_SHA256',
    period: 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_PERIOD',
  },
} as const);

export function singaporeCheckEvidenceRepositoriesFromEnvironment(): Promise<
  SingaporeCheckEvidenceRepositories
> {
  const installedRepository = checkedInSnapshotsAreEnabled()
    ? createInstalledSnapshotRepository({
        registrySource: resolveInstalledSnapshotRegistry(),
        resolveObject: resolveInstalledSnapshotObject,
      })
    : null;
  const sources: SingaporeCheckEvidenceSources = Object.fromEntries(
    SINGAPORE_CHECK_MARKETS.flatMap((market) => {
      const names = ENVIRONMENT[market];
      const serialized = process.env[names.artifact];
      if (serialized !== undefined) return [[market, {
        serialized,
        expectedDigest: process.env[names.digest] ?? '',
        expectedPeriod: process.env[names.period] ?? '',
      }]];
      if (installedRepository === null) return [];
      try {
        const installed = installedRepository.get('sg-singapore', DATASETS[market]);
        const payload = installed.payload as Readonly<{ digest?: unknown }>;
        return [[market, {
          serialized: JSON.stringify(installed.payload),
          expectedDigest: typeof payload.digest === 'string' ? payload.digest : '',
          expectedPeriod: installed.metadata.period,
        }]];
      } catch {
        return [];
      }
    }),
  );
  return createSingaporeCheckEvidenceRepositories(sources);
}
