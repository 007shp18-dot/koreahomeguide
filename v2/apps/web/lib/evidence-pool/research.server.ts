import 'server-only';
import { describeToolResearchBands, describeResearchBand, type ResearchCurrency, type NormalizedToolResearchSnapshot } from '../tool-research/contract';
import type { SqlPort } from './repository.server';
export type ResearchDashboard = {
  total: number;
  groups: { market: string; tool: string; count: number }[];
  distributions: { market: string; tool: string; currency: string; kind: string; field: string; value: string; label: string; count: number }[];
  recent: { tool: string; market: string; createdAt: string; expiresAt: string; bands: Record<string, string>; categories: Record<string, string> }[];
};
export async function researchDashboard(sql: SqlPort, market: string, tool: string): Promise<ResearchDashboard> {
  const retained = `WITH retained AS (SELECT tool, market, currency, payload, created_at, expires_at FROM tool_research_submissions
    WHERE expires_at > now() AND created_at > now() - interval '90 days'
    AND source = 'user_scenario' AND purpose = 'product_research' AND consent_granted_at IS NOT NULL
    AND consent_version = 'tool-research-consent-2026-09-09'
    AND ($1::text = '' OR market = $1) AND ($2::text = '' OR tool = $2))`;
  const params = [market, tool];
  const [groups, distributions, recent] = await Promise.all([
    sql.query(`${retained} SELECT market, tool, count(*)::int AS count FROM retained GROUP BY market, tool ORDER BY count(*) DESC, market, tool`, params),
    sql.query(`${retained} SELECT market, tool, currency, kind, key AS field, value, count(*)::int AS count FROM retained
      CROSS JOIN LATERAL (SELECT 'band' AS kind, key, value FROM jsonb_each_text(payload->'bands')
        UNION ALL SELECT 'category', key, value FROM jsonb_each_text(payload->'categories')) fields
      GROUP BY market, tool, currency, kind, key, value ORDER BY market, tool, kind, key, value`, params),
    sql.query(`${retained} SELECT tool, market, payload, created_at, expires_at FROM retained ORDER BY created_at DESC, tool, market LIMIT 25`, params),
  ]);
  const mapped = groups.map(r => ({ market: String(r.market), tool: String(r.tool), count: Number(r.count) }));
  return { total: mapped.reduce((sum, r) => sum + r.count, 0), groups: mapped,
    distributions: distributions.map(r => ({ market: String(r.market), tool: String(r.tool), currency: String(r.currency), kind: String(r.kind), field: String(r.field), value: String(r.value), label: r.kind === 'band' ? describeResearchBand(String(r.value), r.currency as ResearchCurrency) : String(r.value), count: Number(r.count) })),
    recent: recent.map(r => { const snapshot = r.payload as NormalizedToolResearchSnapshot; return {
      tool: String(r.tool), market: String(r.market), createdAt: new Date(String(r.created_at)).toISOString(), expiresAt: new Date(String(r.expires_at)).toISOString(),
      bands: { ...describeToolResearchBands(snapshot) }, categories: { ...snapshot.categories } as Record<string, string>,
    }; }),
  };
}
