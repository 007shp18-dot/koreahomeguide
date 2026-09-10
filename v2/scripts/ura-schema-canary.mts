import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  SG_URA_PRIVATE_SALE_RIGHTS,
  URA_PRIVATE_SALE_SERVICE,
  createUraClient,
  parseUraPrivateSaleEnvelope,
  readUraCredential,
} from '@signedprice/singapore-property';

const VERSION = 'signedprice-ura-private-sale-schema-v1' as const;
const PARSER_VERSION = 'ura-private-sale-parser-v1' as const;
const DEFAULT_OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../artifacts/singapore/ura-private-sale-schema.json',
);

type JsonPrimitiveType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';
type SchemaField = Readonly<{ name: string; type: JsonPrimitiveType }>;

export type UraSchemaManifest = Readonly<{
  version: typeof VERSION;
  parserVersion: typeof PARSER_VERSION;
  service: typeof URA_PRIVATE_SALE_SERVICE;
  batchCount: 4;
  counts: Readonly<{ projects: number; transactions: number }>;
  retrievedAt: string;
  fields: Readonly<{
    envelope: readonly SchemaField[];
    project: readonly SchemaField[];
    transaction: readonly SchemaField[];
  }>;
  sources: readonly string[];
  digest: string;
}>;

type BuildOptions = Readonly<{
  batches: readonly unknown[];
  retrievedAt: string;
  forbiddenValues?: readonly string[];
}>;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`;
}

function jsonType(value: unknown): JsonPrimitiveType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object': return 'object';
    default: throw new Error('URA schema contains a non-JSON value.');
  }
}

function fieldsOf(value: Record<string, unknown>): readonly SchemaField[] {
  return Object.freeze(Object.keys(value).sort().map((name) => Object.freeze({
    name,
    type: jsonType(value[name]),
  })));
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('URA schema canary requires four complete batches.');
  }
  return value as Record<string, unknown>;
}

function sensitiveProviderValues(batches: readonly unknown[]): string[] {
  const values: string[] = [];
  for (const batch of batches) {
    const result = record(batch).Result;
    if (!Array.isArray(result)) continue;
    for (const projectValue of result) {
      const project = record(projectValue);
      for (const key of ['project', 'street', 'x', 'y'] as const) {
        if (typeof project[key] === 'string' && project[key].length > 0) values.push(project[key]);
      }
      if (!Array.isArray(project.transaction)) continue;
      for (const transactionValue of project.transaction) {
        const transaction = record(transactionValue);
        for (const key of ['price', 'area', 'tenure', 'contractDate'] as const) {
          if (typeof transaction[key] === 'string' && transaction[key].length > 0) {
            values.push(transaction[key]);
          }
        }
      }
    }
  }
  return values;
}

function assertSanitized(serialized: string, forbiddenValues: readonly string[]): void {
  const containsRawValue = forbiddenValues
    .filter((value) => value.trim().length > 0)
    .some((value) => serialized.includes(value));
  if (containsRawValue) throw new Error('URA schema manifest contains a provider value.');
}

export function buildUraSchemaManifest(options: BuildOptions): UraSchemaManifest {
  if (options.batches.length !== 4 || !Number.isFinite(Date.parse(options.retrievedAt))) {
    throw new Error('URA schema canary requires four complete batches.');
  }

  let projects = 0;
  let transactions = 0;
  for (const [index, batch] of options.batches.entries()) {
    const result = record(batch).Result;
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('URA schema canary requires four complete batches.');
    }
    const parsed = parseUraPrivateSaleEnvelope(batch, index + 1);
    if (parsed.length === 0) throw new Error('URA schema canary requires four complete batches.');
    projects += result.length;
    transactions += parsed.length;
  }

  const firstEnvelope = record(options.batches[0]);
  const firstProjects = firstEnvelope.Result;
  if (!Array.isArray(firstProjects) || firstProjects.length === 0) {
    throw new Error('URA schema canary requires four complete batches.');
  }
  const firstProject = record(firstProjects[0]);
  const firstTransactions = firstProject.transaction;
  if (!Array.isArray(firstTransactions) || firstTransactions.length === 0) {
    throw new Error('URA schema canary requires four complete batches.');
  }

  const unsigned = {
    version: VERSION,
    parserVersion: PARSER_VERSION,
    service: URA_PRIVATE_SALE_SERVICE,
    batchCount: 4 as const,
    counts: Object.freeze({ projects, transactions }),
    retrievedAt: new Date(options.retrievedAt).toISOString(),
    fields: Object.freeze({
      envelope: fieldsOf(firstEnvelope),
      project: fieldsOf(firstProject),
      transaction: fieldsOf(record(firstTransactions[0])),
    }),
    sources: Object.freeze(SG_URA_PRIVATE_SALE_RIGHTS.sources.map(({ url }) => url).sort()),
  } as const;
  const forbidden = [
    ...sensitiveProviderValues(options.batches),
    ...(options.forbiddenValues ?? []),
  ];
  assertSanitized(canonicalJson(unsigned), forbidden);
  const manifest = Object.freeze({
    ...unsigned,
    digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
  assertSanitized(canonicalJson(manifest), forbidden);
  return manifest;
}

export function stringifyUraSchemaManifest(manifest: UraSchemaManifest): string {
  return `${canonicalJson(manifest)}\n`;
}

export async function runUraSchemaCanary(outputPath = DEFAULT_OUTPUT): Promise<UraSchemaManifest> {
  const credential = readUraCredential();
  const client = createUraClient(credential);
  const batches = await client.fetchPrivateResidentialTransactions();
  const manifest = buildUraSchemaManifest({ batches, retrievedAt: new Date().toISOString() });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, stringifyUraSchemaManifest(manifest), { encoding: 'utf8', flag: 'wx' });
  return manifest;
}

async function main(): Promise<void> {
  try {
    const manifest = await runUraSchemaCanary(process.argv[2]);
    process.stdout.write(
      `URA schema canary passed: ${manifest.batchCount} batches, ${manifest.counts.projects} projects, ${manifest.counts.transactions} transactions.\n`,
    );
  } catch {
    process.stderr.write('URA schema canary failed.\n');
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  await main();
}
