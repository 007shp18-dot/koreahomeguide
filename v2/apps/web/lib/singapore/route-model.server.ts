import 'server-only';

import { createEvidenceDescriptor } from '@signedprice/market-core';
import type {
  SingaporeProjectSummary,
  SingaporePublishedSummary,
  SingaporeSnapshotRecord,
} from '@signedprice/singapore-property';

import type { SingaporeSnapshotRepository } from './snapshot-repository.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
  type SingaporeEntryModel,
  type SingaporeEvidenceModel,
  type SingaporeExploreModel,
  type SingaporeProjectListItem,
  type SingaporeProjectModel,
  type SingaporeSegmentModel,
  type SingaporeTransactionDisplay,
} from './route-types';

const currency = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 1 });
const LIMITATIONS = Object.freeze([
  'Private residential sales only; HDB resale and rental evidence is shown in separate layers.',
  'Reported transactions may be revised; unsupported product claims are not substituted.',
  'PSF is derived from reported SGD price and square metres; PSM uses the same source area basis.',
]);

function periodLabel(period: string): string {
  const [from, to] = period.split('..');
  const format = (month: string | undefined) => {
    if (month === undefined || !/^\d{4}-\d{2}$/.test(month)) return 'Unavailable';
    return new Intl.DateTimeFormat('en-SG', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${month}-01T00:00:00.000Z`));
  };
  return `${format(from)}–${format(to)}`;
}

function evidence(
  repository: SingaporeSnapshotRepository,
  state: 'ready' | 'insufficient' = 'ready',
): SingaporeEvidenceModel {
  const context = repository.getContext();
  const descriptor = createEvidenceDescriptor({
    marketId: 'sg-singapore',
    provider: 'URA',
    dataset: 'private residential sale transactions',
    period: context.period,
    generatedAt: context.generatedAt,
    state,
    publicationMinimum: context.publicationMinimum,
    methodologyId: 'sg-ura-private-sale-summary-v1',
    rightsPolicyId: 'sg-ura-private-sale-v1',
  });
  return Object.freeze({
    provider: 'URA',
    dataset: 'private residential sale transactions',
    period: context.period,
    generatedAt: context.generatedAt,
    publicationMinimum: context.publicationMinimum,
    rightsPolicyId: 'sg-ura-private-sale-v1',
    limitations: LIMITATIONS,
    correctionHref: SINGAPORE_CORRECTION_HREF,
    descriptor,
  });
}

function display(summary: Extract<SingaporePublishedSummary, { published: true }>) {
  return Object.freeze({
    sampleLabel: `${summary.n} reported sale transactions`,
    medianPriceLabel: currency.format(summary.medianPriceSgd),
    middlePriceLabel: `${currency.format(summary.p25PriceSgd)}–${currency.format(summary.p75PriceSgd)}`,
    medianPsfLabel: `SGD ${number.format(summary.medianPsf)} PSF`,
    middlePsfLabel: `SGD ${number.format(summary.p25Psf)}–${number.format(summary.p75Psf)} PSF`,
  });
}

function projectListItem(project: SingaporeProjectSummary): SingaporeProjectListItem {
  const area = project.marketSegment.toLowerCase() as Lowercase<typeof project.marketSegment>;
  return Object.freeze({
    id: project.id,
    name: project.project,
    street: project.street,
    district: project.district,
    n: project.n,
    state: project.published ? 'published' : 'insufficient',
    href: `/sg/singapore/explore/${area}/${project.id}/`,
    medianPriceLabel: project.medianPriceSgd === null ? null : currency.format(project.medianPriceSgd),
    medianPsfLabel: project.medianPsf === null ? null : `SGD ${number.format(project.medianPsf)} PSF`,
  });
}

function segmentHref(segment: 'CCR' | 'RCR' | 'OCR'):
  '/sg/singapore/explore/ccr/' | '/sg/singapore/explore/rcr/' | '/sg/singapore/explore/ocr/' {
  switch (segment) {
    case 'CCR': return '/sg/singapore/explore/ccr/';
    case 'RCR': return '/sg/singapore/explore/rcr/';
    case 'OCR': return '/sg/singapore/explore/ocr/';
  }
}

const SALE_LABEL = { new_sale: 'New sale', sub_sale: 'Subsale', resale: 'Resale' } as const;
const PROPERTY_LABEL = {
  apartment: 'Apartment',
  condominium: 'Condominium',
  executive_condominium: 'Executive condominium',
  detached: 'Detached house',
  semi_detached: 'Semi-detached house',
  terrace: 'Terrace house',
  strata_detached: 'Strata detached house',
  strata_semi_detached: 'Strata semi-detached house',
  strata_terrace: 'Strata terrace house',
} as const;

function transactionDisplay(record: SingaporeSnapshotRecord): SingaporeTransactionDisplay {
  const contractMonth = new Intl.DateTimeFormat('en-SG', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${record.contractMonth}T00:00:00.000Z`));
  return Object.freeze({
    contractMonthLabel: contractMonth,
    priceLabel: currency.format(record.priceSgd),
    areaLabel: `${number.format(record.areaSqm)} m²`,
    psfLabel: `SGD ${number.format(record.psf)} PSF`,
    psmLabel: `SGD ${number.format(Math.round(record.priceSgd / record.areaSqm))} PSM`,
    saleTypeLabel: SALE_LABEL[record.saleType],
    propertyTypeLabel: PROPERTY_LABEL[record.propertyType],
    areaBasisLabel: record.areaBasis === 'strata' ? 'Strata area' : 'Land area',
    tenureLabel: record.tenure,
    floorRangeLabel: record.floorRange,
    source: record,
  });
}

export function buildSingaporeEntryModel(
  repository: SingaporeSnapshotRepository | null,
): SingaporeEntryModel {
  if (repository === null) return Object.freeze({
    status: 'unavailable', message: SINGAPORE_UNAVAILABLE_MESSAGE, correctionHref: SINGAPORE_CORRECTION_HREF,
  });
  const context = repository.getContext();
  return Object.freeze({
    status: 'ready',
    city: 'Singapore',
    currency: 'SGD',
    transactionLabel: `${context.transactions} private residential sale transactions`,
    projectLabel: `${context.projects} projects`,
    periodLabel: periodLabel(context.period),
    exploreHref: '/sg/singapore/explore/',
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository),
  });
}

export function buildSingaporeExploreModel(
  repository: SingaporeSnapshotRepository | null,
): SingaporeExploreModel {
  if (repository === null) return Object.freeze({
    status: 'unavailable', message: SINGAPORE_UNAVAILABLE_MESSAGE, correctionHref: SINGAPORE_CORRECTION_HREF,
  });
  const context = repository.getContext();
  return Object.freeze({
    status: 'ready',
    transactionLabel: `${context.transactions} private residential sale transactions`,
    periodLabel: periodLabel(context.period),
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository),
    segments: Object.freeze(repository.listSegments().map((segment) => Object.freeze({
      code: segment.segment,
      href: segmentHref(segment.segment),
      n: segment.n,
      projectCount: segment.projects,
      state: segment.published ? 'published' : 'insufficient',
      medianPriceLabel: segment.medianPriceSgd === null ? null : currency.format(segment.medianPriceSgd),
      medianPsfLabel: segment.medianPsf === null ? null : `SGD ${number.format(segment.medianPsf)} PSF`,
      projects: Object.freeze(repository.listProjects(segment.segment)
        .map(projectListItem)
        .sort((left, right) => right.n - left.n || left.name.localeCompare(right.name))
        .slice(0, 18)),
    }))),
  });
}

export function buildSingaporeSegmentModel(
  repository: SingaporeSnapshotRepository,
  segment: string,
): SingaporeSegmentModel | null {
  const identity = repository.getSegment(segment);
  if (identity === null) return null;
  if (!identity.published) return Object.freeze({
    status: 'insufficient',
    identity,
    count: identity.n,
    threshold: 5,
    reason: 'minimum_sample_not_met',
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository, 'insufficient'),
  });
  return Object.freeze({
    status: 'ready',
    identity,
    display: display(identity),
    projects: Object.freeze(repository.listProjects(identity.segment).map(projectListItem)),
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository),
  });
}

export function buildSingaporeProjectModel(
  repository: SingaporeSnapshotRepository,
  segment: string,
  projectId: string,
): SingaporeProjectModel | null {
  const identity = repository.getProject(segment, projectId);
  if (identity === null) return null;
  if (!identity.published) return Object.freeze({
    status: 'insufficient',
    identity,
    count: identity.n,
    threshold: 5,
    reason: 'minimum_sample_not_met',
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository, 'insufficient'),
  });
  return Object.freeze({
    status: 'ready',
    identity,
    display: display(identity),
    transactions: Object.freeze(repository.listProjectRecords(segment, projectId).map(transactionDisplay)),
    correctionHref: SINGAPORE_CORRECTION_HREF,
    evidence: evidence(repository),
  });
}
