import { failure,jsonBody,member,mutationOrigin,networkKey,rateLimit,reply,requireMember } from '@/lib/questions/security.server';
import { listQuestions,userAction,writePost } from '@/lib/questions/repository.server';
export const dynamic='force-dynamic';
export async function GET(request: Request) { try { return reply(await listQuestions(new URL(request.url).searchParams,await member(request))); } catch(e) { return failure(e); } }
export async function POST(request: Request) { try { mutationOrigin(request); const input=await jsonBody(request); const user=await requireMember(request); await rateLimit(`post:${user.id}`,6,600); await rateLimit(`daily:${user.id}`,50,86400); await rateLimit(`network-post:${networkKey(request)}`,100,3600); return reply(input.action==='create'?await writePost(input,user):await userAction(input,user)); } catch(e) { return failure(e); } }
