import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const seoulDetailRoute = readFileSync(
  new URL('../app/(en)/kr/seoul/explore/[district]/[buildingId]/page.tsx', import.meta.url),
  'utf8',
);
const singaporeProjectDetail = readFileSync(
  new URL('../components/singapore/singapore-project-detail.tsx', import.meta.url),
  'utf8',
);
const hdbBlockDetail = readFileSync(
  new URL('../components/singapore/hdb-block-detail.tsx', import.meta.url),
  'utf8',
);

describe('property media policy', () => {
  it('never promotes street imagery into the primary property-photo position', () => {
    for (const source of [seoulDetailRoute, singaporeProjectDetail, hdbBlockDetail]) {
      expect(source).not.toContain('BuildingStreetView');
      expect(source).toContain('MarketRepresentativePhoto');
    }
  });

  it('labels editorial city photography as representative rather than exact-property evidence', () => {
    const marketPhoto = readFileSync(
      new URL('../components/market-representative-photo.tsx', import.meta.url),
      'utf8',
    );
    expect(marketPhoto).toContain('Editorial city photograph');
    expect(marketPhoto).toContain('not this exact property');
  });
});
