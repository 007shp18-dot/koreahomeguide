import 'server-only';
import { retainedResearchPredicate } from '../tool-research/retention.server';
import { classified } from './query.server';
import type { SqlPort } from './repository.server';

export type ResearchPriority = {
  market: string;
  directShares: number;
  comparisonShares: number;
  lowEvidenceShares: number;
  approvedEvidence: number;
  incompleteEvidence: number;
  outdatedEvidence: number;
  duplicateEvidence: number;
  pendingEvidence: number;
};

// Counts are rebuilt from current rows, not a materialized historical audience.
// Global passport shares are separately labelled and never called direct demand.
export async function researchPriorities(sql: SqlPort, market: string, tool: string): Promise<ResearchPriority[]> {
  const rows = await sql.query(`${classified}, retained AS (
    SELECT market, tool, payload FROM tool_research_submissions
    WHERE ${retainedResearchPredicate('now()')}
      AND ($1::text = '' OR market = $1) AND ($2::text = '' OR tool = $2)
  ), markets(market, pool_market, sample_field) AS (
    VALUES ('kr-seoul','seoul','seoulSample'), ('sg-singapore','singapore','singaporeSample'), ('ae-dubai','dubai','dubaiSample')
  )
  SELECT m.market,
    (SELECT count(*)::int FROM retained r WHERE r.market = m.market) AS direct_shares,
    (SELECT count(*)::int FROM retained r WHERE r.market = 'global' AND r.tool = 'passport') AS comparison_shares,
    (SELECT count(*)::int FROM retained r WHERE
      (r.market = m.market AND EXISTS (
        SELECT 1 FROM jsonb_each_text(r.payload->'bands') b
        WHERE b.key IN ('sample','sampleA','sampleB') AND b.value = 'sample-0-4'))
      OR (r.market = 'global' AND r.tool = 'passport' AND r.payload->'bands'->>m.sample_field = 'sample-0-4')) AS low_evidence_shares,
    count(*) FILTER (WHERE e.quality = 'qualified' AND e.status = 'approved' AND s.status = 'approved')::int AS approved_evidence,
    count(*) FILTER (WHERE e.quality = 'incomplete')::int AS incomplete_evidence,
    count(*) FILTER (WHERE e.quality = 'outdated')::int AS outdated_evidence,
    count(*) FILTER (WHERE e.quality = 'duplicate')::int AS duplicate_evidence,
    count(*) FILTER (WHERE e.status = 'pending')::int AS pending_evidence
  FROM markets m
  LEFT JOIN classified e ON e.data->>'market' = m.pool_market AND e.status NOT IN ('withdrawn','rejected')
  LEFT JOIN property_pool_sources s ON s.id = e.source_id
  WHERE ($1::text IN ('','global') OR m.market = $1)
  GROUP BY m.market, m.sample_field
  ORDER BY direct_shares DESC, low_evidence_shares DESC,
    (count(*) FILTER (WHERE e.quality IN ('incomplete','outdated'))) DESC, m.market`, [market, tool]);
  return rows.map(r => ({
    market: String(r.market), directShares: Number(r.direct_shares), comparisonShares: Number(r.comparison_shares),
    lowEvidenceShares: Number(r.low_evidence_shares), approvedEvidence: Number(r.approved_evidence),
    incompleteEvidence: Number(r.incomplete_evidence), outdatedEvidence: Number(r.outdated_evidence),
    duplicateEvidence: Number(r.duplicate_evidence), pendingEvidence: Number(r.pending_evidence),
  }));
}
