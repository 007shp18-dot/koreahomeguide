import { validateInfographicSpec } from '../lib/infographics/infographic-validator';
import { ENGLISH_PORTFOLIO } from './en/portfolio';
import type { EditorialPortfolioRecord } from './portfolio-types';
import { CHINESE_PORTFOLIO } from './zh-CN/portfolio';

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const route = /^\/(?:news|guides|zh-cn)\//u;

function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`Cannot publish editorial record without ${label}.`);
  }
  return value;
}

export function validatePortfolioRecord(value: unknown): EditorialPortfolioRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Cannot publish invalid editorial record.');
  }
  const record = value as EditorialPortfolioRecord;
  if (!identifier.test(requiredText(record.slug, 'a valid slug')) || record.status !== 'published') {
    throw new TypeError('Cannot publish editorial record with invalid identity or status.');
  }
  requiredText(record.id, 'an ID');
  requiredText(record.readerQuestion, 'a reader question');
  requiredText(record.reviewedBy, 'a reviewer');
  requiredText(record.reviewedAt, 'a review date');
  requiredText(record.revisionNote, 'a revision note');
  requiredText(record.bodyMarkdown, 'article body');
  if (!Array.isArray(record.sources) || record.sources.length === 0) {
    throw new TypeError('Cannot publish editorial record without a source.');
  }
  for (const source of record.sources) {
    let href: URL;
    try { href = new URL(source.href); } catch {
      throw new TypeError('Cannot publish editorial record with an invalid source.');
    }
    if (href.protocol !== 'https:') throw new TypeError('Cannot publish editorial record with a non-HTTPS source.');
    requiredText(source.checkedAt, 'a source check date');
  }
  if (!Array.isArray(record.evidenceReleaseIds) || record.evidenceReleaseIds.length === 0) {
    throw new TypeError('Cannot publish editorial record without an evidence release.');
  }
  if (!route.test(requiredText(record.canonicalHref, 'a canonical route'))) {
    throw new TypeError('Cannot publish editorial record with an invalid canonical route.');
  }
  if (record.relatedHref !== null && (!record.relatedHref.startsWith('/') || record.relatedHref.startsWith('//'))) {
    throw new TypeError('Cannot publish editorial record with an external related tool.');
  }
  if (record.type === 'data-story') {
    if (record.infographic === null) throw new TypeError('Cannot publish a Data Story without an infographic.');
    const specification = validateInfographicSpec(record.infographic);
    if (specification.locale !== record.locale
      || specification.evidenceReleaseIds.join('|') !== record.evidenceReleaseIds.join('|')) {
      throw new TypeError('Cannot publish a Data Story with mismatched infographic evidence.');
    }
  } else if (record.infographic !== null) {
    throw new TypeError('Cannot publish an infographic outside a Data Story.');
  }
  return record;
}

function duplicateFingerprint(record: EditorialPortfolioRecord): string {
  return JSON.stringify([
    record.locale,
    record.readerQuestion.trim().toLocaleLowerCase(record.locale),
    record.bodyMarkdown.trim(),
    [...record.sources.map(({ id }) => id)].sort(),
  ]);
}

export function validateEditorialPortfolio(values: readonly unknown[]): readonly EditorialPortfolioRecord[] {
  const records = values.map(validatePortfolioRecord);
  if (new Set(records.map(({ id }) => id)).size !== records.length
    || new Set(records.map(({ canonicalHref }) => canonicalHref)).size !== records.length) {
    throw new TypeError('Cannot publish duplicate editorial identity or canonical route.');
  }
  const fingerprints = records.map(duplicateFingerprint);
  if (new Set(fingerprints).size !== fingerprints.length) {
    throw new TypeError('Cannot publish duplicate reader question, source set and conclusion.');
  }
  return values as readonly EditorialPortfolioRecord[];
}

export const EDITORIAL_PORTFOLIO = Object.freeze(validateEditorialPortfolio(Object.freeze([
  ...ENGLISH_PORTFOLIO,
  ...CHINESE_PORTFOLIO,
])));

export function listPortfolioRecords(locale?: EditorialPortfolioRecord['locale']): readonly EditorialPortfolioRecord[] {
  return locale === undefined ? EDITORIAL_PORTFOLIO : EDITORIAL_PORTFOLIO.filter((record) => record.locale === locale);
}

export function getPortfolioRecord(locale: EditorialPortfolioRecord['locale'], slug: string): EditorialPortfolioRecord | null {
  return EDITORIAL_PORTFOLIO.find((record) => record.locale === locale && record.slug === slug) ?? null;
}
