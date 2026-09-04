import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  new URL('../db/migrations/0005_newsroom_content_system.sql', import.meta.url),
  'utf8',
);

describe('newsroom content compatibility migration', () => {
  it('separates external discovery from reviewed public content without destructive table changes', () => {
    for (const table of [
      'external_news_items',
      'content_sources',
      'content_source_links',
      'content_entity_links',
      'content_revisions',
    ]) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    for (const column of [
      'locale', 'content_type', 'editorial_status', 'evidence_state',
      'author_name', 'reviewed_at', 'reviewed_by',
    ]) expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`));
    expect(sql).toContain('INSERT INTO external_news_items');
    expect(sql).not.toMatch(/DROP TABLE|TRUNCATE|DROP COLUMN/i);
  });

  it('indexes the internal discovery queue and the public publication boundary', () => {
    expect(sql).toContain('external_news_items_review_queue');
    expect(sql).toContain('content_articles_public_lookup');
    expect(sql).toContain('content_source_links_primary_source');
  });
});
