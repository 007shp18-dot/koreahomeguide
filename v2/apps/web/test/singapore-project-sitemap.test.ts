import { afterEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/(en)/sg/singapore/sitemap';
import { generateMetadata } from '../app/(en)/sg/singapore/explore/[area]/[projectId]/page';
import { generateMetadata as generateKoreanMetadata } from '../app/(ko)/ko/sg/singapore/explore/[area]/[projectId]/page';
import { singaporeSnapshotRepositoryFromEnvironment } from '../lib/singapore/snapshot-repository.server';

afterEach(() => vi.unstubAllEnvs());

it('lists every published Singapore project with the same canonical and publication gate as its page', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  expect(repository).not.toBeNull();
  const entries = await sitemap();
  const projectEntries = entries.filter(({ url }) => url.includes('/singapore/explore/'));
  expect(projectEntries).toHaveLength(7236);
  expect(projectEntries).toHaveLength(repository!.listProjectRouteParams().length * 3);
  const entriesByUrl = new Map(projectEntries.map(entry => [entry.url, entry]));
  expect(new Set(entries.map(({ url }) => url)).size).toBe(entries.length);
  for (const { area, projectId } of repository!.listProjectRouteParams()) {
    const en = `https://www.signedprice.com/sg/singapore/explore/${area}/${projectId}/`;
    const ko = `https://www.signedprice.com/ko/sg/singapore/explore/${area}/${projectId}/`;
    const zh = `https://www.signedprice.com/zh-cn/sg/singapore/explore/${area}/${projectId}/`;
    for (const url of [en, ko, zh]) expect(entriesByUrl.get(url)).toMatchObject({
      url,
      alternates: { languages: { en, ko, 'zh-Hans': zh, 'x-default': en } },
      lastModified: new Date(repository!.getContext().generatedAt),
    });
    expect(repository!.getProject(area, projectId)?.published).toBe(true);
  }
  const params = repository!.listProjectRouteParams().at(-1)!;
  const metadata = await generateMetadata({ params: Promise.resolve(params) });
  expect(metadata.robots).toMatchObject({ index: true, follow: true });
  const koreanMetadata = await generateKoreanMetadata({ params: Promise.resolve(params) });
  expect(koreanMetadata.robots).toMatchObject({ index: true, follow: true });
  for (const pageMetadata of [metadata, koreanMetadata]) {
    const entry = entriesByUrl.get(String(pageMetadata.alternates?.canonical));
    expect(entry).toBeDefined();
    expect(entry?.alternates?.languages).toMatchObject(pageMetadata.alternates?.languages ?? {});
    expect(entry?.lastModified).toEqual(new Date(repository!.getContext().generatedAt));
  }
// Loads the full checked-in URA and HDB snapshots on a cold worker.
// This verifies publication coverage, not a response-time performance budget.
}, 60_000);
