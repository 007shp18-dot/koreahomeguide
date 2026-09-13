import { loadLivingContexts } from '../../../lib/research/living-context.server';
import { selectLivingContexts } from '../../../lib/research/living-context';
export async function GET(request: Request) {
  const entity = new URL(request.url).searchParams.get('entity');
  if (entity !== null && (!entity || entity.length > 180)) return Response.json({ error: 'Invalid entity' }, { status: 400 });
  const profile = new URL(request.url).searchParams.get('profile');
  if (profile !== null && (!profile || profile.length > 100)) return Response.json({ error: 'Invalid profile' }, { status: 400 });
  const result = await loadLivingContexts({ entity, profile });
  return Response.json({ ...result, profiles: selectLivingContexts(result.profiles, entity).filter(row => !profile || row.id === profile) }, {
    // This endpoint reports availability of optional research. Missing research
    // remains explicit in the payload and must not fail the surrounding page.
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
