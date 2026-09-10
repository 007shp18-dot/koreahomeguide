import 'server-only';
import { createHash } from 'node:crypto';
import { publicContentDatabase } from '../db/postgres.server';
import { unpackSingaporeExploreModel, type PackedSingaporeExploreModel } from './explore-transport';
import type { SingaporeExploreModel } from './route-types';

export const SINGAPORE_EXPLORE_PUBLICATION_VERSION = 'signedprice-sg-explore-publication-v1';
type PublishedExplore = Readonly<{
  version: typeof SINGAPORE_EXPLORE_PUBLICATION_VERSION;
  releaseId: string;
  snapshotDigest: string;
  model: PackedSingaporeExploreModel;
}>;
export type ExplorePublicationResult =
  | { status: 'ready'; model: SingaporeExploreModel }
  | { status: 'absent' | 'unavailable' };

export function parseSingaporeExplorePublication(serialized: string, digest: string, releaseId: string): SingaporeExploreModel {
  if (!/^[a-f0-9]{64}$/.test(digest) || createHash('sha256').update(serialized).digest('hex') !== digest) throw new Error('Explore publication digest mismatch');
  const value = JSON.parse(serialized) as PublishedExplore;
  if (value.version !== SINGAPORE_EXPLORE_PUBLICATION_VERSION || value.releaseId !== releaseId || !/^[a-f0-9]{64}$/.test(value.snapshotDigest)
    || value.model?.status !== 'ready' || !('encoding' in value.model) || value.model.encoding !== 'projects-v1'
    || value.model.segments.length !== 3 || new Set(value.model.segments.map(segment => segment.code)).size !== 3
    || value.model.segments.some(segment => !['CCR', 'RCR', 'OCR'].includes(segment.code) || !Array.isArray(segment.projects)
      || segment.projects.some(project => !Array.isArray(project) || project.length !== 9 || typeof project[0] !== 'string' || typeof project[1] !== 'string' || !Number.isSafeInteger(project[4]) || project[4] < 0))) {
    throw new Error('Explore publication invalid');
  }
  return unpackSingaporeExploreModel(value.model);
}

let cached: { releaseId: string; digest: string; model: SingaporeExploreModel } | null = null;
/** Always check the active pointer and current rights; never download transaction archives. */
export async function loadPublishedSingaporeExplore(): Promise<ExplorePublicationResult> {
  if (process.env.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || process.env.SIGNEDPRICE_SINGAPORE_PUBLICATION_DISABLED === 'true') return { status: 'absent' };
  const sql = publicContentDatabase();
  if (!sql) return { status: 'absent' };
  try {
    const [row] = await sql.query(`SELECT a.release_id, r.explore_sha256,
      CASE WHEN r.explore_sha256 = $1 AND a.release_id = $2 THEN NULL ELSE r.explore_json END AS explore_json,
      (SELECT count(*) = 2 AND bool_and(can_display AND can_create_derived AND can_use_commercially)
       FROM rights_policies WHERE id IN ('sg-ura-private-sale-v1','sg-ura-private-rent-v1')) AS rights_allowed
      FROM singapore_publication_active a JOIN singapore_publication_releases r ON r.id=a.release_id WHERE a.singleton=true`, [cached?.digest ?? '', cached?.releaseId ?? '']);
    if (!row) { cached = null; return { status: 'absent' }; }
    if (row.rights_allowed !== true || typeof row.explore_sha256 !== 'string') { cached = null; return { status: 'unavailable' }; }
    if (cached && cached.releaseId === row.release_id && cached.digest === row.explore_sha256) return { status: 'ready', model: cached.model };
    const model = parseSingaporeExplorePublication(String(row.explore_json), row.explore_sha256, String(row.release_id));
    cached = { releaseId: String(row.release_id), digest: row.explore_sha256, model };
    return { status: 'ready', model };
  } catch {
    cached = null;
    return { status: 'unavailable' };
  }
}
