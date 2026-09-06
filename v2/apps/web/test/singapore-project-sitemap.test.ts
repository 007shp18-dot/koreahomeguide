import { afterEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/(en)/sg/singapore/sitemap';
import { generateMetadata } from '../app/(en)/sg/singapore/explore/[area]/[projectId]/page';
import { singaporeSnapshotRepositoryFromEnvironment } from '../lib/singapore/snapshot-repository.server';

afterEach(() => vi.unstubAllEnvs());

it('lists every published Singapore project with the same canonical and publication gate as its page', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  expect(repository).not.toBeNull();
  const entries = await sitemap();
  expect(entries).toHaveLength(2412);
  expect(new Set(entries.map(({ url }) => url)).size).toBe(entries.length);
  for (const { area, projectId } of repository!.listProjectRouteParams()) {
    expect(entries.some(({ url }) => url === `https://www.signedprice.com/sg/singapore/explore/${area}/${projectId}/`)).toBe(true);
    expect(repository!.getProject(area, projectId)?.published).toBe(true);
  }
  const params = repository!.listProjectRouteParams().at(-1)!;
  const metadata = await generateMetadata({ params: Promise.resolve(params) });
  expect(metadata.robots).toMatchObject({ index: true, follow: true });
  expect(entries.at(-1)?.url).toBe(metadata.alternates?.canonical);
  expect(entries.at(-1)?.lastModified).toEqual(new Date(repository!.getContext().generatedAt));
}, 20_000);
