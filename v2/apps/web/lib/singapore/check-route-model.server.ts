import 'server-only';

import {
  compareSingaporeCheckOffers,
  evaluateSingaporeCheckOffer,
  SINGAPORE_CHECK_MARKETS,
  type HdbRentOffer,
  type HdbResaleOffer,
  type SingaporeCheckComparison,
  type SingaporeCheckMarket,
  type SingaporeCheckOffer,
  type SingaporeCheckResult,
  type UraPrivateSaleOffer,
} from '@signedprice/singapore-property';
import type { SingaporeCheckEvidenceRepositories } from './check-evidence-repository.server';

export type SingaporeCheckQuery = Readonly<Record<string, string | readonly string[] | undefined>>;
export type SingaporeCheckCatalog = Readonly<{
  available: boolean;
  months: readonly string[];
  segments: readonly string[];
  projects: readonly Readonly<{ id: string; label: string }>[];
  districts: readonly string[];
  propertyTypes: readonly string[];
  floorRanges: readonly string[];
  saleTypes: readonly string[];
  towns: readonly string[];
  blocks: readonly Readonly<{ id: string; label: string }>[];
  flatTypes: readonly string[];
  storeyRanges: readonly string[];
}>;

export type SingaporeCheckDraft = Readonly<Record<string, string> & { market: SingaporeCheckMarket }>;
export type SingaporeCheckRouteResult =
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'invalid'; message: 'Check parameters are invalid.' }>
  | Readonly<{ kind: 'single'; offer: SingaporeCheckResult }>
  | Readonly<{ kind: 'comparison'; offers: readonly [SingaporeCheckResult, SingaporeCheckResult]; comparison: SingaporeCheckComparison }>;

export type SingaporeCheckRouteModel = Readonly<{
  mode: 'single' | 'compare';
  catalogs: Readonly<Record<SingaporeCheckMarket, SingaporeCheckCatalog>>;
  drafts: Readonly<{ a: SingaporeCheckDraft; b: SingaporeCheckDraft }>;
  result: SingaporeCheckRouteResult;
}>;

const emptyCatalog = (): SingaporeCheckCatalog => Object.freeze({
  available: false, months: [], segments: [], projects: [], districts: [], propertyTypes: [],
  floorRanges: [], saleTypes: [], towns: [], blocks: [], flatTypes: [], storeyRanges: [],
});
const unique = (values: readonly string[]) => Object.freeze([...new Set(values)].sort((a, b) => a.localeCompare(b, 'en')));
const pairs = (values: readonly Readonly<{ id: string; label: string }>[]) => Object.freeze([...new Map(values.map((value) => [value.id, value])).values()].sort((a, b) => a.label.localeCompare(b.label, 'en')));

function catalogs(repositories: SingaporeCheckEvidenceRepositories): Readonly<Record<SingaporeCheckMarket, SingaporeCheckCatalog>> {
  const ura = repositories.get('ura-private-sale');
  const resale = repositories.get('hdb-resale');
  const rent = repositories.get('hdb-rent');
  return Object.freeze({
    'ura-private-sale': ura === null ? emptyCatalog() : Object.freeze({
      ...emptyCatalog(), available: true, months: unique(ura.records.map((r) => r.month)),
      segments: unique(ura.records.map((r) => r.marketSegment)), projects: pairs(ura.records.map((r) => ({ id: r.projectId, label: r.project }))),
      districts: unique(ura.records.map((r) => r.district)), propertyTypes: unique(ura.records.map((r) => r.propertyType)),
      floorRanges: unique(ura.records.map((r) => r.floorRange)), saleTypes: unique(ura.records.map((r) => r.saleType)),
    }),
    'hdb-resale': resale === null ? emptyCatalog() : Object.freeze({
      ...emptyCatalog(), available: true, months: unique(resale.records.map((r) => r.month)), towns: unique(resale.records.map((r) => r.town)),
      blocks: pairs(resale.records.map((r) => ({ id: r.blockId, label: `${r.block} ${r.street}` }))), flatTypes: unique(resale.records.map((r) => r.flatType)),
      storeyRanges: unique(resale.records.map((r) => r.storeyRange)),
    }),
    'hdb-rent': rent === null ? emptyCatalog() : Object.freeze({
      ...emptyCatalog(), available: true, months: unique(rent.records.map((r) => r.month)), towns: unique(rent.records.map((r) => r.town)),
      blocks: pairs(rent.records.map((r) => ({ id: r.blockId, label: `${r.block} ${r.street}` }))), flatTypes: unique(rent.records.map((r) => r.flatType)),
    }),
  });
}

function draft(query: SingaporeCheckQuery, prefix: 'a' | 'b', fallback: SingaporeCheckMarket): SingaporeCheckDraft {
  const value: Record<string, string> = {};
  for (const [key, raw] of Object.entries(query)) {
    if (!key.startsWith(`${prefix}-`) || typeof raw !== 'string') continue;
    value[key.slice(2)] = raw;
  }
  const market = SINGAPORE_CHECK_MARKETS.includes(value.market as SingaporeCheckMarket)
    ? value.market as SingaporeCheckMarket : fallback;
  return Object.freeze({ ...value, market });
}

function positive(value: string | undefined): number | null {
  if (value === undefined || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
const optional = (value: string | undefined) => value === undefined || value === '' ? null : value;

function offerFromDraft(value: SingaporeCheckDraft): SingaporeCheckOffer | null {
  const amountSgd = positive(value.amount);
  if (amountSgd === null) return null;
  const endMonth = value.month || undefined;
  if (value.market === 'ura-private-sale') {
    const minimum = positive(value['area-min']); const maximum = positive(value['area-max']);
    if (value.segment === undefined || !['CCR', 'RCR', 'OCR'].includes(value.segment) || !value.district || !value['property-type'] || minimum === null || maximum === null) return null;
    return Object.freeze({ market: value.market, amountSgd, endMonth, filters: Object.freeze({
      marketSegment: value.segment as UraPrivateSaleOffer['filters']['marketSegment'], projectId: optional(value.project), district: value.district,
      propertyType: value['property-type'], areaBand: Object.freeze({ minimum, maximum }), floorRange: optional(value['floor-range']), saleType: optional(value['sale-type']),
    }) });
  }
  if (!value.town || !value['flat-type']) return null;
  if (value.market === 'hdb-rent') return Object.freeze({ market: value.market, amountSgd, endMonth, filters: Object.freeze({ town: value.town, blockId: optional(value.block), flatType: value['flat-type'] }) } satisfies HdbRentOffer);
  const minimum = positive(value['area-min']); const maximum = positive(value['area-max']);
  if (minimum === null || maximum === null) return null;
  return Object.freeze({ market: value.market, amountSgd, endMonth, filters: Object.freeze({ town: value.town, blockId: optional(value.block), flatType: value['flat-type'], storeyRange: optional(value['storey-range']), areaBand: Object.freeze({ minimum, maximum }) }) } satisfies HdbResaleOffer);
}

function evaluate(repositories: SingaporeCheckEvidenceRepositories, offer: SingaporeCheckOffer): SingaporeCheckResult {
  const artifact = repositories.get(offer.market);
  if (artifact === null) return Object.freeze({ status: 'unavailable', market: offer.market, reason: 'evidence-unavailable', message: 'Verified evidence for the selected Singapore market is unavailable.' });
  return evaluateSingaporeCheckOffer({ artifact, offer });
}

export function buildSingaporeCheckRouteModel(repositories: SingaporeCheckEvidenceRepositories, query: SingaporeCheckQuery): SingaporeCheckRouteModel {
  const invalidShape = Object.values(query).some((value) => Array.isArray(value));
  const mode = query.mode === 'compare' ? 'compare' : 'single';
  const drafts = Object.freeze({ a: draft(query, 'a', 'ura-private-sale'), b: draft(query, 'b', 'hdb-rent') });
  let result: SingaporeCheckRouteResult = Object.freeze({ kind: 'empty' });
  if (query.submitted === '1') {
    if (invalidShape || (query.mode !== undefined && query.mode !== 'single' && query.mode !== 'compare')) result = Object.freeze({ kind: 'invalid', message: 'Check parameters are invalid.' });
    else {
      const left = offerFromDraft(drafts.a);
      const right = mode === 'compare' ? offerFromDraft(drafts.b) : null;
      if (left === null || (mode === 'compare' && right === null)) result = Object.freeze({ kind: 'invalid', message: 'Check parameters are invalid.' });
      else {
        const leftResult = evaluate(repositories, left);
        result = mode === 'single' ? Object.freeze({ kind: 'single', offer: leftResult }) : (() => {
          const rightResult = evaluate(repositories, right!);
          return Object.freeze({ kind: 'comparison', offers: Object.freeze([leftResult, rightResult]) as readonly [SingaporeCheckResult, SingaporeCheckResult], comparison: compareSingaporeCheckOffers(leftResult, rightResult) });
        })();
      }
    }
  }
  return Object.freeze({ mode, catalogs: catalogs(repositories), drafts, result });
}
