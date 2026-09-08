import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createMarketDataRefreshService,
  type MarketDataRefreshRepository,
} from '../lib/market-data/refresh-service.server';
import type {
  MarketRefreshCounters,
  MarketRefreshJob,
  NormalizedMarketBatch,
} from '../lib/market-data/refresh-types';

const counters: MarketRefreshCounters = Object.freeze({
  received: 1,
  inserted: 1,
  updated: 0,
  unchanged: 0,
  unlinked: 0,
});

const datasetByJob = Object.freeze({
  'kr-seoul-sale': Object.freeze({ id: 'kr-sale', marketId: 'kr-seoul' }),
  'kr-seoul-rent': Object.freeze({ id: 'kr-rent', marketId: 'kr-seoul' }),
  'sg-private-sale': Object.freeze({ id: 'sg-private-sale', marketId: 'sg-singapore' }),
  'sg-private-rent': Object.freeze({ id: 'sg-private-rent', marketId: 'sg-singapore' }),
  'ae-dubai-transaction': Object.freeze({ id: 'ae-dubai-transactions', marketId: 'ae-dubai' }),
  'ae-dubai-rent': Object.freeze({ id: 'ae-dubai-rents', marketId: 'ae-dubai' }),
} as const);

function batch(job: MarketRefreshJob): NormalizedMarketBatch {
  const dataset = datasetByJob[job];
  return Object.freeze({
    job,
    dataset: Object.freeze({
      ...dataset,
      provider: 'Official provider',
      officialName: 'Official evidence',
      landingUrl: 'https://example.test/source',
      subjectScope: 'test',
      refreshCadence: 'daily',
      expectedLag: 'test',
      schemaVersion: 'test@1',
      parserVersion: 'test@1',
      rightsPolicyId: 'test-rights',
    }),
    sourceAsOf: '2026-09-06T00:00:00.000Z',
    records: Object.freeze([]),
  });
}

function repository(overrides: Partial<MarketDataRefreshRepository> = {}): MarketDataRefreshRepository {
  return {
    start: vi.fn(async (job: MarketRefreshJob) => Object.freeze({
      runId: 'run-1', leaseToken: 'lease-1', job,
    })),
    persist: vi.fn(async () => counters),
    succeed: vi.fn(async () => undefined),
    fail: vi.fn(async () => undefined),
    skip: vi.fn(async () => undefined),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('market data refresh service coordination', () => {
  it('does no provider or persistence work when another run owns the job lease', async () => {
    const store = repository({ start: vi.fn(async () => null) });
    const collectSeoul = vi.fn(async () => batch('kr-seoul-sale'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: { SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY: 'molit-key' },
      collectSeoul,
    });

    await expect(service.run('kr-seoul-sale')).resolves.toEqual({
      state: 'busy', job: 'kr-seoul-sale',
    });
    expect(collectSeoul).not.toHaveBeenCalled();
    expect(store.persist).not.toHaveBeenCalled();
  });

  it('records a skipped run when a required provider credential is absent', async () => {
    const store = repository();
    const collectSingapore = vi.fn(async () => batch('sg-private-rent'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: { SIGNEDPRICE_MARKET_REFRESH_JOBS: 'sg-private-rent' },
      collectSingapore,
    });

    await expect(service.run('sg-private-rent')).resolves.toEqual({
      state: 'skipped', job: 'sg-private-rent', reason: 'configuration_missing',
    });
    expect(store.skip).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'sg-private-rent' }),
      'configuration_missing',
    );
    expect(collectSingapore).not.toHaveBeenCalled();
  });

  it('keeps scheduled writes disabled until the exact job is explicitly enabled', async () => {
    const store = repository();
    const collectSeoul = vi.fn(async () => batch('kr-seoul-sale'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: { SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY: 'molit-key' },
      collectSeoul,
    });

    await expect(service.run('kr-seoul-sale')).resolves.toEqual({
      state: 'skipped', job: 'kr-seoul-sale', reason: 'job_disabled',
    });
    expect(store.skip).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'kr-seoul-sale' }),
      'job_disabled',
    );
    expect(collectSeoul).not.toHaveBeenCalled();
  });

  it('fails closed on an unknown or duplicated rollout job name', async () => {
    const store = repository();
    const collectSeoul = vi.fn(async () => batch('kr-seoul-sale'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'kr-seoul-sale,unknown-job',
        SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY: 'molit-key',
      },
      collectSeoul,
    });

    await expect(service.run('kr-seoul-sale')).resolves.toEqual({
      state: 'skipped', job: 'kr-seoul-sale', reason: 'configuration_invalid',
    });
    expect(collectSeoul).not.toHaveBeenCalled();
  });

  it('collects, persists and completes Seoul data with aggregate counters', async () => {
    const store = repository();
    const collectSeoul = vi.fn(async () => batch('kr-seoul-rent'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'kr-seoul-rent',
        SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY: '  molit-key  ',
      },
      now: () => new Date('2026-09-06T03:00:00.000Z'),
      collectSeoul,
    });

    await expect(service.run('kr-seoul-rent')).resolves.toEqual({
      state: 'ready',
      job: 'kr-seoul-rent',
      sourceAsOf: '2026-09-06T00:00:00.000Z',
      counters,
    });
    expect(collectSeoul).toHaveBeenCalledWith({
      job: 'kr-seoul-rent',
      serviceKey: 'molit-key',
      reference: new Date('2026-09-06T03:00:00.000Z'),
    });
    expect(store.persist).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'kr-seoul-rent' }),
      batch('kr-seoul-rent'),
    );
    expect(store.succeed).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'kr-seoul-rent' }),
      counters,
      '2026-09-06T00:00:00.000Z',
    );
  });

  it('accepts the existing DATA_GO_KR service-key alias for Seoul refreshes', async () => {
    const store = repository();
    const collectSeoul = vi.fn(async () => batch('kr-seoul-sale'));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'kr-seoul-sale',
        DATA_GO_KR_SERVICE_KEY: '  existing-key  ',
      },
      collectSeoul,
    });

    await expect(service.run('kr-seoul-sale')).resolves.toMatchObject({
      state: 'ready',
      job: 'kr-seoul-sale',
    });
    expect(collectSeoul).toHaveBeenCalledWith(expect.objectContaining({
      job: 'kr-seoul-sale',
      serviceKey: 'existing-key',
    }));
  });

  it.each([
    {
      name: 'prefers the SignedPrice-specific key when both are configured',
      primary: 'preferred-key',
      alias: 'existing-key',
      expected: 'preferred-key',
    },
    {
      name: 'falls back when the SignedPrice-specific key is whitespace-only',
      primary: '   ',
      alias: 'existing-key',
      expected: 'existing-key',
    },
  ])('$name', async ({ primary, alias, expected }) => {
    const collectSeoul = vi.fn(async () => batch('kr-seoul-sale'));
    const service = createMarketDataRefreshService({
      repository: repository(),
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'kr-seoul-sale',
        SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY: primary,
        DATA_GO_KR_SERVICE_KEY: alias,
      },
      collectSeoul,
    });

    await expect(service.run('kr-seoul-sale')).resolves.toMatchObject({
      state: 'ready',
      job: 'kr-seoul-sale',
    });
    expect(collectSeoul).toHaveBeenCalledWith(expect.objectContaining({
      serviceKey: expected,
    }));
  });

  it('rejects a Dubai auto-download URL outside official HTTPS hosts', async () => {
    const store = repository();
    const fetchResponse = vi.fn<typeof fetch>();
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'ae-dubai-transaction',
        SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL: 'http://attacker.test/source.csv',
      },
      fetchResponse,
    });

    await expect(service.run('ae-dubai-transaction')).resolves.toEqual({
      state: 'skipped', job: 'ae-dubai-transaction', reason: 'configuration_invalid',
    });
    expect(store.skip).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'ae-dubai-transaction' }),
      'configuration_invalid',
    );
    expect(fetchResponse).not.toHaveBeenCalled();
  });

  it('downloads an official Dubai CSV and stores its parsed records', async () => {
    const store = repository();
    const csv = [
      'TRANSACTION_NUMBER,INSTANCE_DATE,GROUP_EN,PROCEDURE_EN,IS_OFFPLAN_EN,IS_FREE_HOLD_EN,USAGE_EN,AREA_EN,PROP_TYPE_EN,PROP_SB_TYPE_EN,TRANS_VALUE,PROCEDURE_AREA,ACTUAL_AREA,ROOMS_EN,PROJECT_EN',
      'T-old,2026-01-05 12:30:00,Sales,Sale,Ready,Free Hold,Residential,Business Bay,Unit,Flat,1100000,80,80,1 B/R,Canal Home',
      'T-1,2026-09-05 12:30:00,Sales,Sale,Ready,Free Hold,Residential,Business Bay,Unit,Flat,1250000,80,80,1 B/R,Canal Home',
    ].join('\n');
    const fetchResponse = vi.fn<typeof fetch>().mockResolvedValue(new Response(csv, {
      status: 200,
      headers: { 'content-type': 'text/csv', 'content-length': String(csv.length) },
    }));
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'ae-dubai-transaction',
        SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL:
          'https://gslb.dubaipulse.gov.ae/datasets/transactions.csv',
      },
      now: () => new Date('2026-09-06T03:00:00.000Z'),
      fetchResponse,
    });

    await expect(service.run('ae-dubai-transaction')).resolves.toMatchObject({
      state: 'ready', job: 'ae-dubai-transaction', counters,
    });
    expect(fetchResponse).toHaveBeenCalledWith(
      'https://gslb.dubaipulse.gov.ae/datasets/transactions.csv',
      expect.objectContaining({ cache: 'no-store', redirect: 'error' }),
    );
    expect(store.persist).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'ae-dubai-transaction' }),
      expect.objectContaining({
        job: 'ae-dubai-transaction',
        records: [expect.objectContaining({ businessKey: 'T-1' })],
      }),
    );
  });

  it('lets an operator-provided Dubai CSV bypass an absent download URL', async () => {
    const store = repository();
    const csv = [
      'REGISTRATION_DATE,START_DATE,END_DATE,VERSION_EN,AREA_EN,CONTRACT_AMOUNT,ANNUAL_AMOUNT,IS_FREE_HOLD_EN,ACTUAL_AREA,PROP_TYPE_EN,PROP_SUB_TYPE_EN,ROOMS,USAGE_EN,PROJECT_EN',
      '2026-09-05 10:00:00,2026-09-01,2027-08-31,New,Dubai Marina,120000,120000,Free Hold,75,Unit,Flat,1 B/R,Residential,Marina Home',
    ].join('\n');
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {},
      now: () => new Date('2026-09-06T03:00:00.000Z'),
      fetchResponse: vi.fn<typeof fetch>(),
    });

    await expect(service.run('ae-dubai-rent', { uploadedCsv: csv })).resolves.toMatchObject({
      state: 'ready', job: 'ae-dubai-rent', counters,
    });
    expect(store.skip).not.toHaveBeenCalled();
    expect(store.persist).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'ae-dubai-rent' }),
      expect.objectContaining({ job: 'ae-dubai-rent', records: [expect.any(Object)] }),
    );
  });

  it('records stable error codes without reflecting provider error details', async () => {
    const store = repository();
    const service = createMarketDataRefreshService({
      repository: store,
      environment: {
        SIGNEDPRICE_MARKET_REFRESH_JOBS: 'sg-private-sale',
        SIGNEDPRICE_URA_ACCESS_KEY: 'ura-key',
      },
      collectSingapore: vi.fn(async () => {
        throw new Error('upstream secret response: do not expose');
      }),
    });

    await expect(service.run('sg-private-sale')).resolves.toEqual({
      state: 'failed', job: 'sg-private-sale', code: 'provider_unavailable',
    });
    expect(store.fail).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'sg-private-sale' }),
      'provider_unavailable',
    );
  });

  it('classifies malformed operator CSV separately from provider outages', async () => {
    const store = repository();
    const service = createMarketDataRefreshService({ repository: store, environment: {} });

    await expect(service.run('ae-dubai-rent', { uploadedCsv: 'not,a,dld,csv' })).resolves.toEqual({
      state: 'failed', job: 'ae-dubai-rent', code: 'source_invalid',
    });
    expect(store.fail).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'ae-dubai-rent' }),
      'source_invalid',
    );
  });
});
