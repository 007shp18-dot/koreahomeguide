import 'server-only';
import { createHash } from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import { neon } from '@neondatabase/serverless';
import { gunzipSync } from 'node:zlib';
import { parseSingaporeSnapshot, parseSingaporeCheckArtifact, buildUraPrivateSaleCheckArtifact, type SingaporeSnapshot, type SingaporeCheckArtifact } from '@signedprice/singapore-property';
import { publicContentDatabase } from '../db/postgres.server';

export type SingaporeRentalSummary = Readonly<{ projectId: string; project: string; month: string; areaRange: string; propertyType: string; bedrooms: number | null; n: number; medianMonthlySgd: number }>;
export type SingaporePublication = Readonly<{
  version: 'signedprice-sg-publication-v1';
  sourceAsOf: string;
  releasedAt: string;
  snapshot: SingaporeSnapshot;
  check: SingaporeCheckArtifact<'ura-private-sale'>;
  rentals: readonly SingaporeRentalSummary[];
  rentalRecordCount: number;
}>;
export function parseSingaporePublication(serialized: string, digest: string): SingaporePublication {
  if (createHash('sha256').update(serialized).digest('hex') !== digest) throw new Error('SG publication digest mismatch');
  const value = JSON.parse(serialized) as SingaporePublication;
  if (value.version !== 'signedprice-sg-publication-v1' || !Number.isFinite(Date.parse(value.sourceAsOf)) || !Number.isFinite(Date.parse(value.releasedAt))) throw new Error('SG publication invalid');
  const snapshot = parseSingaporeSnapshot(value.snapshot);
  const check = parseSingaporeCheckArtifact(value.check, 'ura-private-sale');
  if (check.digest !== buildUraPrivateSaleCheckArtifact(snapshot).digest) throw new Error('SG publication artifacts disagree');
  if (!Array.isArray(value.rentals) || !Number.isSafeInteger(value.rentalRecordCount) || value.rentalRecordCount < 0 || value.rentals.some(row => !row.projectId.startsWith('sg-singapore:') || !row.project || !/^20\d\d-(0[1-9]|1[0-2])$/.test(row.month) || !row.areaRange || !row.propertyType || (row.bedrooms !== null && (!Number.isSafeInteger(row.bedrooms) || row.bedrooms < 1)) || !Number.isSafeInteger(row.n) || row.n < 5 || !Number.isFinite(row.medianMonthlySgd) || row.medianMonthlySgd <= 0)) throw new Error('SG rental aggregates invalid');
  return Object.freeze({ ...value, snapshot, check });
}
let rightsRevoked = false;
export function singaporePublicationRightsRevoked() { return rightsRevoked; }
let lastGood: SingaporePublication | null = null;
let lastId = '';
let checkedAt = 0;
let pending: Promise<SingaporePublication | null> | null = null;
/** One pointer read per minute; large immutable evidence loads only on a release change. */
export function refreshSingaporePublication(): Promise<SingaporePublication | null> {
  if (process.env.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || process.env.SIGNEDPRICE_SINGAPORE_PUBLICATION_DISABLED === 'true') return Promise.resolve(null);
  if (Date.now() - checkedAt < 60_000) return Promise.resolve(lastGood);
  if (pending) return pending;
  pending = (async () => {
    try {
      if (!process.env.DATABASE_URL?.trim()) return lastGood;
      const sql = neon(process.env.DATABASE_URL, { fetchOptions: { get signal() { return AbortSignal.timeout(25_000); } } });
      const [pointer] = await sql.query(`SELECT a.release_id,
        (SELECT count(*) = 2 AND bool_and(can_display AND can_create_derived AND can_use_commercially) FROM rights_policies WHERE id IN ('sg-ura-private-sale-v1','sg-ura-private-rent-v1')) AS rights_allowed,
        CASE WHEN a.release_id <> $1 THEN r.payload_gzip_base64 ELSE NULL END AS payload_gzip_base64, r.sha256
        FROM singapore_publication_active a JOIN singapore_publication_releases r ON r.id=a.release_id WHERE a.singleton=true`, [lastId]);
      if (pointer && pointer.rights_allowed !== true) { rightsRevoked = true; lastGood = null; lastId = ''; return null; }
      if (pointer) rightsRevoked = false;
      if (!pointer || pointer.release_id === lastId) return lastGood;
      const row = pointer;
      const serialized = gunzipSync(Buffer.from(String(row.payload_gzip_base64), 'base64'), { maxOutputLength: 150_000_000 }).toString('utf8');
      const verified = parseSingaporePublication(serialized, String(row.sha256));
      lastGood = verified;
      lastId = String(pointer.release_id);
      return verified;
    } catch { return lastGood; }
    finally { checkedAt = Date.now(); pending = null; }
  })();
  return pending;
}

export async function getSingaporePublicationStatus() {
 try {
  const sql = publicContentDatabase(); if (!sql) return null;
  const [row] = await sql.query(`SELECT r.source_as_of AS "sourceAsOf", r.released_at AS "releasedAt", r.sale_count AS "saleCount", r.rent_count AS "rentCount", r.sha256 AS digest FROM singapore_publication_active a JOIN singapore_publication_releases r ON r.id=a.release_id WHERE a.singleton=true`);
  return row ?? null;
 } catch { return null; }
}
export function resetSingaporePublicationCache() { checkedAt = 0; }

/** Bound initial SSR waiting; keep refresh alive after the response on Vercel. */
export function activeSingaporePublication(): Promise<SingaporePublication | null> {
 if (!process.env.DATABASE_URL?.trim() || process.env.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || process.env.SIGNEDPRICE_SINGAPORE_PUBLICATION_DISABLED === 'true') return Promise.resolve(null);
 const refresh = refreshSingaporePublication();
 waitUntil(refresh);
 if (lastGood !== null) return Promise.resolve(lastGood);
 return Promise.race([refresh, new Promise<null>(resolve => setTimeout(() => resolve(null), 750))]);
}
