import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { candidatePhotoRegistryKey } from '../lib/photos/building-photo-store.server';

describe('seeded building photo registry identity', () => {
  it('uses the existing Seoul screen key', () => {
    expect(candidatePhotoRegistryKey({ key: 'seoul:abc', marketKey: 'seoul', externalId: 'abc', name: '서원', localAttributes: {} })).toBe('kr-seoul:abc');
  });
  it('connects Singapore private candidates to the current project screen', () => {
    expect(candidatePhotoRegistryKey({ key: 'singapore:project:abc', marketKey: 'singapore', externalId: 'abc', name: 'MARINA ONE RESIDENCES', localAttributes: { marketSegment: 'CCR' } })).toBe('sg-project:CCR:MARINA ONE RESIDENCES');
  });
  it('connects HDB candidates to the current block screen', () => {
    expect(candidatePhotoRegistryKey({ key: 'singapore:block:abc', marketKey: 'singapore', externalId: 'abc', name: '1 ANG MO KIO AVE 1', localAttributes: { town: 'ANG MO KIO' } })).toBe('sg-hdb:ANG MO KIO:1 ANG MO KIO AVE 1');
  });
  it('preserves the existing Dubai key and does not guess missing Singapore identity', () => {
    expect(candidatePhotoRegistryKey({ key: 'dubai:abc', marketKey: 'dubai', externalId: 'abc', name: 'Example', localAttributes: {} })).toBe('ae-dubai:abc');
    expect(candidatePhotoRegistryKey({ key: 'singapore:block:abc', marketKey: 'singapore', externalId: 'abc', name: '1 Example', localAttributes: {} })).toBeNull();
  });
});
