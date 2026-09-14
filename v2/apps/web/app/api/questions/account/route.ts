import { randomBytes, randomUUID } from 'node:crypto';
import { field, QuestionError } from '@/lib/questions/model';
import { cookieToken,database,failure,hash,jsonBody,member,mutationOrigin,networkKey,newSession,passwordHash,passwordMatches,rateLimit,reply,sessionCookie } from '@/lib/questions/security.server';
export const dynamic='force-dynamic';
export async function GET(request: Request) { try { return reply({user:await member(request)}); } catch(e) { return failure(e); } }
export async function DELETE(request: Request) { try { mutationOrigin(request); const token=cookieToken(request); if(token) await database().query('DELETE FROM sp_qa_sessions WHERE token_hash=$1',[hash(token)]); return reply({ok:true},200,{'Set-Cookie':sessionCookie('',request)}); } catch(e) { return failure(e); } }
export async function POST(request: Request) { try {
 mutationOrigin(request); const input=await jsonBody(request); const network=networkKey(request);
 await rateLimit(`auth:${network}`,30,900);
 const username=field(input.username,4,24).toLowerCase(); if(!/^[a-z0-9_]+$/.test(username)) throw new QuestionError('invalid_username');
 const password=field(input.password,12,128); const db=database(); let userId: string; let recovery: string | undefined;
 if(input.action==='register') {
  await rateLimit(`register:${network}`,5,86400); const nickname=field(input.nickname,2,30);
  if(/admin|signedprice|운영자|관리자|官方|管理员/i.test(nickname)) throw new QuestionError('invalid_nickname');
  const id=randomUUID(); recovery=randomBytes(24).toString('hex'); const encoded=await passwordHash(password);
  const rows=await db.query('INSERT INTO sp_qa_users(id,username,nickname,password_hash,recovery_hash) VALUES($1,$2,$3,$4,$5) ON CONFLICT(username) DO NOTHING RETURNING id',[id,username,nickname,encoded,hash(recovery)]);
  if(!rows.length) throw new QuestionError('username_taken',409); userId=id;
 } else if(input.action==='login') {
  await rateLimit(`login:${hash(username)}`,15,900);
  const rows=await db.query('SELECT id,password_hash,blocked FROM sp_qa_users WHERE username=$1',[username]); const row=rows[0];
  const matched=await passwordMatches(password,String(row?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(64)}`));
  if(!row || !matched || row.blocked) throw new QuestionError('login_failed',401); userId=String(row.id);
 } else if(input.action==='recover') {
  const code=field(input.recovery,48,48); recovery=randomBytes(24).toString('hex'); const encoded=await passwordHash(password);
  const rows=await db.query(`WITH changed AS (UPDATE sp_qa_users SET password_hash=$3,recovery_hash=$4 WHERE username=$1 AND recovery_hash=$2 AND NOT blocked RETURNING id), revoked AS (DELETE FROM sp_qa_sessions WHERE user_id IN (SELECT id FROM changed)) SELECT id FROM changed`,[username,hash(code),encoded,hash(recovery)]);
  if(!rows.length) throw new QuestionError('login_failed',401); userId=String(rows[0]!.id);
 } else throw new QuestionError('invalid_input');
 const token=await newSession(userId); return reply({ok:true,recovery},200,{'Set-Cookie':sessionCookie(token,request)});
 } catch(e) { return failure(e); } }
