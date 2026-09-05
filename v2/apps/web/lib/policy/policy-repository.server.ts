import 'server-only';

import type { PolicyGroups, PolicyRecord } from './policy-types';

const dayMs = 86_400_000;
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function dateMs(value: string, label: string): number {
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) throw new TypeError(`Invalid policy ${label}.`);
  return parsed;
}

export function validatePolicyLifecycle(record: PolicyRecord): PolicyRecord {
  if (!identifier.test(record.id) || !identifier.test(record.slug)) {
    throw new TypeError('Invalid policy identity.');
  }
  const announced = dateMs(record.announcedOn, 'announcement date');
  dateMs(record.lastCheckedOn, 'last checked date');
  if ((record.status === 'effective' || record.status === 'amended') && record.effectiveOn === null) {
    throw new TypeError('An effective policy requires an effective date.');
  }
  if (record.enactedOn !== null && dateMs(record.enactedOn, 'enacted date') < announced) {
    throw new TypeError('Policy enactment cannot precede announcement.');
  }
  if (record.effectiveOn !== null && dateMs(record.effectiveOn, 'effective date') < announced) {
    throw new TypeError('Policy effective date cannot precede announcement.');
  }
  if (record.status === 'expired' && record.expiresOn === null) {
    throw new TypeError('An expired policy requires an expiry date.');
  }
  if (record.expiresOn !== null && dateMs(record.expiresOn, 'expiry date') < announced) {
    throw new TypeError('Policy expiry cannot precede announcement.');
  }
  let sourceUrl: URL;
  try { sourceUrl = new URL(record.source.href); } catch {
    throw new TypeError('Policy source must be an official HTTPS URL.');
  }
  if (sourceUrl.protocol !== 'https:') {
    throw new TypeError('Policy source must be an official HTTPS URL.');
  }
  let previous = -Infinity;
  for (const event of record.events) {
    const current = dateMs(event.date, 'event date');
    if (current < announced || current < previous) {
      throw new TypeError('Policy events must follow announcement in date order.');
    }
    previous = current;
  }
  return record;
}

export type PolicyRepository = Readonly<{
  list(): readonly PolicyRecord[];
  get(slug: string): PolicyRecord | null;
  group(referenceDate: string): PolicyGroups;
}>;

export function createPolicyRepository(records: readonly PolicyRecord[]): PolicyRepository {
  const validated = Object.freeze(records.map(validatePolicyLifecycle));
  if (new Set(validated.map(({ id }) => id)).size !== validated.length
    || new Set(validated.map(({ slug }) => slug)).size !== validated.length) {
    throw new TypeError('Duplicate policy identity.');
  }
  return Object.freeze({
    list: () => validated,
    get: (slug) => validated.find((record) => record.slug === slug) ?? null,
    group(referenceDate) {
      const now = dateMs(referenceDate, 'reference date');
      const effectiveSoon: PolicyRecord[] = [];
      const recentlyChanged: PolicyRecord[] = [];
      const active: PolicyRecord[] = [];
      const archive: PolicyRecord[] = [];
      for (const record of validated) {
        if (record.status === 'expired') {
          archive.push(record);
          continue;
        }
        const effective = record.effectiveOn === null ? null : dateMs(record.effectiveOn, 'effective date');
        if (effective !== null && effective >= now && effective <= now + 90 * dayMs) {
          effectiveSoon.push(record);
          continue;
        }
        const latestEvent = Math.max(...record.events.map(({ date }) => dateMs(date, 'event date')));
        if (latestEvent <= now && latestEvent >= now - 90 * dayMs && record.status === 'amended') {
          recentlyChanged.push(record);
          continue;
        }
        active.push(record);
      }
      const byDate = (left: PolicyRecord, right: PolicyRecord) => right.announcedOn.localeCompare(left.announcedOn);
      return Object.freeze({
        effectiveSoon: Object.freeze(effectiveSoon.sort(byDate)),
        recentlyChanged: Object.freeze(recentlyChanged.sort(byDate)),
        active: Object.freeze(active.sort(byDate)),
        archive: Object.freeze(archive.sort(byDate)),
      });
    },
  });
}

export const PUBLIC_POLICY_RECORDS: readonly PolicyRecord[] = Object.freeze([
  Object.freeze({
    id: 'korea-rental-deposit-protection-status',
    slug: 'korea-rental-deposit-protection-status',
    marketId: 'kr-seoul',
    title: 'Korea rental-deposit protection: current verification status',
    summary: 'Possession, resident reporting, a fixed date and a guarantee are separate checks; verify the current sequence for the exact tenant and home.',
    status: 'effective',
    announcedOn: '1981-03-05',
    enactedOn: '1981-03-05',
    effectiveOn: '1981-03-05',
    expiresOn: null,
    lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Residential tenants', 'Foreign residents', 'Residential landlords']),
    source: Object.freeze({
      publisher: 'Korea National Law Information Center',
      title: 'Housing Lease Protection Act',
      href: 'https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=258519&viewCls=engLsInfoR',
      checkedAt: '2026-09-04',
    }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '1981-03-05', label: 'Act promulgated' }),
      Object.freeze({ type: 'effective', date: '1981-03-05', label: 'Protection framework took effect' }),
    ]),
    beforeAfter: null,
  }),
  Object.freeze({
    id: 'korea-foreign-property-reporting-status', slug: 'korea-foreign-property-reporting-status', marketId: 'kr-seoul',
    title: 'Korea foreign-buyer reporting: February 2026 change',
    summary: 'Foreign-buyer transaction reports request expanded identity, residence and overseas-funding information from 10 February 2026.',
    status: 'effective',
    announcedOn: '2026-02-09', enactedOn: null, effectiveOn: '2026-02-10', expiresOn: null, lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Foreign buyers', 'Foreign entities', 'Transaction filing agents']),
    source: Object.freeze({
      publisher: 'Ministry of Land, Infrastructure and Transport', title: 'Expanded foreign real-estate transaction reporting',
      href: 'https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95091684&lcmspage=1', checkedAt: '2026-09-04',
    }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2026-02-09', label: 'Expanded fields announced' }),
      Object.freeze({ type: 'effective', date: '2026-02-10', label: 'Expanded reporting took effect' }),
    ]),
    beforeAfter: Object.freeze({
      beforeLabel: 'Before 10 February 2026', beforeValue: 'The previous foreign-buyer field set applied.',
      afterLabel: 'From 10 February 2026', afterValue: 'Expanded identity, residence and overseas-funding fields apply.',
    }),
  }),
  Object.freeze({
    id: 'seoul-land-transaction-permit-status', slug: 'seoul-land-transaction-permit-status', marketId: 'kr-seoul',
    title: 'Seoul land-transaction permission: current designation check',
    summary: 'Current applicability must be checked against Seoul’s designation registry and the exact parcel, use, size and contract date.',
    status: 'amended', announcedOn: '2026-04-02', enactedOn: null, effectiveOn: '2026-04-27', expiresOn: '2027-04-26', lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Buyers in designated areas', 'Sellers in designated areas']),
    source: Object.freeze({ publisher: 'Seoul Metropolitan Government', title: 'Land transaction permission designation status', href: 'https://land.seoul.go.kr/land/other/appointStatusSeoul.do', checkedAt: '2026-09-04' }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2026-04-02', label: 'Extension announced for named redevelopment areas' }),
      Object.freeze({ type: 'amended', date: '2026-04-27', label: 'Extended designation period began' }),
    ]), beforeAfter: null,
  }),
  Object.freeze({
    id: 'korea-housing-finance-rules-status', slug: 'korea-housing-finance-rules-status', marketId: 'kr-seoul',
    title: 'Korea housing-finance rules: current conditional limits',
    summary: 'Lending treatment varies by regulated area, borrower, property count, product and effective date; one blanket ratio is unsafe.',
    status: 'effective', announcedOn: '2026-06-30', enactedOn: null, effectiveOn: '2026-07-01', expiresOn: null, lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Mortgage applicants', 'First-time buyers', 'Owners of multiple homes']),
    source: Object.freeze({ publisher: 'Financial Services Commission', title: 'Housing finance measures effective July 2026', href: 'https://www.fsc.go.kr/no010101/87222', checkedAt: '2026-09-04' }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2026-06-30', label: 'Measures announced' }),
      Object.freeze({ type: 'effective', date: '2026-07-01', label: 'Specified measures took effect' }),
    ]), beforeAfter: null,
  }),
  Object.freeze({
    id: 'singapore-absd-policy-status', slug: 'singapore-absd-policy-status', marketId: 'sg-singapore',
    title: 'Singapore ABSD: current buyer-profile check',
    summary: 'Additional Buyer’s Stamp Duty depends on buyer profile, existing residential holdings and the transaction circumstances.',
    status: 'effective', announcedOn: '2023-04-26', enactedOn: null, effectiveOn: '2023-04-27', expiresOn: null, lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Residential buyers', 'Foreign buyers', 'Entities and trustees']),
    source: Object.freeze({ publisher: 'Inland Revenue Authority of Singapore', title: 'Additional Buyer’s Stamp Duty', href: 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29', checkedAt: '2026-09-04' }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2023-04-26', label: 'Revised measures announced' }),
      Object.freeze({ type: 'effective', date: '2023-04-27', label: 'Revised buyer-profile rates took effect' }),
    ]), beforeAfter: Object.freeze({ beforeLabel: 'Before 27 April 2023', beforeValue: 'Previous buyer-profile rates applied.', afterLabel: 'From 27 April 2023', afterValue: 'Revised IRAS rates apply by buyer profile.' }),
  }),
  Object.freeze({
    id: 'singapore-hdb-private-owner-waitout-status', slug: 'singapore-hdb-private-owner-waitout-status', marketId: 'sg-singapore',
    title: 'HDB private-owner wait-out period removed',
    summary: 'HDB removed the temporary 15-month wait-out period for private residential owners buying non-subsidised resale flats in July 2026.',
    status: 'amended', announcedOn: '2026-07-27', enactedOn: null, effectiveOn: '2026-07-27', expiresOn: null, lastCheckedOn: '2026-09-04',
    affectedGroups: Object.freeze(['Private residential property owners', 'Non-subsidised resale-flat buyers']),
    source: Object.freeze({ publisher: 'Housing & Development Board', title: 'Removal of the 15-month wait-out period', href: 'https://www.hdb.gov.sg/hdb-pulse/news/2026/removal-of-the-15-month-wait-out-period-for-private-residential-property-owners', checkedAt: '2026-09-04' }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2026-07-27', label: 'Removal announced' }),
      Object.freeze({ type: 'amended', date: '2026-07-27', label: 'Wait-out treatment changed' }),
    ]), beforeAfter: Object.freeze({ beforeLabel: 'Temporary measure', beforeValue: 'A 15-month wait-out period applied to the named buyer group.', afterLabel: 'From 27 July 2026', afterValue: 'The temporary wait-out period was removed for non-subsidised resale purchases.' }),
  }),
]);

export const policyRepository = createPolicyRepository(PUBLIC_POLICY_RECORDS);
