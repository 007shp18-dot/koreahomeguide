import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { resolveIndexedBuildingIdentity } from '../lib/public-market/building-identity-index.server';

beforeAll(() => {
  execFileSync(process.execPath, ['scripts/build-building-identity-index.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
  });
});

test('retains the neighborhood identity for the two Yongsan Central Park buildings', () => {
  expect(resolveIndexedBuildingIdentity('yongsan-gu', 'yongsan-gu-htazbv')).toMatchObject({
    districtLawdCd: '11170', officialName: '센트럴파크', neighborhoodName: '한강로3가',
  });
  expect(resolveIndexedBuildingIdentity('yongsan-gu', 'yongsan-gu-1nt9qy5')).toMatchObject({
    districtLawdCd: '11170', officialName: '센트럴파크', neighborhoodName: '한강로1가',
  });
  expect(resolveIndexedBuildingIdentity('gangnam-gu', 'yongsan-gu-htazbv')).toBeNull();
});
