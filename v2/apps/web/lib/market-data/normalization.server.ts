import 'server-only';

import { createHash } from 'node:crypto';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

export function sha256(value: unknown): string {
  const source = typeof value === 'string' ? value : canonicalJson(value);
  return createHash('sha256').update(source).digest('hex');
}

export function stableId(value: string): string {
  return sha256(value).slice(0, 16);
}

export function normalizeEntityName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}
