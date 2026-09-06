import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import * as explorerSelection from '../lib/navigation/explorer-selection';
import * as explorerEvidence from '../lib/public-market/korea-explorer-evidence.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import {
  resolveKoreaBuildingEvidenceBackHref,
} from '../components/public-market/korea-building-evidence-client';
import { appendValidatedKoreaHydratedExploreState } from '../lib/public-market/korea-proximity-url';

afterEach(() => vi.unstubAllEnvs());

describe('static building filter hydration contract', () => {
  it('preserves strict view and proximity pairs in the hydrated evidence return URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const envelope = explorerEvidence.buildKoreaBuildingEvidenceEnvelope(
      repositories,
      'songpa-gu',
      'songpa-gu-1j88w6f',
      { transaction: 'monthly', area: 'all', contractType: 'all' },
    );
    if (envelope === null) throw new Error('Expected building evidence.');
    const query = new URLSearchParams({
      view: 'table',
      station: 'SEOUL:STN/001',
      stationDistance: '500',
      school: 'SEOUL:SCH/001',
      schoolDistance: '750',
    });

    expect(explorerSelection.createKoreaBuildingEvidenceRequestHref({
      district: 'songpa-gu',
      buildingId: 'songpa-gu-1j88w6f',
      searchParams: query,
    })).toBeNull();
    const href = resolveKoreaBuildingEvidenceBackHref(
      envelope.model,
      'en',
      query,
      '/kr/seoul/explore/?transaction=monthly',
    );
    const target = new URL(href, 'https://signedprice.invalid');

    expect(Object.fromEntries(target.searchParams)).toMatchObject({
      view: 'table',
      station: 'SEOUL:STN/001',
      stationDistance: '500',
      school: 'SEOUL:SCH/001',
      schoolDistance: '750',
    });
    expect(appendValidatedKoreaHydratedExploreState(
      '/kr/seoul/explore/?view=table',
      new URLSearchParams('station=SEOUL:STN/001&stationDistance=501&school=duplicate&school=again&schoolDistance=500'),
    )).toBe('/kr/seoul/explore/?view=table');
    expect(appendValidatedKoreaHydratedExploreState(
      '/kr/seoul/explore/',
      new URLSearchParams('station=s1%2Bs2&stationDistance=500'),
    )).toBe('/kr/seoul/explore/?station=s1%2Bs2&stationDistance=500');
  }, 20_000);

  it('builds one bounded API request from the three evidence filters', () => {
    const createHref = (explorerSelection as Readonly<Record<string, unknown>>)
      .createKoreaBuildingEvidenceRequestHref;
    expect(createHref).toBeTypeOf('function');
    if (typeof createHref !== 'function') return;

    const href = createHref({
      district: 'songpa-gu',
      buildingId: 'songpa-gu-1j88w6f',
      searchParams: new URLSearchParams(
        'transaction=sale&area=40-60&contractType=all&q=ignored&buildingPage=9',
      ),
    });

    expect(href).toBe(
      '/api/markets/kr-seoul/building-evidence/?district=songpa-gu&building=songpa-gu-1j88w6f&transaction=sale&area=40-60&contractType=all',
    );
    expect(createHref({
      district: 'songpa-gu',
      buildingId: 'songpa-gu-1j88w6f',
      searchParams: new URLSearchParams('q=heliocity&buildingPage=2'),
    })).toBeNull();
    expect(createHref({
      district: 'songpa-gu',
      buildingId: 'songpa-gu-1j88w6f',
      searchParams: new URLSearchParams(
        'district=songpa-gu&neighborhood=garak-dong&buildingId=songpa-gu-1j88w6f&view=table',
      ),
    })).toBe(
      '/api/markets/kr-seoul/building-evidence/?district=songpa-gu&building=songpa-gu-1j88w6f&transaction=sale',
    );
  });

  it('returns the selected sale or rent model from installed evidence', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const buildEnvelope = (explorerEvidence as Readonly<Record<string, unknown>>)
      .buildKoreaBuildingEvidenceEnvelope;
    expect(buildEnvelope).toBeTypeOf('function');
    if (typeof buildEnvelope !== 'function') return;

    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const sale = buildEnvelope(
      repositories,
      'songpa-gu',
      'songpa-gu-1j88w6f',
      { transaction: 'sale', area: 'all' },
    );
    const monthly = buildEnvelope(
      repositories,
      'songpa-gu',
      'songpa-gu-1j88w6f',
      { transaction: 'monthly', area: 'all', contractType: 'all' },
    );

    expect(sale).toMatchObject({
      schemaVersion: 1,
      model: {
        building: { officialName: '헬리오시티' },
        selection: { transaction: 'sale', areaBand: 'all' },
        evidence: { primaryMetric: 'sale-price' },
      },
    });
    expect(monthly).toMatchObject({
      schemaVersion: 1,
      model: {
        building: { officialName: '헬리오시티' },
        selection: { transaction: 'monthly', areaBand: 'all', contractGroup: 'all' },
        evidence: { primaryMetric: 'monthly-rent', sampleLabel: '525 reported contracts' },
      },
    });
  }, 20_000);

  it('serves only a validated building evidence response with CDN caching', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const createResponse = (explorerEvidence as Readonly<Record<string, unknown>>)
      .createKoreaBuildingEvidenceResponse;
    expect(createResponse).toBeTypeOf('function');
    if (typeof createResponse !== 'function') return;

    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const invalid = createResponse(
      repositories,
      new Request('https://signedprice.com/api/markets/kr-seoul/building-evidence/?district=../etc'),
    ) as Response;
    expect(invalid.status).toBe(400);
    const duplicate = createResponse(
      repositories,
      new Request(
        'https://signedprice.com/api/markets/kr-seoul/building-evidence/?district=songpa-gu&building=songpa-gu-1j88w6f&transaction=sale&transaction=monthly',
      ),
    ) as Response;
    expect(duplicate.status).toBe(400);

    const response = createResponse(
      repositories,
      new Request(
        'https://signedprice.com/api/markets/kr-seoul/building-evidence/?district=songpa-gu&building=songpa-gu-1j88w6f&transaction=monthly&area=all&contractType=all',
      ),
    ) as Response;
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600');
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: 1,
      model: {
        building: { officialName: '헬리오시티' },
        selection: { transaction: 'monthly' },
      },
    });
  }, 20_000);
});
