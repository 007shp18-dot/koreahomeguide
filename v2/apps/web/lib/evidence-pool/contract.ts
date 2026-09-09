import { assessEvidence } from './quality';
export const markets = { seoul: '서울', singapore: '싱가포르', dubai: '두바이' } as const;
export const tiers = { essential: '필수 기반', supporting: '판단 보강', insight: '향후 분석' } as const;
export const metrics = { sale_price: '매매 가격', rent: '임대료', service_charge: '관리비', repair_cost: '수선비', transaction_cost: '취득·매도 비용' } as const;
export const bases = { asking: '호가', quoted: '견적', invoiced: '청구액', paid: '실제 지급액', registered: '공식 신고·등록값', published: '공식 공시 요금', reported: '미검증 제보' } as const;
export const units = { total: '총액', monthly: '월간', annual: '연간', sqm: '㎡당' } as const;
export const sourceKinds = { official: '공식 자료', commercial: '중개·상업 자료', community: '커뮤니티', contributed: '직접 제공 자료' } as const;
export const statuses = { pending: '검토 대기', approved: '승인', rejected: '제외', withdrawn: '철회' } as const;
export type Status = keyof typeof statuses;
export type SourceInput = { name: string; url: string; kind: keyof typeof sourceKinds };
export type EvidenceInput = {
  address?: string; housingType?: string; conditions?: string; billingPeriod?: 'monthly' | 'annual' | 'once';
  observedPrecision?: 'month' | 'day'; observedPeriod?: string;
  sourceId: string; market: keyof typeof markets; tier: keyof typeof tiers; metric: keyof typeof metrics;
  basis: keyof typeof bases; amount: number; currency: 'KRW' | 'SGD' | 'AED'; unit: keyof typeof units;
  area: string; building: string; sizeSqm: number | null; observedOn: string; expiresOn: string; url: string;
};
export type Source = SourceInput & { id: string; status: Status; version: number; createdAt: string };
export type Evidence = EvidenceInput & { id: string; status: Status; version: number; createdAt: string; sourceName: string; sourceStatus: Status; sourceKind: SourceInput['kind']; duplicate?: boolean };
export type AuditEvent = { id: string; action: string; actor: string; reason: string; createdAt: string; snapshot: Record<string, unknown> };
export type PoolData = { sources: Source[]; sourceTotal?: number; sourcePage?: number; evidence: Evidence[]; total: number; counts: Record<Status | 'expired', number>; page: number };
export type Command = { action: 'create-source'; input: SourceInput }
  | { action: 'create-evidence'; input: EvidenceInput }
  | { action: 'correct'; id: string; version: number; input: EvidenceInput; reason: string }
  | { action: 'review'; entity: 'source' | 'evidence'; id: string; version: number; status: Exclude<Status, 'pending'>; reason: string };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((key) => allowed.includes(key)) && allowed.every((key) => key in value);
}
function label(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value === value.trim() && value.length >= min && value.length <= max && !/[\x00-\x1f\x7f]/u.test(value);
}
function choice<T extends string>(value: unknown, choices: Record<T, string>): value is T {
  return typeof value === 'string' && Object.hasOwn(choices, value);
}
export function isId(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value); }
export function safeUrl(value: unknown): value is string {
  if (!label(value, 8, 1500)) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash; } catch { return false; }
}
function date(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function parseSource(value: unknown): SourceInput | null {
  const v = object(value);
  if (!v || !keys(v, ['name', 'url', 'kind']) || !label(v.name, 2, 120) || !safeUrl(v.url) || !choice(v.kind, sourceKinds)) return null;
  return { name: v.name, url: v.url, kind: v.kind };
}
export function parseEvidence(value: unknown): EvidenceInput | null {
  const v = object(value);
  if (!v) return null;
  const extraKeys = ['address', 'housingType', 'conditions', 'billingPeriod', 'observedPrecision', 'observedPeriod'].filter((key) => key in v);
  if (!keys(v, [...extraKeys, 'sourceId', 'market', 'tier', 'metric', 'basis', 'amount', 'currency', 'unit', 'area', 'building', 'sizeSqm', 'observedOn', 'expiresOn', 'url'])) return null;
  if (extraKeys.some((key) => {
    if (key === 'billingPeriod') return typeof v[key] !== 'string' || !['monthly', 'annual', 'once'].includes(v[key]);
    if (key === 'observedPrecision') return v[key] !== 'month' && v[key] !== 'day';
    if (key === 'observedPeriod') return typeof v[key] !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/u.test(v[key]);
    return !label(v[key], 0, key === 'conditions' ? 240 : 160);
  })) return null;
  if (v.observedPrecision === 'month' ? v.observedOn !== `${v.observedPeriod}-01` : v.observedPeriod !== undefined) return null;
  if (!isId(v.sourceId) || !choice(v.market, markets) || !choice(v.tier, tiers) || !choice(v.metric, metrics)
    || !choice(v.basis, bases) || !choice(v.unit, units) || !safeUrl(v.url)
    || !label(v.area, 2, 120) || !label(v.building, 0, 160)
    || typeof v.amount !== 'number' || !Number.isFinite(v.amount) || v.amount < 0 || v.amount > 1e15
    || !(v.sizeSqm === null || (typeof v.sizeSqm === 'number' && Number.isFinite(v.sizeSqm) && v.sizeSqm > 0 && v.sizeSqm <= 100000))
    || !date(v.observedOn) || !date(v.expiresOn) || v.expiresOn <= v.observedOn
    || v.currency !== { seoul: 'KRW', singapore: 'SGD', dubai: 'AED' }[v.market]) return null;
  return { ...Object.fromEntries(extraKeys.map((key) => [key, v[key]])), sourceId: v.sourceId, market: v.market, tier: v.tier, metric: v.metric, basis: v.basis, amount: v.amount,
    currency: v.currency as EvidenceInput['currency'], unit: v.unit, area: v.area, building: v.building, sizeSqm: v.sizeSqm,
    observedOn: v.observedOn, expiresOn: v.expiresOn, url: v.url };
}
export function parseCommand(value: unknown): Command | null {
  const v = object(value); if (!v) return null;
  if (v.action === 'create-source' && keys(v, ['action', 'input'])) { const input = parseSource(v.input); return input ? { action: v.action, input } : null; }
  if (v.action === 'create-evidence' && keys(v, ['action', 'input'])) { const input = parseEvidence(v.input); return input ? { action: v.action, input } : null; }
  if (!isId(v.id) || !Number.isSafeInteger(v.version) || Number(v.version) < 1 || !label(v.reason, 3, 240)) return null;
  if (v.action === 'correct' && keys(v, ['action', 'id', 'version', 'input', 'reason'])) {
    const input = parseEvidence(v.input); return input ? { action: v.action, id: v.id, version: Number(v.version), reason: v.reason, input } : null;
  }
  if (v.action === 'review' && keys(v, ['action', 'entity', 'id', 'version', 'status', 'reason'])
    && (v.entity === 'source' || v.entity === 'evidence') && choice(v.status, statuses) && v.status !== 'pending') {
    return { action: v.action, entity: v.entity, id: v.id, version: Number(v.version), status: v.status, reason: v.reason };
  }
  return null;
}
export function readiness(row: Pick<Evidence, 'status' | 'sourceStatus' | 'sourceKind' | 'expiresOn' | 'observedOn' | 'basis' | 'building' | 'sizeSqm'> & Partial<Evidence>, today: string) {
  const reasons: string[] = [];
  if (row.status !== 'approved') reasons.push('자료 미승인');
  if (row.sourceStatus !== 'approved') reasons.push('출처 미승인·철회');
  if (row.expiresOn < today) reasons.push('유효기간 만료');
  if (row.observedOn > today) reasons.push('미래 시점 자료');
  if (row.sourceKind === 'community' || row.basis === 'reported') reasons.push('정성 참고 전용');
  if (row.metric && row.area !== undefined) reasons.push(...assessEvidence(row as Evidence, today).reasons);
  else {
    if (!row.building) reasons.push('건물 정보 없음');
    if (row.sizeSqm === null) reasons.push('면적 정보 없음');
  }
  return { ready: reasons.length === 0, reasons };
}
