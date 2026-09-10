import { createHash } from 'node:crypto';

import {
  INFOGRAPHIC_TEMPLATES,
  type InfographicDatum,
  type InfographicRenderRecord,
  type InfographicSeries,
  type InfographicSpec,
} from './infographic-types';

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/u;
const sha256 = /^[a-f0-9]{64}$/u;

function object(value: unknown, label: string): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`Invalid infographic ${label}.`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`Infographic ${label} cannot be empty.`);
  }
  return value.trim();
}

function id(value: unknown, label: string): string {
  const parsed = text(value, label);
  if (!identifier.test(parsed)) throw new TypeError(`Invalid infographic ${label}.`);
  return parsed;
}

function date(value: unknown, label: string): string {
  const parsed = text(value, label);
  if (!dateOnly.test(parsed) || !Number.isFinite(Date.parse(`${parsed}T00:00:00.000Z`))) {
    throw new TypeError(`Invalid infographic ${label}.`);
  }
  return parsed;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value as Readonly<Record<string, unknown>>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, stableValue(item)]));
}

export function stableInfographicHash(spec: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(spec))).digest('hex');
}

export function validateInfographicSpec(value: unknown): InfographicSpec {
  const row = object(value, 'specification');
  const infographicId = id(row.id, 'identity');
  if (!INFOGRAPHIC_TEMPLATES.includes(row.template as InfographicSpec['template'])) {
    throw new TypeError('Invalid infographic template.');
  }
  if (row.locale !== 'en' && row.locale !== 'ko' && row.locale !== 'zh-CN') {
    throw new TypeError('Invalid infographic locale.');
  }
  if (!Array.isArray(row.evidenceReleaseIds) || row.evidenceReleaseIds.length === 0) {
    throw new TypeError('Infographic requires at least one evidence release.');
  }
  const evidenceReleaseIds = Object.freeze(row.evidenceReleaseIds.map((releaseId) => id(releaseId, 'evidence release')));
  if (new Set(evidenceReleaseIds).size !== evidenceReleaseIds.length) {
    throw new TypeError('Infographic evidence release IDs must be unique.');
  }
  const period = object(row.period, 'period');
  const periodStart = date(period.start, 'period start');
  const periodEnd = date(period.end, 'period end');
  if (periodEnd < periodStart) throw new TypeError('Infographic period end cannot precede its start.');
  if (!Array.isArray(row.series) || row.series.length === 0 || row.series.length > 5) {
    throw new TypeError('Infographic requires one to five series.');
  }
  const series: readonly InfographicSeries[] = Object.freeze(row.series.map((candidate) => {
    const seriesRow = object(candidate, 'series');
    if (!Array.isArray(seriesRow.values) || seriesRow.values.length === 0) {
      throw new TypeError('Infographic series requires values.');
    }
    const values: readonly InfographicDatum[] = Object.freeze(seriesRow.values.map((candidateDatum) => {
      const datum = object(candidateDatum, 'datum');
      const evidenceReleaseId = id(datum.evidenceReleaseId, 'datum evidence release');
      if (!evidenceReleaseIds.includes(evidenceReleaseId)) {
        throw new TypeError('Infographic datum must use a linked evidence release.');
      }
      if (typeof datum.value !== 'number' || !Number.isFinite(datum.value)) {
        throw new TypeError('Infographic values must be finite numbers.');
      }
      return Object.freeze({
        label: text(datum.label, 'datum label'),
        value: datum.value,
        evidenceReleaseId,
        ...(datum.note === undefined ? {} : { note: text(datum.note, 'datum note') }),
      });
    }));
    return Object.freeze({
      id: id(seriesRow.id, 'series identity'),
      label: text(seriesRow.label, 'series label'),
      ...(seriesRow.currency === undefined ? {} : { currency: text(seriesRow.currency, 'currency').toUpperCase() }),
      values,
    });
  }));
  if (new Set(series.map(({ id: seriesId }) => seriesId)).size !== series.length) {
    throw new TypeError('Infographic series IDs must be unique.');
  }
  const currencies = new Set(series.flatMap(({ currency }) => currency === undefined ? [] : [currency]));
  let conversionProvenance: InfographicSpec['conversionProvenance'] = null;
  if (row.conversionProvenance !== null && row.conversionProvenance !== undefined) {
    const conversion = object(row.conversionProvenance, 'conversion provenance');
    const evidenceReleaseId = id(conversion.evidenceReleaseId, 'conversion evidence release');
    if (!evidenceReleaseIds.includes(evidenceReleaseId)) {
      throw new TypeError('Conversion provenance must use a linked evidence release.');
    }
    conversionProvenance = Object.freeze({
      evidenceReleaseId,
      note: text(conversion.note, 'conversion note'),
    });
  }
  if (currencies.size > 1 && conversionProvenance === null) {
    throw new TypeError('Mixed currencies require conversion provenance.');
  }
  const relatedHref = row.relatedHref === null ? null : text(row.relatedHref, 'related link');
  if (relatedHref !== null && (!relatedHref.startsWith('/') || relatedHref.startsWith('//'))) {
    throw new TypeError('Infographic related link must be internal.');
  }
  return Object.freeze({
    id: infographicId,
    template: row.template as InfographicSpec['template'],
    locale: row.locale,
    title: text(row.title, 'title'),
    accessibleSummary: text(row.accessibleSummary, 'accessible summary'),
    evidenceReleaseIds,
    unit: text(row.unit, 'unit'),
    period: Object.freeze({ start: periodStart, end: periodEnd }),
    series,
    sourceLabel: text(row.sourceLabel, 'source label'),
    sampleLabel: text(row.sampleLabel, 'sample label'),
    relatedHref,
    conversionProvenance,
  });
}

export function validateInfographicRenderRecord(value: unknown): InfographicRenderRecord {
  const row = object(value, 'render record');
  const specHash = text(row.specHash, 'render hash');
  if (!sha256.test(specHash)) throw new TypeError('Invalid infographic render hash.');
  if (!Array.isArray(row.evidenceReleaseIds) || row.evidenceReleaseIds.length === 0) {
    throw new TypeError('Infographic render requires evidence release IDs.');
  }
  if (!Number.isInteger(row.width) || (row.width as number) < 320
    || !Number.isInteger(row.height) || (row.height as number) < 180) {
    throw new TypeError('Invalid infographic render dimensions.');
  }
  if (row.format !== 'png') throw new TypeError('Invalid infographic render format.');
  if (row.ownership !== 'owned') throw new TypeError('Infographic render object must be owned.');
  const generatedAt = text(row.generatedAt, 'generated date');
  if (!Number.isFinite(Date.parse(generatedAt))) throw new TypeError('Invalid infographic generated date.');
  let objectUrl: URL;
  try { objectUrl = new URL(text(row.objectUrl, 'object URL')); } catch {
    throw new TypeError('Invalid infographic object URL.');
  }
  if (objectUrl.protocol !== 'https:') throw new TypeError('Infographic object URL must use HTTPS.');
  return Object.freeze({
    id: id(row.id, 'render identity'),
    infographicId: id(row.infographicId, 'render infographic identity'),
    rendererVersion: text(row.rendererVersion, 'renderer version'),
    specHash,
    evidenceReleaseIds: Object.freeze(row.evidenceReleaseIds.map((releaseId) => id(releaseId, 'render evidence release'))),
    width: row.width as number,
    height: row.height as number,
    format: 'png',
    generatedAt,
    objectUrl: objectUrl.toString(),
    ownership: 'owned',
  });
}
