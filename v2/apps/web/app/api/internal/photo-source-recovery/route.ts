import {contentDatabase} from '@/lib/db/postgres.server';
import {equalSecret} from '@/lib/evidence-pool/auth.server';
import {recoverPhotoSources} from '@/lib/photos/photo-source-recovery.server';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim();
 if(!secret||!equalSecret(request.headers.get('authorization')??'',`Bearer ${secret}`))return Response.json({error:'unauthorized'},{status:401});
 const db=contentDatabase();if(!db)return Response.json({error:'database_not_configured'},{status:503});
 try{return Response.json(await recoverPhotoSources({query:(s,p)=>db.query(s,p)}),{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'source_recovery_failed'},{status:503});}
}
