import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import {
  buildDubaiAreaEvidence,
  buildDubaiAreaEvidenceBundle,
  decodeDubaiCsvBytes,
} from '../scripts/build-dubai-area-evidence.mjs';
import { parseDubaiAreaEvidence } from '../lib/dubai/evidence-contract';
import {
  approvedDubaiRights,
  marsaDubaiSlugRegistry,
  verifiedDubaiUnits,
} from './dubai-evidence-fixture';

function csv(headers: readonly string[], rows: readonly Readonly<Record<string, string>>[]): string {
  const encode = (value: string) => /[",\n\r]/u.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
  return `\uFEFF${headers.join(',')}\r\n${rows.map((row) => (
    headers.map((header) => encode(row[header] ?? '')).join(',')
  )).join('\r\n')}\r\n`;
}

const transactionHeaders = [
  'TRANSACTION_NUMBER', 'INSTANCE_DATE', 'GROUP_EN', 'PROCEDURE_EN',
  'IS_OFFPLAN_EN', 'USAGE_EN', 'AREA_EN', 'PROP_TYPE_EN',
  'PROP_SB_TYPE_EN', 'TRANS_VALUE', 'ACTUAL_AREA', 'PROJECT_EN',
] as const;
const rentHeaders = [
  'REGISTRATION_DATE', 'VERSION_EN', 'AREA_EN', 'ANNUAL_AMOUNT',
  'ACTUAL_AREA', 'PROP_TYPE_EN', 'PROP_SUB_TYPE_EN', 'USAGE_EN',
  'TOTAL_PROPERTIES', 'PROJECT_EN',
] as const;
const landHeaders = ['AREA_EN', 'PROJECT_EN'] as const;

function transaction(index: number, override: Readonly<Record<string, string>> = {}) {
  return {
    TRANSACTION_NUMBER: `sale-${index}`,
    INSTANCE_DATE: '2026-09-05 12:00:00',
    GROUP_EN: 'Sales',
    PROCEDURE_EN: 'Sale',
    IS_OFFPLAN_EN: 'Ready',
    USAGE_EN: 'Residential',
    AREA_EN: 'DUBAI MARINA',
    PROP_TYPE_EN: 'Unit',
    PROP_SB_TYPE_EN: 'Flat',
    TRANS_VALUE: '1500000',
    ACTUAL_AREA: '75',
    PROJECT_EN: ['Marina, View\nTower', 'Harbour Gate', 'Canal Residence'][index % 3]!,
    ...override,
  };
}

function rent(index: number, override: Readonly<Record<string, string>> = {}) {
  return {
    REGISTRATION_DATE: '2026-09-05 10:00:00',
    VERSION_EN: index < 30 ? 'New' : 'Renewed',
    AREA_EN: 'Marsa Dubai',
    ANNUAL_AMOUNT: index < 30 ? '90000' : '80000',
    ACTUAL_AREA: '75',
    PROP_TYPE_EN: 'Unit',
    PROP_SUB_TYPE_EN: 'Flat',
    USAGE_EN: 'Residential',
    TOTAL_PROPERTIES: '1',
    PROJECT_EN: '',
    ...override,
  };
}

describe('Dubai area evidence builder', () => {
  it.each([
    ['noncommercial', true, 'published'],
    ['noncommercial', false, 'draft'],
    ['commercial', true, 'draft'],
  ])('gates %s use on its actual permission (%s)', (intendedUse, permitted, displayState) => {
    const built = buildDubaiAreaEvidence({
      transactionsCsv: csv(transactionHeaders, [
        transaction(100, { INSTANCE_DATE: '2026-01-01 12:00:00' }),
        ...Array.from({ length: 31 }, (_, i) => transaction(i, { AREA_EN: 'Marsa Dubai' })),
      ]),
      rentsCsv: csv(rentHeaders, [
        rent(100, { REGISTRATION_DATE: '2026-01-01 12:00:00' }),
        ...Array.from({ length: 60 }, (_, i) => rent(i)),
      ]),
      landsCsv: csv(landHeaders, [{ AREA_EN: 'Marsa Dubai', PROJECT_EN: '' }]),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: { ...approvedDubaiRights, intendedUse,
        canUseNonCommercially: permitted, canUseCommercially: false },
      unitVerification: verifiedDubaiUnits,
      slugRegistry: marsaDubaiSlugRegistry,
    });
    expect(built.publication.displayState).toBe(displayState);
    expect(parseDubaiAreaEvidence(built).rights.canUseCommercially).toBe(false);
  });

  it('maps a transaction alias through unambiguous Land projects and builds published metrics', () => {
    const transactionRows = Array.from({ length: 31 }, (_, index) => transaction(index));
    const rentRows = Array.from({ length: 60 }, (_, index) => rent(index));
    const landRows = [
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Marina, View\nTower' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Harbour Gate' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Canal Residence' },
    ];

    const built = buildDubaiAreaEvidence({
      transactionsCsv: csv(transactionHeaders, transactionRows),
      rentsCsv: csv(rentHeaders, rentRows),
      landsCsv: csv(landHeaders, landRows),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: marsaDubaiSlugRegistry,
    });

    expect(built.areas).toHaveLength(1);
    expect(built.areas[0]).toMatchObject({
      slug: 'marsa-dubai',
      name: 'Marsa Dubai',
      searchAliases: ['Dubai Marina', 'Marsa Dubai'],
      segments: [{
        housing: 'apartment',
        sales: {
          ready: {
            n: 31,
            medianPriceAed: 1_500_000,
            medianPricePerSqmAed: 20_000,
          },
          offPlan: null,
        },
        rent: {
          newN: 30,
          renewedN: 30,
          totalN: 60,
          medianAnnualRentAed: 90_000,
          medianAnnualRentPerSqmAed: 1_200,
          newShare: 0.5,
          renewedShare: 0.5,
        },
        readyGrossYieldPct: 6,
      }],
    });
    expect(built.totals).toMatchObject({
      qualifyingSaleRows: 31,
      mappedSaleRows: 31,
      qualifyingRentRows: 60,
      verifiedAliases: 1,
      publishedAreas: 1,
      publishedSegments: 1,
    });
    expect(built.comparisonPeriod).toEqual({ from: '2026-06-08', to: '2026-09-05' });
    expect(built.unitVerification).toEqual(verifiedDubaiUnits);
    expect(built.publication).toEqual({ displayState: 'published', indexState: 'index' });
  });

  it('keeps exact repeated rows and excludes non-comparable source classes', () => {
    const repeated = transaction(0);
    const transactionRows = [
      ...Array.from({ length: 30 }, (_, index) => transaction(index)),
      repeated,
      repeated,
      transaction(90, { GROUP_EN: 'Mortgage' }),
      transaction(91, { GROUP_EN: 'Gifts' }),
      transaction(92, { USAGE_EN: 'Commercial' }),
      transaction(93, { PROCEDURE_EN: 'Portfolio Mortgage Registration' }),
    ];
    const rentRows = [
      ...Array.from({ length: 60 }, (_, index) => rent(index)),
      rent(70, { TOTAL_PROPERTIES: '4' }),
      rent(71, { USAGE_EN: 'Commercial' }),
    ];
    const landRows = [
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Marina, View\nTower' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Harbour Gate' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Canal Residence' },
    ];

    const built = buildDubaiAreaEvidence({
      transactionsCsv: csv(transactionHeaders, transactionRows),
      rentsCsv: csv(rentHeaders, rentRows),
      landsCsv: csv(landHeaders, landRows),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: marsaDubaiSlugRegistry,
    });

    expect(built.sources.transactions.rows).toBe(36);
    expect(built.areas[0]?.segments[0]?.sales.ready?.n).toBe(32);
    expect(built.totals.qualifyingSaleRows).toBe(32);
    expect(built.totals.qualifyingRentRows).toBe(60);
  });

  it('rejects ambiguous project aliases instead of fuzzy matching', () => {
    const transactionRows = Array.from({ length: 31 }, (_, index) => transaction(index));
    const rentRows = Array.from({ length: 60 }, (_, index) => rent(index));
    const landRows = [
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Marina, View\nTower' },
      { AREA_EN: 'Second Area', PROJECT_EN: 'Marina, View\nTower' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Harbour Gate' },
      { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Canal Residence' },
    ];

    const built = buildDubaiAreaEvidence({
      transactionsCsv: csv(transactionHeaders, transactionRows),
      rentsCsv: csv(rentHeaders, rentRows),
      landsCsv: csv(landHeaders, landRows),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: marsaDubaiSlugRegistry,
    });

    expect(built.areas).toEqual([]);
    expect(built.totals.mappedSaleRows).toBe(0);
  });

  it('fails loudly when a provider CSV renames a required field', () => {
    const renamedHeaders = transactionHeaders.map((header) => (
      header === 'TRANS_VALUE' ? 'TRANSACTION_AMOUNT' : header
    ));
    expect(() => buildDubaiAreaEvidence({
      transactionsCsv: csv(renamedHeaders, Array.from({ length: 31 }, (_, index) => transaction(index))),
      rentsCsv: csv(rentHeaders, Array.from({ length: 60 }, (_, index) => rent(index))),
      landsCsv: csv(landHeaders, [
        { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Marina, View\nTower' },
        { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Harbour Gate' },
        { AREA_EN: 'Marsa Dubai', PROJECT_EN: 'Canal Residence' },
      ]),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: marsaDubaiSlugRegistry,
    })).toThrow(/transaction CSV missing required header TRANS_VALUE/u);
  });

  it('rejects invalid UTF-8 before hashing or parsing provider bytes', () => {
    expect(() => decodeDubaiCsvBytes(Uint8Array.from([0xFF, 0xFE, 0xFD])))
      .toThrow(/invalid UTF-8/u);
  });

  it('keeps an existing canonical slug when a later release adds a collision', () => {
    const first = buildDubaiAreaEvidenceBundle({
      transactionsCsv: csv(transactionHeaders, Array.from({ length: 31 }, (_, index) => transaction(index, {
        AREA_EN: 'Area One',
        PROJECT_EN: '',
      }))),
      rentsCsv: csv(rentHeaders, Array.from({ length: 30 }, (_, index) => rent(index, {
        AREA_EN: 'Area One',
      }))),
      landsCsv: csv(landHeaders, [{ AREA_EN: 'Area One', PROJECT_EN: '' }]),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: { version: 'signedprice-dubai-area-slugs-v1', entries: {} },
    });

    const secondInput = {
      transactionsCsv: csv(transactionHeaders, [
        transaction(9_999, { INSTANCE_DATE: '2026-01-01 00:00:00', GROUP_EN: 'Mortgage' }),
        ...Array.from({ length: 31 }, (_, index) => transaction(index, {
          AREA_EN: 'Area One', PROJECT_EN: '',
        })),
        ...Array.from({ length: 31 }, (_, index) => transaction(index + 100, {
          AREA_EN: 'Area-One', PROJECT_EN: '',
        })),
      ]),
      rentsCsv: csv(rentHeaders, [
        rent(9_999, { REGISTRATION_DATE: '2026-06-01 00:00:00', USAGE_EN: 'Commercial' }),
        ...Array.from({ length: 30 }, (_, index) => rent(index, { AREA_EN: 'Area One' })),
        ...Array.from({ length: 30 }, (_, index) => rent(index + 100, {
          AREA_EN: 'Area-One', VERSION_EN: 'New',
        })),
      ]),
      landsCsv: csv(landHeaders, [
        { AREA_EN: 'Area One', PROJECT_EN: '' },
        { AREA_EN: 'Area-One', PROJECT_EN: '' },
      ]),
      generatedAt: '2026-09-07T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: first.slugRegistry,
    };
    const second = buildDubaiAreaEvidenceBundle(secondInput);

    expect(first.snapshot.areas[0]?.slug).toBe('area-one');
    expect(second.snapshot.areas.find(({ name }) => name === 'Area One')?.slug).toBe('area-one');
    expect(second.snapshot.areas.find(({ name }) => name === 'Area-One')?.slug)
      .toBe('area-one-a209dee6');
    expect(second.slugRegistry.entries).toEqual({
      'area one': 'area-one',
      'area-one': 'area-one-a209dee6',
    });
    expect(second.registryChanged).toBe(true);
    expect(second.snapshot.publication).toEqual({ displayState: 'draft', indexState: 'noindex' });

    const released = buildDubaiAreaEvidence({
      ...secondInput,
      slugRegistry: second.slugRegistry,
    });
    expect(released.publication).toEqual({ displayState: 'published', indexState: 'index' });
    expect(parseDubaiAreaEvidence(released)).toEqual(released);
  });

  it('selects comparable areas independently for Ready and Off-Plan evidence', () => {
    const definitions = [
      { name: 'Anchor', ready: '1000000', offPlan: '3000000' },
      { name: 'Ready Peer', ready: '1100000', offPlan: '10000000' },
      { name: 'Off Plan Peer', ready: '5000000', offPlan: '3100000' },
    ];
    const transactionRows = [
      transaction(9_999, { INSTANCE_DATE: '2026-01-01 00:00:00', GROUP_EN: 'Mortgage' }),
      ...definitions.flatMap((definition, areaIndex) => [
      ...Array.from({ length: 31 }, (_, index) => transaction(areaIndex * 1000 + index, {
        AREA_EN: definition.name,
        PROJECT_EN: '',
        TRANS_VALUE: definition.ready,
      })),
      ...Array.from({ length: 31 }, (_, index) => transaction(areaIndex * 1000 + 100 + index, {
        AREA_EN: definition.name,
        PROJECT_EN: '',
        IS_OFFPLAN_EN: 'Off-Plan',
        TRANS_VALUE: definition.offPlan,
      })),
      ]),
    ];
    const rentRows = [
      rent(9_999, { REGISTRATION_DATE: '2026-06-01 00:00:00', USAGE_EN: 'Commercial' }),
      ...definitions.flatMap((definition, areaIndex) => Array.from(
      { length: 30 },
      (_, index) => rent(areaIndex * 1000 + index, {
        AREA_EN: definition.name,
        VERSION_EN: 'New',
      }),
      )),
    ];
    const built = buildDubaiAreaEvidence({
      transactionsCsv: csv(transactionHeaders, transactionRows),
      rentsCsv: csv(rentHeaders, rentRows),
      landsCsv: csv(landHeaders, definitions.map(({ name }) => ({ AREA_EN: name, PROJECT_EN: '' }))),
      generatedAt: '2026-09-06T00:00:00.000Z',
      rights: approvedDubaiRights,
      unitVerification: verifiedDubaiUnits,
      slugRegistry: {
        version: 'signedprice-dubai-area-slugs-v1',
        entries: {
          anchor: 'anchor',
          'ready peer': 'ready-peer',
          'off plan peer': 'off-plan-peer',
        },
      },
    });
    const anchor = built.areas.find(({ name }) => name === 'Anchor')!;

    expect(anchor.segments[0]?.comparableAreaIds).toEqual({
      ready: ['ae-dubai:area:ready-peer', 'ae-dubai:area:off-plan-peer'],
      offPlan: ['ae-dubai:area:off-plan-peer', 'ae-dubai:area:ready-peer'],
    });
    expect(parseDubaiAreaEvidence(built)).toEqual(built);
  });

  it('writes a registry proposal before the CLI is allowed to write an artifact', () => {
    const directory = mkdtempSync(join(tmpdir(), 'signedprice-dubai-registry-'));
    try {
      const paths = {
        transactions: join(directory, 'transactions.csv'),
        rents: join(directory, 'rents.csv'),
        lands: join(directory, 'lands.csv'),
        rights: join(directory, 'rights.json'),
        registry: join(directory, 'registry.json'),
        proposal: join(directory, 'proposal.json'),
        artifact: join(directory, 'artifact.json.gz'),
      };
      writeFileSync(paths.transactions, csv(transactionHeaders, [
        transaction(9_999, { INSTANCE_DATE: '2026-01-01 00:00:00', GROUP_EN: 'Mortgage' }),
        ...Array.from({ length: 31 }, (_, index) => transaction(index, {
          AREA_EN: 'Area One', PROJECT_EN: '',
        })),
      ]));
      writeFileSync(paths.rents, csv(rentHeaders, [
        rent(9_999, { REGISTRATION_DATE: '2026-06-01 00:00:00', USAGE_EN: 'Commercial' }),
        ...Array.from({ length: 30 }, (_, index) => rent(index, { AREA_EN: 'Area One' })),
      ]));
      writeFileSync(paths.lands, csv(landHeaders, [{ AREA_EN: 'Area One', PROJECT_EN: '' }]));
      writeFileSync(paths.rights, JSON.stringify({
        rights: approvedDubaiRights,
        unitVerification: verifiedDubaiUnits,
      }));
      writeFileSync(paths.registry, JSON.stringify({
        version: 'signedprice-dubai-area-slugs-v1', entries: {},
      }));
      const script = resolve(import.meta.dirname, '../scripts/build-dubai-area-evidence.mjs');
      const common = [
        script,
        '--transactions', paths.transactions,
        '--rents', paths.rents,
        '--lands', paths.lands,
        '--generated-at', '2026-09-06T00:00:00.000Z',
        '--rights-record', paths.rights,
      ];

      const blocked = spawnSync(process.execPath, [
        ...common, '--slug-registry', paths.registry, '--output', paths.artifact,
      ], { encoding: 'utf8' });
      expect(blocked.status).not.toBe(0);
      expect(blocked.stderr).toContain('slug registry update required');
      expect(existsSync(paths.artifact)).toBe(false);

      const proposal = spawnSync(process.execPath, [
        ...common, '--slug-registry', paths.registry,
        '--slug-registry-output', paths.proposal,
      ], { encoding: 'utf8' });
      expect(proposal.status).toBe(0);
      expect(JSON.parse(proposal.stdout)).toMatchObject({
        artifactWritten: false,
        slugRegistry: { additions: [{ key: 'area one', slug: 'area-one' }] },
      });
      expect(existsSync(paths.artifact)).toBe(false);

      const released = spawnSync(process.execPath, [
        ...common, '--slug-registry', paths.proposal, '--output', paths.artifact,
      ], { encoding: 'utf8' });
      expect(released.status).toBe(0);
      expect(JSON.parse(released.stdout)).toMatchObject({ artifactWritten: true });
      expect(parseDubaiAreaEvidence(JSON.parse(
        gunzipSync(readFileSync(paths.artifact)).toString('utf8'),
      ))
        .areas[0]?.slug).toBe('area-one');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
