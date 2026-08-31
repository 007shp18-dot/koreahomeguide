import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseUraPrivateSaleEnvelope } from '../src/ura-transaction';

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;

function copyFixture(): Record<string, unknown> {
  return structuredClone(fixture) as Record<string, unknown>;
}

function firstProject(value: Record<string, unknown>): Record<string, unknown> {
  return (value.Result as Array<Record<string, unknown>>)[0]!;
}

function firstTransaction(value: Record<string, unknown>): Record<string, unknown> {
  return (firstProject(value).transaction as Array<Record<string, unknown>>)[0]!;
}

describe('parseUraPrivateSaleEnvelope', () => {
  it('normalizes native URA fields without changing source order', () => {
    const records = parseUraPrivateSaleEnvelope(fixture, 2);

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.sourceOrder)).toEqual([
      { batch: 2, project: 0, transaction: 0 },
      { batch: 2, project: 0, transaction: 1 },
      { batch: 2, project: 1, transaction: 0 },
    ]);
    expect(records[0]).toMatchObject({
      project: 'Example Residences',
      street: 'Example Road',
      x: 28900.125,
      y: 31500.5,
      marketSegment: 'CCR',
      areaSqm: 100.5,
      floorRange: '06-10',
      units: 1,
      contractDate: '0826',
      contractMonth: '2026-08-01',
      saleType: 'new_sale',
      priceSgd: 2_000_000,
      propertyType: 'condominium',
      district: '10',
      areaBasis: 'strata',
      tenure: 'Freehold',
    });
    expect(records.map((record) => record.saleType)).toEqual(['new_sale', 'resale', 'sub_sale']);
    expect(records[2]?.propertyType).toBe('terrace');
    expect(records[2]?.areaBasis).toBe('land');
  });

  it.each([
    ['extra envelope key', (value: Record<string, unknown>) => { value.Extra = true; }],
    ['missing envelope key', (value: Record<string, unknown>) => { delete value.Message; }],
    ['missing project key', (value: Record<string, unknown>) => { delete firstProject(value).street; }],
    ['extra transaction key', (value: Record<string, unknown>) => { firstTransaction(value).extra = 'x'; }],
    ['invalid area', (value: Record<string, unknown>) => { firstTransaction(value).area = '100m2'; }],
    ['zero area', (value: Record<string, unknown>) => { firstTransaction(value).area = '0'; }],
    ['zero price', (value: Record<string, unknown>) => { firstTransaction(value).price = '0'; }],
    ['non-integer price', (value: Record<string, unknown>) => { firstTransaction(value).price = '1.5'; }],
    ['unsafe price', (value: Record<string, unknown>) => { firstTransaction(value).price = '9007199254740992'; }],
    ['invalid month', (value: Record<string, unknown>) => { firstTransaction(value).contractDate = '1326'; }],
    ['unknown sale type', (value: Record<string, unknown>) => { firstTransaction(value).typeOfSale = '4'; }],
    ['unknown property type', (value: Record<string, unknown>) => { firstTransaction(value).propertyType = 'Villa'; }],
    ['unknown area type', (value: Record<string, unknown>) => { firstTransaction(value).typeOfArea = 'Built-up'; }],
    ['unknown segment', (value: Record<string, unknown>) => { firstProject(value).marketSegment = 'OUTSIDE'; }],
    ['control character', (value: Record<string, unknown>) => { firstProject(value).project = 'Bad\nName'; }],
    ['empty projects', (value: Record<string, unknown>) => { value.Result = []; }],
    ['empty transactions', (value: Record<string, unknown>) => { firstProject(value).transaction = []; }],
  ])('rejects %s', (_label, mutate) => {
    const value = copyFixture();
    mutate(value);
    expect(() => parseUraPrivateSaleEnvelope(value, 1)).toThrow('URA transaction schema is invalid.');
  });
});
