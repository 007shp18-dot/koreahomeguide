import 'server-only';
import { createHash } from 'node:crypto';
import type { SingaporeSnapshot } from '@signedprice/singapore-property';
import { createSingaporeSnapshotRepository } from './snapshot-repository.server';
import { buildSingaporeExploreModel } from './route-model.server';
import { packSingaporeExploreModel } from './explore-transport';
import { parseSingaporeExplorePublication, SINGAPORE_EXPLORE_PUBLICATION_VERSION } from './explore-publication.server';

/** Called only by publication/backfill jobs, never by interactive Explore requests. */
export async function buildSingaporeExplorePublication(releaseId: string, snapshot: SingaporeSnapshot) {
  const repository = await createSingaporeSnapshotRepository({ payload: snapshot, expectedDigest: snapshot.digest, expectedPeriod: `${snapshot.period.from}..${snapshot.period.to}` });
  const serialized = JSON.stringify({ version: SINGAPORE_EXPLORE_PUBLICATION_VERSION, releaseId, snapshotDigest: snapshot.digest, model: packSingaporeExploreModel(buildSingaporeExploreModel(repository)) });
  const digest = createHash('sha256').update(serialized).digest('hex');
  parseSingaporeExplorePublication(serialized, digest, releaseId);
  return { serialized, digest };
}
