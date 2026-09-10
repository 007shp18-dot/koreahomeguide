import 'server-only';

import type { KoreaObservedBuildingInventory } from '@signedprice/korea-rent';

import { encodeArtifact } from './artifact-encoding.server';
import {
  OBSERVED_BUILDING_ARTIFACT_VERSION,
  parseObservedBuildingArtifact,
} from './observed-building-schema';

export async function buildObservedBuildingArtifact(input: KoreaObservedBuildingInventory) {
  const records = Object.freeze(input.records.map((record) => Object.freeze({
    ...record,
    coordinate: Object.freeze({ ...record.coordinate }),
  })));
  const unsigned = Object.freeze({
    artifactVersion: OBSERVED_BUILDING_ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    provenance: Object.freeze({
      marketId: 'kr-seoul',
      period: input.period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      displayRights: true,
      exclusions: Object.freeze([
        'Canceled records',
        'Records without a stable building identity',
      ]),
    }),
    stats: Object.freeze({ ...input.stats }),
    records,
  });
  const internalDigest = (await encodeArtifact(unsigned)).sha256;
  const artifact = Object.freeze({ ...unsigned, sha256: internalDigest });
  parseObservedBuildingArtifact(artifact, { marketId: 'kr-seoul', period: input.period });
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({ artifact, ...encoded });
}
