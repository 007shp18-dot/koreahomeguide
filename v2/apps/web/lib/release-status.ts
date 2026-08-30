import { marketIds } from '@signedprice/market-core';

const publicEnvironments = [
  'production',
  'preview',
  'development',
  'local',
] as const;

export type ReleaseEnvironment = (typeof publicEnvironments)[number];

export type ReleaseStatus = {
  readonly brand: 'signedprice';
  readonly commit: string;
  readonly environment: ReleaseEnvironment;
  readonly markets: typeof marketIds;
  readonly indexing: 'blocked';
};

export type ReleaseStatusInput = {
  readonly commit: unknown;
  readonly environment: unknown;
};

function sanitizeCommit(value: unknown): string {
  if (typeof value !== 'string') return 'local';

  const candidate = value.trim().toLowerCase();
  return /^[0-9a-f]{6,64}$/.test(candidate) ? candidate : 'local';
}

function sanitizeEnvironment(value: unknown): ReleaseEnvironment {
  if (typeof value !== 'string') return 'local';

  const candidate = value.trim().toLowerCase();
  return publicEnvironments.find((environment) => environment === candidate) ?? 'local';
}

export function buildReleaseStatus(input: ReleaseStatusInput): ReleaseStatus {
  return {
    brand: 'signedprice',
    commit: sanitizeCommit(input.commit),
    environment: sanitizeEnvironment(input.environment),
    markets: marketIds,
    indexing: 'blocked',
  };
}
