import {equalSecret} from '@/lib/evidence-pool/auth.server';
import {publishDueEditorial} from '@/lib/operations/editorial-publication.server';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET?.trim();
 if(!secret||!equalSecret(request.headers.get('authorization')??'',`Bearer ${secret}`))return Response.json({error:'unauthorized'},{status:401});
 try{return Response.json({results:await publishDueEditorial()},{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'publication_unavailable'},{status:503});}
}
