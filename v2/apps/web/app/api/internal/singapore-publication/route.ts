import { authorized, sameOrigin, equalSecret } from '../../../../lib/evidence-pool/auth.server';
import { getSingaporePublicationStatus } from '../../../../lib/singapore/publication.server';
import { publishSingaporeObservations } from '../../../../lib/singapore/publication-build.server';
import { invalidateSingaporePublicationPages } from '../../../../lib/singapore/publication-invalidate.server';
export const runtime = 'nodejs';
export const maxDuration = 300;
const reply = (body: unknown, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'private, no-store'}});
export async function GET(request: Request) {
 const secret = process.env.CRON_SECRET?.trim();
 const cron = Boolean(secret && equalSecret(request.headers.get('authorization') ?? '', `Bearer ${secret}`));
 if (cron) { try { const publication = await publishSingaporeObservations({apply:true}); invalidateSingaporePublicationPages(); return reply({publication}); } catch { return reply({error:'publication_withheld'},422); } }
 if (!authorized(request)) return reply({error:'unauthorized'},401);
 return reply({publication:await getSingaporePublicationStatus()});
}
export async function POST(request: Request) {
 if (!authorized(request)) return reply({error:'unauthorized'},401);
 if (!sameOrigin(request)) return reply({error:'invalid_origin'},403);
 try { const publication = await publishSingaporeObservations({apply:true}); invalidateSingaporePublicationPages(); return reply({publication}); }
 catch { return reply({error:'publication_withheld'},422); }
}
