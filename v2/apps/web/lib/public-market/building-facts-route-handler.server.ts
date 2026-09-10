import 'server-only';

import type { OfficialBuildingFacts } from './official-building-facts.server';
import type { PublicEntityProximity } from '../public-data/entity-location-projection.server';

type Identity = Readonly<{
  districtLawdCd: string;
  neighborhoodName: string;
  officialName: string;
  housingType: string;
}>;

type StoredIdentity = Identity & Readonly<{ districtSlug: string; buildingId: string }>;

type Dependencies = Readonly<{
  serviceKey?: string;
  resolveIdentity(districtSlug: string, buildingId: string): Identity | null;
  load(input: Identity & Readonly<{
    serviceKey?: string;
    fetch: typeof globalThis.fetch;
  }>): Promise<OfficialBuildingFacts>;
  loadStored?(input: StoredIdentity): Promise<OfficialBuildingFacts | null>;
  loadProximity?(input: StoredIdentity): Promise<PublicEntityProximity | null>;
  loadInstalled?(input: StoredIdentity): OfficialBuildingFacts | null;
  storeReady?(
    input: StoredIdentity,
    facts: Extract<OfficialBuildingFacts, { status: 'ready' }>,
  ): Promise<void>;
  fetch?: typeof globalThis.fetch;
}>;

export function supplementStoredNearbyFacts(stored: OfficialBuildingFacts, installed: OfficialBuildingFacts | null): OfficialBuildingFacts {
  if (stored.status !== 'ready' || installed?.status !== 'ready' || !installed.nearby
    || stored.match.kaptCode !== installed.match.kaptCode || stored.match.bjdCode !== installed.match.bjdCode) return stored;
  const nearby = Object.fromEntries(Object.entries(installed.nearby).map(([key, value]) => [
    key, stored.nearby?.[key as keyof NonNullable<typeof stored.nearby>] ?? value,
  ])) as NonNullable<typeof installed.nearby>;
  if (JSON.stringify(nearby) === JSON.stringify(stored.nearby)) return stored;
  return Object.freeze({ ...stored, nearby, source: {
    apartment: stored.source?.apartment ?? 'MOLIT K-apt apartment basic information',
    register: stored.source?.register ?? (stored.register === null ? null : 'MOLIT Building HUB building register'),
    nearby: [...new Set([stored.source?.nearby, installed.source?.nearby].filter(Boolean))].join(' · ') || null,
  } });
}

function envelope(facts: OfficialBuildingFacts, proximity?: PublicEntityProximity | null) {
  return Object.freeze({
    schemaVersion: 1,
    ...(proximity === undefined ? {} : { proximity }),
    source: facts.status === 'ready' && facts.source !== undefined
      ? facts.source
      : Object.freeze({
          apartment: 'MOLIT K-apt apartment basic information',
          register: facts.status === 'ready' && facts.register === null
            ? null
            : 'MOLIT Building HUB building register',
        }),
    facts,
  });
}

export function createBuildingFactsGetHandler(dependencies: Dependencies) {
  return async function get(request: Request): Promise<Response> {
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some((name) => name !== 'district' && name !== 'building')
      || params.getAll('district').length !== 1 || params.getAll('building').length !== 1) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const district = params.get('district')!;
    const building = params.get('building')!;
    if (!/^[a-z0-9-]{2,80}$/.test(district) || !/^[a-z0-9-]{2,200}$/.test(building)) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }
    const identity = dependencies.resolveIdentity(district, building);
    if (identity === null) return Response.json({ error: 'not_found' }, { status: 404 });
    const storedIdentity = Object.freeze({ ...identity, districtSlug: district, buildingId: building });
    // Read nearby evidence at request time too: a static Detail build may not
    // have had a database connection, while verified places exist now.
    const proximity = dependencies.loadProximity?.(storedIdentity).catch(() => null);
    const installed = dependencies.loadInstalled?.(storedIdentity) ?? null;
    const withNearby = async (facts: OfficialBuildingFacts) => envelope(facts, await proximity);
    if (dependencies.loadStored !== undefined) {
      try {
        const stored = await dependencies.loadStored(storedIdentity);
        if (stored !== null) {
          return Response.json(await withNearby(supplementStoredNearbyFacts(stored, installed)), {
            status: 200,
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
          });
        }
      } catch (error) {
        console.error('SignedPrice building-facts database read failed.', error);
      }
    }
    if (installed !== null) {
      if (installed.status === 'ready' && dependencies.storeReady !== undefined) {
        try { await dependencies.storeReady(storedIdentity, installed); }
        catch (error) { console.error('SignedPrice installed building-facts database write failed.', error); }
      }
      return Response.json(await withNearby(installed), {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      });
    }
    const facts = await dependencies.load({
      ...identity,
      serviceKey: dependencies.serviceKey,
      fetch: dependencies.fetch ?? globalThis.fetch,
    });
    if (facts.status === 'ready' && dependencies.storeReady !== undefined) {
      try { await dependencies.storeReady(storedIdentity, facts); }
      catch (error) { console.error('SignedPrice building-facts database write failed.', error); }
    }
    return Response.json(await withNearby(facts), {
      status: 200,
      headers: {
        'Cache-Control': facts.status === 'ready'
          ? 'public, s-maxage=86400, stale-while-revalidate=604800'
          : 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  };
}
