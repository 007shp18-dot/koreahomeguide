import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

vi.mock('server-only', () => ({}));

import BuildingRoute, {
  dynamic,
  revalidate,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import * as KoreanBuildingRoute from '../app/(ko)/ko/kr/seoul/explore/[district]/[buildingId]/page';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
} from './public-building-fixture';

afterEach(() => vi.unstubAllEnvs());

describe('Korea building static route boundary', () => {
  it('uses ISR for both locale routes and prerenders only the evidence-rich Korean wave', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(dynamic).toBe('force-static');
    expect(revalidate).toBe(3_600);
    expect(KoreanBuildingRoute.dynamic).toBe('force-static');
    expect(KoreanBuildingRoute.revalidate).toBe(3_600);
    expect(KoreanBuildingRoute.generateStaticParams()).toHaveLength(1_031);
  });

  it('does not consume request-time search params while composing canonical HTML', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    let consumed = false;
    const requestTimeSearchParams = {
      then() {
        consumed = true;
        throw new Error('Static building HTML consumed request-time search params.');
      },
    } as unknown as Promise<Readonly<Record<string, string | string[] | undefined>>>;

    const result = await BuildingRoute({
      params: Promise.resolve({
        district: 'songpa-gu',
        buildingId: 'songpa-gu-1j88w6f',
      }),
      searchParams: requestTimeSearchParams,
    });

    expect(result).toBeDefined();
    expect(consumed).toBe(false);
    const hydrationBoundary = result as ReactElement<{
      children?: ReactElement;
    }>;
    const hydratedDetail = hydrationBoundary.props.children;
    expect(
      typeof hydratedDetail?.type === 'function' ? hydratedDetail.type.name : null,
    ).toBe('KoreaBuildingEvidenceClient');
  }, 20_000);

  it('keeps legacy decision tabs behind a static client boundary', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);
    const result = await BuildingRoute({
      params: Promise.resolve({
        district: 'gangnam-gu',
        buildingId: 'gangnam-evidence-tower',
      }),
      searchParams: Promise.resolve({ mode: 'rent', contract: 'all' }),
    });
    const hydrationBoundary = result as ReactElement<{ children?: ReactElement }>;
    const hydratedDetail = hydrationBoundary.props.children;
    expect(
      typeof hydratedDetail?.type === 'function' ? hydratedDetail.type.name : null,
    ).toBe('KoreaBuildingDecisionClient');
  });
});
