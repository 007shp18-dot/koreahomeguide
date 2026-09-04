import 'server-only';

import type { OfficialBuildingFacts } from './official-building-facts.server';

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
  storeReady?(
    input: StoredIdentity,
    facts: Extract<OfficialBuildingFacts, { status: 'ready' }>,
  ): Promise<void>;
  fetch?: typeof globalThis.fetch;
}>;

function envelope(facts: OfficialBuildingFacts) {
  return Object.freeze({
    schemaVersion: 1,
    source: Object.freeze({
      apartment: 'MOLIT K-apt apartment basic information',
      register: 'MOLIT Building HUB building register',
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
    if (dependencies.loadStored !== undefined) {
      try {
        const stored = await dependencies.loadStored(storedIdentity);
        if (stored !== null) {
          return Response.json(envelope(stored), {
            status: 200,
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
          });
        }
      } catch (error) {
        console.error('SignedPrice building-facts database read failed.', error);
      }
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
    return Response.json(envelope(facts), {
      status: 200,
      headers: {
        'Cache-Control': facts.status === 'ready'
          ? 'public, s-maxage=86400, stale-while-revalidate=604800'
          : 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  };
}
