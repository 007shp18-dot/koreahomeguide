import { isId, markets, statuses } from './contract';
import { qualityLabels } from './quality';
export type BulkScope = { market: string; status: string; query: string; quality: string; ids: string[] | null };
export type BulkCommand = { action: 'bulk-preview' | 'bulk-review'; scope: BulkScope; status: 'approved' | 'rejected'; reason: string; fingerprint: string };
export type BulkPreview = { matched: number; eligible: number; blocked: number; fingerprint: string };
export function parseBulk(value: unknown): BulkCommand | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as BulkCommand;
  if (!['bulk-preview', 'bulk-review'].includes(v.action) || !['approved', 'rejected'].includes(v.status)
    || typeof v.reason !== 'string' || v.reason.trim() !== v.reason || v.reason.length < 3 || v.reason.length > 240 || /[\x00-\x1f\x7f]/u.test(v.reason)
    || typeof v.fingerprint !== 'string' || (v.action === 'bulk-review' && !/^[0-9a-f]{32}$/.test(v.fingerprint))) return null;
  const s = v.scope;
  if (!s || typeof s !== 'object' || typeof s.market !== 'string' || typeof s.status !== 'string' || typeof s.query !== 'string' || typeof s.quality !== 'string'
    || (s.market !== '' && !Object.hasOwn(markets, s.market))
    || (s.status !== '' && s.status !== 'expired' && !Object.hasOwn(statuses, s.status))
    || (s.quality !== '' && !Object.hasOwn(qualityLabels, s.quality)) || s.query.length > 120
    || !(s.ids === null || (Array.isArray(s.ids) && s.ids.length > 0 && s.ids.length <= 100 && s.ids.every(isId) && new Set(s.ids).size === s.ids.length))) return null;
  return { action: v.action, scope: { market: s.market, status: s.status, query: s.query, quality: s.quality, ids: s.ids }, status: v.status, reason: v.reason, fingerprint: v.fingerprint };
}
