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
  payload?: unknown;
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
    && [source.serialized, source.payload, source.load].filter(value => value !== undefined).length === 1;
}

export async function createSingaporeCheckEvidenceRepositories(
  sources: SingaporeCheckEvidenceSources,
): Promise<SingaporeCheckEvidenceRepositories> {
  const installed = new Map<SingaporeCheckMarket, SingaporeCheckArtifact>();
  await Promise.all(SINGAPORE_CHECK_MARKETS.map(async (market) => {
    const source = sources[market];
    if (source === undefined || !validExpectation(source)) return;
    try {
      const payload = source.payload !== undefined ? source.payload : source.serialized ?? await source.load!();
      const artifact = parseSingaporeCheckArtifact(payload, market);
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

const checkedInMarkets = new Map<SingaporeCheckMarket, Promise<SingaporeCheckEvidenceRepositories>>();
const checkedInSelections = new Map<string, Promise<SingaporeCheckEvidenceRepositories>>();

export function singaporeCheckEvidenceRepositoriesFromEnvironment(
  markets: readonly SingaporeCheckMarket[] = SINGAPORE_CHECK_MARKETS,
): Promise<SingaporeCheckEvidenceRepositories> {
  // Checked-in artifacts are immutable for this deployment. Avoid decompressing
  // and validating all transaction history again on every offer submission.
  // Explicit overrides and the disable switch always bypass the warm cache.
  const usesOnlyInstalled = checkedInSnapshotsAreEnabled()
    && Object.values(ENVIRONMENT).every(names => process.env[names.artifact] === undefined);
  const selected = SINGAPORE_CHECK_MARKETS.filter(market => markets.includes(market));
  if (!usesOnlyInstalled) return loadSingaporeCheckEvidenceRepositories(selected);
  const key = selected.join(',');
  const cached = checkedInSelections.get(key);
  if (cached) return cached;
  const pending = Promise.all(selected.map(market => {
    let repository = checkedInMarkets.get(market);
    if (!repository) {
      repository = loadSingaporeCheckEvidenceRepositories([market]);
      checkedInMarkets.set(market, repository);
    }
    return repository;
  })).then(repositories => Object.freeze({
    get<TMarket extends SingaporeCheckMarket>(market: TMarket) {
      return repositories.find(repository => repository.get(market) !== null)?.get(market) ?? null;
    },
    availability: () => Object.freeze(Object.fromEntries(SINGAPORE_CHECK_MARKETS.map(market => [
      market, repositories.some(repository => repository.get(market) !== null),
    ])) as Record<SingaporeCheckMarket, boolean>),
  }));
  checkedInSelections.set(key, pending);
  return pending;
}

function loadSingaporeCheckEvidenceRepositories(markets: readonly SingaporeCheckMarket[]): Promise<
  SingaporeCheckEvidenceRepositories
> {
  const installedRepository = checkedInSnapshotsAreEnabled()
    ? createInstalledSnapshotRepository({
        registrySource: resolveInstalledSnapshotRegistry(),
        resolveObject: resolveInstalledSnapshotObject,
      })
    : null;
  const sources: SingaporeCheckEvidenceSources = Object.fromEntries(
    markets.flatMap<[SingaporeCheckMarket, CheckEvidenceSource]>((market) => {
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
          payload: installed.payload,
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
