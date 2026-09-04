import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import installedBuildingArtifact from '../data/public-building-summary.json';
import migrationManifest from '../../../../data/seo/signedprice-migration-manifest.json';
import {
  listSignedPricePropertyTypeRoutes,
  signedPricePublicRouteRegistry,
} from '../lib/seo/public-route-registry.server';

afterEach(() => vi.unstubAllEnvs());

describe('KoreaHomeGuide migration manifest registry parity', () => {
  it('keeps every active destination in the evidence-ready SignedPrice registry', () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(installedBuildingArtifact),
    );
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD',
      installedBuildingArtifact.provenance.period,
    );
    const registered = [
      ...signedPricePublicRouteRegistry.listMigrationCandidates({
        areaReady: true,
        singleQuoteReady: true,
      }),
      ...listSignedPricePropertyTypeRoutes().flatMap((route) => (
        route.legacySourcePath === undefined
          ? []
          : [{
              sourcePath: route.legacySourcePath,
              targetPath: route.path,
              cohort: route.cohort,
              locale: route.locale,
            }]
      )),
    ];

    for (const entry of migrationManifest.entries) {
      expect(registered).toContainEqual({
        sourcePath: entry.sourcePath,
        targetPath: entry.targetPath,
        cohort: entry.cohort,
        locale: entry.locale,
      });
    }
    expect(migrationManifest.entries).toContainEqual(expect.objectContaining({
      sourcePath: '/guides/', targetPath: '/guides/', cohort: 3,
    }));
  });
});
