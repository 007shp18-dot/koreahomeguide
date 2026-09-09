import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'sp_evidence_session';
export const SESSION_SECONDS = 8 * 60 * 60;
export function adminSecret(): string { return process.env.CONTENT_ADMIN_SECRET?.trim() ?? ''; }
export function strongSecret(secret: string): boolean { return secret.length >= 32; }
export function equalSecret(a: string, b: string): boolean {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function sign(payload: string, secret: string) { return createHmac('sha256', secret).update(`evidence-admin:v1:${payload}`).digest('base64url'); }
export function issueSession(secret: string, now = Date.now()): string {
  if (!strongSecret(secret)) throw new Error('admin_not_configured');
  const payload = `${now}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${sign(payload, secret)}`;
}
export function verifySession(token: string, secret: string, now = Date.now()): boolean {
  if (!strongSecret(secret) || !/^\d{13}\.[a-f0-9]{48}\.[A-Za-z0-9_-]{43}$/u.test(token)) return false;
  const [issued, nonce, signature] = token.split('.');
  const age = now - Number(issued);
  return Boolean(signature && age >= 0 && age < SESSION_SECONDS * 1000 && equalSecret(signature, sign(`${issued}.${nonce}`, secret)));
}
export function requestSession(request: Request): string {
  return request.headers.get('cookie')?.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? '';
}
export function authorized(request: Request, secret = adminSecret(), now = Date.now()): boolean { return verifySession(requestSession(request), secret, now); }
export function operatorId(request: Request): string { return `operator-${requestSession(request).split('.')[1]?.slice(0, 12) ?? 'unknown'}`; }
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
export function sessionCookie(value: string, secure: boolean, clear = false): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
