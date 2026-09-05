import 'server-only';

import { publicContentDatabase } from '../db/postgres.server';
import type { ContentSource } from './content-types';

export async function listContentSources(slug: string): Promise<readonly ContentSource[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) return Object.freeze([]);
  const sql = publicContentDatabase();
  if (sql === null) return Object.freeze([]);
  try {
    const rows = await sql`
      SELECT source.id, source.source_kind, source.publisher, source.title,
        source.canonical_url, source.checked_at, source.published_at
      FROM content_source_links link
      JOIN content_sources source ON source.id = link.source_id
      WHERE link.content_slug = ${slug}
      ORDER BY link.position, source.id
    `;
    return Object.freeze(rows.flatMap((row) => (
      typeof row.id === 'string'
      && (row.source_kind === 'primary' || row.source_kind === 'secondary')
      && typeof row.publisher === 'string'
      && typeof row.title === 'string'
      && typeof row.canonical_url === 'string'
      && row.checked_at instanceof Date
        ? [Object.freeze({
            id: row.id,
            kind: row.source_kind,
            publisher: row.publisher,
            title: row.title,
            href: row.canonical_url,
            checkedAt: row.checked_at.toISOString(),
            publishedAt: row.published_at instanceof Date ? row.published_at.toISOString() : null,
          })]
        : []
    )));
  } catch (error) {
    console.error('SignedPrice content source read failed.', error);
    return Object.freeze([]);
  }
}
