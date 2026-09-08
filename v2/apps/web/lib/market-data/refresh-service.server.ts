import 'server-only';

import { parseDldRentsCsv, parseDldTransactionsCsv } from './dld-csv.server';
import { collectSeoulEvidence } from './seoul-collector.server';
import { collectSingaporeEvidence } from './singapore-collector.server';
import { refreshMonthKeys } from './refresh-window';
import type {
  MarketRefreshCounters,
  MarketRefreshJob,
  NormalizedMarketBatch,
} from './refresh-types';
import { isMarketRefreshJob } from './refresh-types';
import type { MarketRefreshRun } from './refresh-repository.server';

const MAX_DLD_CSV_BYTES = 256 * 1024 * 1024;
const DLD_DOWNLOAD_TIMEOUT_MS = 240_000;
const OFFICIAL_DLD_HOSTS = Object.freeze([
  'dubailand.gov.ae',
  'dubaipulse.gov.ae',
]);

type RefreshEnvironment = Readonly<Partial<Record<
  | 'SIGNEDPRICE_MARKET_REFRESH_JOBS'
  | 'SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY'
  | 'DATA_GO_KR_SERVICE_KEY'
  | 'SIGNEDPRICE_URA_ACCESS_KEY'
  | 'SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL'
  | 'SIGNEDPRICE_DLD_RENTS_CSV_URL',
  string | undefined
>>>;

export type MarketDataRefreshRepository = Readonly<{
  start(job: MarketRefreshJob): Promise<MarketRefreshRun | null>;
  persist(run: MarketRefreshRun, batch: NormalizedMarketBatch): Promise<MarketRefreshCounters>;
  succeed(
    run: MarketRefreshRun,
    counters: MarketRefreshCounters,
    sourceAsOf: string,
  ): Promise<void>;
  fail(run: MarketRefreshRun, code: string): Promise<void>;
  skip(run: MarketRefreshRun, code: string): Promise<void>;
}>;

export type MarketDataRefreshResult =
  | Readonly<{ state: 'busy'; job: MarketRefreshJob }>
  | Readonly<{
    state: 'ready';
    job: MarketRefreshJob;
    sourceAsOf: string;
    counters: MarketRefreshCounters;
  }>
  | Readonly<{
    state: 'skipped';
    job: MarketRefreshJob;
    reason: 'configuration_missing' | 'configuration_invalid' | 'job_disabled';
  }>
  | Readonly<{
    state: 'failed';
    job: MarketRefreshJob;
    code: 'provider_unavailable' | 'source_invalid' | 'storage_unavailable';
  }>;

class ProviderUnavailableError extends Error {}

class SourceInvalidError extends Error {}

function configured(value: string | undefined): string | null {
  const result = value?.trim() ?? '';
  return result === '' ? null : result;
}

function scheduledJobState(
  value: string | undefined,
  job: MarketRefreshJob,
): 'enabled' | 'disabled' | 'invalid' {
  const configuredJobs = configured(value);
  if (configuredJobs === null) return 'disabled';
  const candidates = configuredJobs.split(',').map((candidate) => candidate.trim());
  if (candidates.some((candidate) => !isMarketRefreshJob(candidate))
    || new Set(candidates).size !== candidates.length) return 'invalid';
  return candidates.includes(job) ? 'enabled' : 'disabled';
}

function officialDldCsvUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLocaleLowerCase('en-US');
    const officialHost = OFFICIAL_DLD_HOSTS.some((host) => (
      hostname === host || hostname.endsWith(`.${host}`)
    ));
    if (parsed.protocol !== 'https:' || !officialHost || parsed.username !== ''
      || parsed.password !== '' || (parsed.port !== '' && parsed.port !== '443')) return null;
    return value;
  } catch {
    return null;
  }
}

function csvByteLength(source: string): number {
  return new TextEncoder().encode(source).byteLength;
}

async function downloadDldCsv(
  sourceUrl: string,
  fetchResponse: typeof fetch,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchResponse(sourceUrl, {
      cache: 'no-store',
      redirect: 'error',
      headers: {
        accept: 'text/csv,application/csv;q=0.9,text/plain;q=0.7,*/*;q=0.1',
      },
      signal: AbortSignal.timeout(DLD_DOWNLOAD_TIMEOUT_MS),
    });
  } catch {
    throw new ProviderUnavailableError('DLD download failed.');
  }
  if (!response.ok) throw new ProviderUnavailableError('DLD download failed.');
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0
      || parsedLength > MAX_DLD_CSV_BYTES) {
      throw new SourceInvalidError('DLD CSV size is invalid.');
    }
  }
  let bytes: ArrayBuffer;
  try {
    bytes = await response.arrayBuffer();
  } catch {
    throw new ProviderUnavailableError('DLD download failed.');
  }
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_DLD_CSV_BYTES) {
    throw new SourceInvalidError('DLD CSV size is invalid.');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function parseDldBatch(
  job: Extract<MarketRefreshJob, 'ae-dubai-transaction' | 'ae-dubai-rent'>,
  source: string,
  reference: Date,
  incremental: boolean,
): NormalizedMarketBatch {
  if (source === '' || csvByteLength(source) > MAX_DLD_CSV_BYTES) {
    throw new SourceInvalidError('DLD CSV size is invalid.');
  }
  const options = incremental ? { monthKeys: refreshMonthKeys(reference) } : undefined;
  return job === 'ae-dubai-transaction'
    ? parseDldTransactionsCsv(source, reference, options)
    : parseDldRentsCsv(source, reference, options);
}

function failureCode(error: unknown): 'provider_unavailable' | 'source_invalid' {
  if (error instanceof ProviderUnavailableError) return 'provider_unavailable';
  if (error instanceof SourceInvalidError || error instanceof TypeError) return 'source_invalid';
  return 'provider_unavailable';
}

export function createMarketDataRefreshService(dependencies: Readonly<{
  repository: MarketDataRefreshRepository;
  environment?: RefreshEnvironment;
  now?: () => Date;
  fetchResponse?: typeof fetch;
  collectSeoul?: typeof collectSeoulEvidence;
  collectSingapore?: typeof collectSingaporeEvidence;
}>): Readonly<{
  run(
    job: MarketRefreshJob,
    input?: Readonly<{ uploadedCsv?: string }>,
  ): Promise<MarketDataRefreshResult>;
}> {
  const environment = dependencies.environment ?? process.env;
  const now = dependencies.now ?? (() => new Date());
  const fetchResponse = dependencies.fetchResponse ?? fetch;
  const collectSeoul = dependencies.collectSeoul ?? collectSeoulEvidence;
  const collectSingapore = dependencies.collectSingapore ?? collectSingaporeEvidence;

  async function skip(
    run: MarketRefreshRun,
    reason: 'configuration_missing' | 'configuration_invalid' | 'job_disabled',
  ): Promise<MarketDataRefreshResult> {
    try {
      await dependencies.repository.skip(run, reason);
      return Object.freeze({ state: 'skipped', job: run.job, reason });
    } catch {
      return Object.freeze({ state: 'failed', job: run.job, code: 'storage_unavailable' });
    }
  }

  async function fail(
    run: MarketRefreshRun,
    code: 'provider_unavailable' | 'source_invalid' | 'storage_unavailable',
  ): Promise<MarketDataRefreshResult> {
    try {
      await dependencies.repository.fail(run, code);
      return Object.freeze({ state: 'failed', job: run.job, code });
    } catch {
      return Object.freeze({ state: 'failed', job: run.job, code: 'storage_unavailable' });
    }
  }

  return Object.freeze({
    async run(job, input = Object.freeze({})) {
      let run: MarketRefreshRun | null;
      try {
        run = await dependencies.repository.start(job);
      } catch {
        return Object.freeze({ state: 'failed', job, code: 'storage_unavailable' });
      }
      if (run === null) return Object.freeze({ state: 'busy', job });

      if (input.uploadedCsv === undefined) {
        const jobState = scheduledJobState(environment.SIGNEDPRICE_MARKET_REFRESH_JOBS, job);
        if (jobState === 'invalid') return skip(run, 'configuration_invalid');
        if (jobState === 'disabled') return skip(run, 'job_disabled');
      }

      const reference = now();
      if (!Number.isFinite(reference.getTime())) return fail(run, 'source_invalid');

      let batch: NormalizedMarketBatch;
      try {
        if (job === 'kr-seoul-sale' || job === 'kr-seoul-rent') {
          if (input.uploadedCsv !== undefined) throw new SourceInvalidError('Unexpected CSV upload.');
          const serviceKey = configured(environment.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY)
            ?? configured(environment.DATA_GO_KR_SERVICE_KEY);
          if (serviceKey === null) return skip(run, 'configuration_missing');
          batch = await collectSeoul({ job, serviceKey, reference });
        } else if (job === 'sg-private-sale' || job === 'sg-private-rent') {
          if (input.uploadedCsv !== undefined) throw new SourceInvalidError('Unexpected CSV upload.');
          const accessKey = configured(environment.SIGNEDPRICE_URA_ACCESS_KEY);
          if (accessKey === null) return skip(run, 'configuration_missing');
          batch = await collectSingapore({ job, accessKey, reference });
        } else {
          let source = input.uploadedCsv;
          const incremental = source === undefined;
          if (source === undefined) {
            const configuredUrl = configured(job === 'ae-dubai-transaction'
              ? environment.SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL
              : environment.SIGNEDPRICE_DLD_RENTS_CSV_URL);
            if (configuredUrl === null) return skip(run, 'configuration_missing');
            const sourceUrl = officialDldCsvUrl(configuredUrl);
            if (sourceUrl === null) return skip(run, 'configuration_invalid');
            source = await downloadDldCsv(sourceUrl, fetchResponse);
          }
          batch = parseDldBatch(job, source, reference, incremental);
        }
      } catch (error) {
        return fail(run, failureCode(error));
      }

      let counters: MarketRefreshCounters;
      try {
        counters = await dependencies.repository.persist(run, batch);
        await dependencies.repository.succeed(run, counters, batch.sourceAsOf);
      } catch {
        return fail(run, 'storage_unavailable');
      }
      return Object.freeze({
        state: 'ready', job, sourceAsOf: batch.sourceAsOf, counters,
      });
    },
  });
}
