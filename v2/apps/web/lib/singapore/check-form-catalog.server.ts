import 'server-only';

import { createHash } from 'node:crypto';
import registry from '../../data/installed-snapshots.json';
import installedCatalog from '../../data/singapore-check-form-catalog.json' with { type: 'json' };
import type { SingaporeCheckRouteModel } from './check-route-model.server';

export const SINGAPORE_CHECK_FORM_CATALOG_VERSION = 'signedprice-singapore-check-form-catalog-v1';
const datasets = ['sg-check-hdb-rent', 'sg-check-hdb-resale', 'sg-check-ura-private-sale'] as const;
const markets = ['ura-private-sale', 'hdb-resale', 'hdb-rent'] as const;
const overrides = ['SIGNEDPRICE_SINGAPORE_CHECK_URA_ARTIFACT', 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_ARTIFACT', 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_ARTIFACT'] as const;
const stringFields = ['months', 'segments', 'districts', 'propertyTypes', 'floorRanges', 'saleTypes', 'towns', 'flatTypes', 'storeyRanges'] as const;

type ObjectValue = Record<string, unknown>;
const isObject = (value: unknown): value is ObjectValue => typeof value === 'object' && value !== null && !Array.isArray(value);
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Bind the small form index to every field of the three installed releases. */
export function singaporeCheckFormRegistryFingerprint(value: unknown): string | null {
  if (!isObject(value) || value.registryVersion !== 'signedprice-installed-snapshots-v1' || !Array.isArray(value.snapshots)) return null;
  const snapshots = value.snapshots;
  const entries = datasets.map(dataset => snapshots.filter((entry: unknown) => isObject(entry) && entry.marketId === 'sg-singapore' && entry.dataset === dataset));
  if (entries.some(matches => matches.length !== 1)) return null;
  return createHash('sha256').update(canonical({ registryVersion: value.registryVersion, snapshots: entries.map(([entry]) => entry) })).digest('hex');
}

export type SingaporeCheckFormCatalog = Readonly<{
  catalogs: SingaporeCheckRouteModel['catalogs'];
  published: boolean;
}>;

function validCatalogs(value: unknown): value is SingaporeCheckFormCatalog['catalogs'] {
  return isObject(value) && markets.every(market => {
    const catalog = value[market];
    return isObject(catalog) && typeof catalog.available === 'boolean'
      && stringFields.every(field => Array.isArray(catalog[field]) && catalog[field].every(item => typeof item === 'string'))
      && ['projects', 'blocks'].every(field => Array.isArray(catalog[field]) && catalog[field].every(item => isObject(item) && typeof item.id === 'string' && typeof item.label === 'string'));
  });
}

/** Form choices only. Submitted offers must still use verified transactions. */
export function loadSingaporeCheckFormCatalog({
  candidate = installedCatalog as unknown,
  registrySource = registry as unknown,
  environment = process.env,
}: Readonly<{
  candidate?: unknown;
  registrySource?: unknown;
  environment?: Readonly<Record<string, string | undefined>>;
}> = {}): SingaporeCheckFormCatalog | null {
  if (environment.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined || environment.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || overrides.some(name => environment[name] !== undefined)) return null;
  if (!isObject(candidate) || candidate.version !== SINGAPORE_CHECK_FORM_CATALOG_VERSION || typeof candidate.published !== 'boolean') return null;
  const fingerprint = singaporeCheckFormRegistryFingerprint(registrySource);
  if (fingerprint === null || candidate.registryFingerprint !== fingerprint || !validCatalogs(candidate.catalogs)) return null;
  return { catalogs: candidate.catalogs, published: candidate.published };
}
