import { describe, expect, it } from 'vitest';

import { createPropertyIdentity } from '../src';

describe('global property identity', () => {
  it('preserves a verified project hierarchy and source-scoped identifiers', () => {
    const identity = createPropertyIdentity({
      id: 'sg-singapore:project:marina-one-residences',
      marketId: 'sg-singapore',
      geographyId: 'sg-singapore:planning-area:downtown-core',
      parentId: null,
      kind: 'project',
      canonicalName: 'Marina One Residences',
      identityStatus: 'verified',
      externalIdentifiers: [
        { sourceId: 'ura-project', type: 'project-name', value: 'MARINA ONE RESIDENCES' },
        { sourceId: 'google-places', type: 'place-id', value: 'place_123' },
      ],
      localSchemaVersion: 'sg-property@1',
      localAttributes: { housingSector: 'private_residential', tenure: 'leasehold' },
    });

    expect(identity).toEqual({
      id: 'sg-singapore:project:marina-one-residences',
      marketId: 'sg-singapore',
      geographyId: 'sg-singapore:planning-area:downtown-core',
      parentId: null,
      kind: 'project',
      canonicalName: 'Marina One Residences',
      identityStatus: 'verified',
      externalIdentifiers: [
        { sourceId: 'ura-project', type: 'project-name', value: 'MARINA ONE RESIDENCES' },
        { sourceId: 'google-places', type: 'place-id', value: 'place_123' },
      ],
      localSchemaVersion: 'sg-property@1',
      localAttributes: { housingSector: 'private_residential', tenure: 'leasehold' },
    });
  });

  it('rejects an identity that points to itself or repeats a source identifier', () => {
    expect(() => createPropertyIdentity({
      id: 'kr-seoul:building:one',
      marketId: 'kr-seoul',
      geographyId: null,
      parentId: 'kr-seoul:building:one',
      kind: 'building',
      canonicalName: 'One',
      identityStatus: 'verified',
      externalIdentifiers: [],
      localSchemaVersion: 'kr-building@1',
      localAttributes: {},
    })).toThrow('parentId');

    expect(() => createPropertyIdentity({
      id: 'ae-dubai:project:one',
      marketId: 'ae-dubai',
      geographyId: null,
      parentId: null,
      kind: 'project',
      canonicalName: 'One',
      identityStatus: 'unverified',
      externalIdentifiers: [
        { sourceId: 'dld-projects', type: 'project-number', value: '42' },
        { sourceId: 'dld-projects', type: 'project-number', value: '43' },
      ],
      localSchemaVersion: 'ae-project@1',
      localAttributes: {},
    })).toThrow('external identifier');
  });

  it('clones and deeply freezes local attributes and identifiers', () => {
    const attributes = { housingSector: 'hdb', lease: { startYear: 1996 } };
    const identifiers = [{ sourceId: 'hdb-resale', type: 'block-street', value: '10 ANSON ROAD' }];
    const identity = createPropertyIdentity({
      id: 'sg-singapore:block:10-anson-road',
      marketId: 'sg-singapore',
      geographyId: 'sg-singapore:town:central-area',
      parentId: null,
      kind: 'block',
      canonicalName: '10 Anson Road',
      identityStatus: 'verified',
      externalIdentifiers: identifiers,
      localSchemaVersion: 'sg-hdb@1',
      localAttributes: attributes,
    });

    attributes.lease.startYear = 2000;
    identifiers[0]!.value = 'tampered';

    expect(identity.localAttributes).toEqual({ housingSector: 'hdb', lease: { startYear: 1996 } });
    expect(identity.externalIdentifiers[0]!.value).toBe('10 ANSON ROAD');
    expect(Object.isFrozen(identity)).toBe(true);
    expect(Object.isFrozen(identity.localAttributes.lease)).toBe(true);
    expect(Object.isFrozen(identity.externalIdentifiers)).toBe(true);
  });
});
