import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { buildSingaporeSnapshot, buildUraPrivateSaleCheckArtifact, parseUraPrivateSaleEnvelope } from '@signedprice/singapore-property';
import { parseSingaporePublication } from '../lib/singapore/publication.server';
const fixture = JSON.parse(readFileSync(new URL('../../../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url), 'utf8'));
function bundle() {
 const snapshot = buildSingaporeSnapshot({ records: [1,2,3,4].flatMap(batch => parseUraPrivateSaleEnvelope(fixture,batch)), generatedAt: '2026-09-10T00:00:00Z' });
 return { version: 'signedprice-sg-publication-v1', sourceAsOf: snapshot.generatedAt, releasedAt: snapshot.generatedAt, snapshot, check: buildUraPrivateSaleCheckArtifact(snapshot), rentals: [], rentalRecordCount: 0 };
}
function parse(value: unknown) { const serialized = JSON.stringify(value); return parseSingaporePublication(serialized, createHash('sha256').update(serialized).digest('hex')); }
describe('atomic Singapore publication contracts', () => {
 it('verifies sale and Check together', () => { const value = parse(bundle()); expect(value.check.recordCount).toBe(value.snapshot.records.length); });
 it('rejects tampered bytes and inconsistent Check', () => { expect(() => parseSingaporePublication(JSON.stringify(bundle()), '0'.repeat(64))).toThrow(); const value = bundle(); expect(() => parse({...value, check:{...value.check, recordCount:1}})).toThrow(); });
 it('rejects rental groups below publication minimum', () => { expect(() => parse({...bundle(), rentals:[{ projectId:'sg-singapore:project:a',project:'A',month:'2026-08',areaRange:'100-150',propertyType:'Condominium',bedrooms:2,n:4,medianMonthlySgd:5000 }]})).toThrow(); });
});
