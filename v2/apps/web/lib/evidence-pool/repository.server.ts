import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { AuditEvent, Command, Evidence, EvidenceInput, PoolData, Source } from './contract';

import { researchDashboard } from './research.server';
import { classified, filterWhere } from './query.server';
import type { BulkCommand, BulkPreview } from './bulk';

type Row = Record<string, unknown>;
export type SqlPort = { query(statement: string, parameters?: unknown[]): Promise<Row[]> };
export type Filters = { page: number; market: string; status: string; query: string; sourcePage?: number; quality?: string };
export type PoolRepository = ReturnType<typeof createPoolRepository>;
function fingerprint(input: EvidenceInput) {
  // Retention changes alone must not make an observation new.
  const { expiresOn: _expiresOn, tier: _tier, ...identity } = input;
  return createHash('sha256').update(JSON.stringify(identity, Object.keys(identity).sort())).digest('hex');
}
function timestamp(value: unknown): string { return value instanceof Date ? value.toISOString() : String(value); }
function source(row: Row): Source {
  return { id: String(row.id), name: String(row.name), url: String(row.url), kind: row.kind as Source['kind'], status: row.status as Source['status'], version: Number(row.version), createdAt: timestamp(row.created_at) };
}
function evidence(row: Row): Evidence {
  return { ...row.data as EvidenceInput, id: String(row.id), status: row.status as Evidence['status'], version: Number(row.version), createdAt: timestamp(row.created_at), sourceName: String(row.source_name), sourceStatus: row.source_status as Evidence['sourceStatus'], sourceKind: row.source_kind as Evidence['sourceKind'], duplicate: Boolean(row.duplicate) };
}
function audit(cte: string) {
  return `WITH changed AS (${cte}), recorded AS (
    INSERT INTO property_pool_events(entity, entity_id, action, actor, reason, snapshot)
    SELECT $1, changed.id, $2, $3, $4, to_jsonb(changed) FROM changed RETURNING entity_id
  ) SELECT changed.id::text, changed.version FROM changed JOIN recorded ON recorded.entity_id = changed.id`;
}
export function createPoolRepository(sql: SqlPort) {
  return {
    research: (market: string, tool: string) => researchDashboard(sql, market, tool),
    async list(filters: Filters): Promise<PoolData> {
      const where = filterWhere;
      const parameters = [filters.market, filters.status, filters.query, filters.quality ?? ''];
      const sourcePage = filters.sourcePage ?? 1;
      const [sources, rows, totals, counts, sourceCounts] = await Promise.all([
        sql.query('SELECT * FROM property_pool_sources ORDER BY created_at DESC, id LIMIT 100 OFFSET $1', [(sourcePage - 1) * 100]),
        sql.query(`${classified} SELECT e.*, s.name AS source_name, s.status AS source_status, s.kind AS source_kind
          FROM classified e JOIN property_pool_sources s ON s.id = e.source_id WHERE ${where}
          ORDER BY e.created_at DESC, e.id LIMIT 25 OFFSET $5`, [...parameters, (filters.page - 1) * 25]),
        sql.query(`${classified} SELECT count(*)::integer AS total FROM classified e JOIN property_pool_sources s ON s.id = e.source_id WHERE ${where}`, parameters),
        sql.query(`SELECT count(*) FILTER (WHERE status = 'pending')::integer AS pending,
          count(*) FILTER (WHERE status = 'approved')::integer AS approved,
          count(*) FILTER (WHERE status = 'rejected')::integer AS rejected,
          count(*) FILTER (WHERE status = 'withdrawn')::integer AS withdrawn,
          count(*) FILTER (WHERE data->>'expiresOn' < to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD'))::integer AS expired FROM property_pool_evidence`),
        sql.query('SELECT count(*)::integer AS total FROM property_pool_sources'),
      ]);
      return { sources: sources.map(source), sourceTotal: Number(sourceCounts[0]?.total ?? 0), sourcePage, evidence: rows.map(evidence), total: Number(totals[0]?.total ?? 0), page: filters.page,
        counts: { pending: Number(counts[0]?.pending ?? 0), approved: Number(counts[0]?.approved ?? 0), rejected: Number(counts[0]?.rejected ?? 0), withdrawn: Number(counts[0]?.withdrawn ?? 0), expired: Number(counts[0]?.expired ?? 0) } };
    },
    async bulk(command: BulkCommand, actor: string): Promise<BulkPreview & { changed?: number }> {
      const { scope } = command;
      const base = `${classified}, targets AS MATERIALIZED (
        SELECT e.id, e.version, s.version AS source_version,
          (e.status <> 'withdrawn' AND e.status <> $6 AND ($6 <> 'approved' OR (e.quality = 'qualified' AND s.status = 'approved'))) AS eligible
        FROM classified e JOIN property_pool_sources s ON s.id = e.source_id
        WHERE ${filterWhere} AND ($5::uuid[] IS NULL OR e.id = ANY($5::uuid[]))
      ), locked AS MATERIALIZED (
        SELECT t.* FROM targets t JOIN property_pool_evidence actual ON actual.id = t.id
        JOIN property_pool_sources src ON src.id = actual.source_id
        WHERE actual.version = t.version AND src.version = t.source_version
        ORDER BY actual.id FOR UPDATE OF actual, src
      ), summary AS (
        SELECT count(*)::int AS matched, count(*) FILTER (WHERE eligible)::int AS eligible,
          count(*) FILTER (WHERE NOT eligible)::int AS blocked,
          md5(coalesce(string_agg(id::text || ':' || version || ':' || source_version || ':' || eligible, ',' ORDER BY id), '')) AS fingerprint
        FROM locked
      )`;
      const parameters: unknown[] = [scope.market, scope.status, scope.query, scope.quality, scope.ids, command.status];
      const statement = command.action === 'bulk-preview' ? `${base} SELECT * FROM summary` : `${base}, changed AS (
        UPDATE property_pool_evidence e SET status = $6, version = e.version + 1, updated_at = now()
        FROM locked l, summary summary WHERE e.id = l.id AND e.version = l.version AND l.eligible
          AND summary.fingerprint = $7 AND summary.matched = (SELECT count(*) FROM targets)
        RETURNING e.*
      ), recorded AS (
        INSERT INTO property_pool_events(entity, entity_id, action, actor, reason, snapshot)
        SELECT 'evidence', id, $6, $8, $9, to_jsonb(changed) FROM changed RETURNING entity_id
      ) SELECT summary.*, (SELECT count(*)::int FROM recorded) AS changed FROM summary`;
      if (command.action === 'bulk-review') parameters.push(command.fingerprint, actor, command.reason);
      const row = (await sql.query(statement, parameters))[0];
      if (!row || (command.action === 'bulk-review' && (row.fingerprint !== command.fingerprint || Number(row.changed) !== Number(row.eligible)))) throw new Error('conflict');
      return { matched: Number(row.matched), eligible: Number(row.eligible), blocked: Number(row.blocked), fingerprint: String(row.fingerprint), ...(command.action === 'bulk-review' ? { changed: Number(row.changed) } : {}) };
    },
    async history(entity: 'source' | 'evidence', id: string): Promise<AuditEvent[]> {
      const rows = await sql.query(`SELECT * FROM (SELECT * FROM property_pool_events WHERE entity = $1 AND entity_id = $2::uuid ORDER BY id DESC LIMIT 100) recent ORDER BY id`, [entity, id]);
      return rows.map((row) => ({ id: String(row.id), action: String(row.action), actor: String(row.actor), reason: String(row.reason), createdAt: timestamp(row.created_at), snapshot: row.snapshot as Row }));
    },
    async mutate(command: Command, actor: string): Promise<{ id: string; version: number }> {
      let statement: string; let parameters: unknown[];
      if (command.action === 'create-source') {
        statement = audit(`INSERT INTO property_pool_sources(id, name, url, kind) VALUES ($5::uuid, $6, $7, $8) RETURNING *`);
        parameters = ['source', 'created', actor, '출처 등록', randomUUID(), command.input.name, new URL(command.input.url).href, command.input.kind];
      } else if (command.action === 'create-evidence') {
        statement = audit(`INSERT INTO property_pool_evidence(id, source_id, data, fingerprint)
          SELECT $5::uuid, id, $7::jsonb, $8 FROM property_pool_sources WHERE id = $6::uuid AND status NOT IN ('withdrawn', 'rejected') RETURNING *`);
        parameters = ['evidence', 'created', actor, '자료 등록', randomUUID(), command.input.sourceId, JSON.stringify(command.input), fingerprint(command.input)];
      } else if (command.action === 'correct') {
        statement = audit(`UPDATE property_pool_evidence SET source_id = $7::uuid, data = $8::jsonb, fingerprint = $9,
          status = 'pending', version = version + 1, updated_at = now()
          WHERE id = $5::uuid AND version = $6 AND status <> 'withdrawn'
          AND EXISTS (SELECT 1 FROM property_pool_sources WHERE id = $7::uuid AND status NOT IN ('withdrawn', 'rejected')) RETURNING *`);
        parameters = ['evidence', 'corrected', actor, command.reason, command.id, command.version, command.input.sourceId, JSON.stringify(command.input), fingerprint(command.input)];
      } else {
        // The table identifier is selected only from this closed, parsed union.
        const table = command.entity === 'source' ? 'property_pool_sources' : 'property_pool_evidence';
        const approvalGate = command.entity === 'evidence'
          ? `AND ($7 <> 'approved' OR (data->>'expiresOn' >= to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')
            AND data->>'observedOn' <= to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD')
            AND EXISTS (SELECT 1 FROM property_pool_sources s WHERE s.id = source_id AND s.status = 'approved')
            AND id IN (${classified} SELECT id FROM classified WHERE quality = 'qualified')))` : '';
        statement = audit(`UPDATE ${table} SET status = $7, version = version + 1, updated_at = now()
          WHERE id = $5::uuid AND version = $6 AND status <> 'withdrawn' AND status <> $7 ${approvalGate} RETURNING *`);
        parameters = [command.entity, command.status, actor, command.reason, command.id, command.version, command.status];
      }
      try {
        const rows = await sql.query(statement, parameters);
        const row = rows[0];
        if (!row) throw new Error('conflict');
        return { id: String(row.id), version: Number(row.version) };
      } catch (error) {
        if ((error as { code?: string })?.code === '23505') throw new Error('conflict');
        throw error;
      }
    },
  };
}
