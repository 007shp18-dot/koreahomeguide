import type { SiteLocale } from '../navigation/site-navigation';
export type { SiteLocale };
export const cities = ['seoul', 'singapore', 'dubai', 'tokyo'] as const;
export type City = typeof cities[number];
export type Scope = { market: City; path: string; name: string };
export type Member = { id: string; nickname: string };
export type QuestionPost = { id: string; parentId: string | null; market: City; placePath: string; placeName: string; title: string; body: string; author: string; operator: boolean; mine: boolean; status: string; createdAt: string; answers: number; userId?: string; blocked?: boolean; reason?: string; reports?: number };
export type QuestionPage = { posts: QuestionPost[]; hasMore: boolean; question?: QuestionPost; events?: { action: string; reason: string; actor: string; created_at: string }[]; reports?: { reason: string; resolved_at: string | null; created_at: string }[] };
export function isCity(value: unknown): value is City { return cities.includes(value as City); }
export function prefix(locale: SiteLocale) { return locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn'; }
export function questionsHref(locale: SiteLocale, market?: City, id?: string) { return `${prefix(locale)}/community/${id ? `${id}/` : market ? `?market=${market}` : ''}`; }
export function cityName(city: City, locale: SiteLocale) { return ({ seoul: ['Seoul','서울','首尔'], singapore: ['Singapore','싱가포르','新加坡'], dubai: ['Dubai','두바이','迪拜'], tokyo: ['Tokyo','도쿄','东京'] }[city])[locale === 'ko' ? 1 : locale === 'zh-CN' ? 2 : 0]!; }
export function canonicalPlace(path: string): string { return path.split(/[?#]/)[0]!.replace(/^\/(ko|zh-cn)(?=\/)/, '').replace(/\/?$/, '/'); }
export function validScope(scope: Scope): boolean {
 const roots = { seoul: '/kr/seoul/explore/', singapore: '/sg/singapore/', dubai: '/ae/dubai/explore/', tokyo: '/jp/tokyo/explore/' };
 return isCity(scope.market) && scope.path.startsWith(roots[scope.market]) && /^\/[a-zA-Z0-9_/%-]+\/$/.test(scope.path) && !scope.path.includes('..') && !/%(?:2f|5c|2e)/i.test(scope.path) && scope.path.length <= 400 && scope.name.length >= 1 && scope.name.length <= 160;
}
export function moderate(text: string): string {
 if (/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|me)\b)/iu.test(text)) return 'link';
 if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]*){9,}/iu.test(text)) return 'contact';
 if (/(.)\1{12,}/u.test(text)) return 'repetition';
 return '';
}
export class QuestionError extends Error { constructor(public code: string, public status = 400) { super(code); } }
export function field(value: unknown, min: number, max: number): string { if (typeof value !== 'string') throw new QuestionError('invalid_input'); const text = value.trim().normalize('NFC'); if (text.length < min || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(text)) throw new QuestionError('invalid_input'); return text; }
export function postId(value: unknown): string { if (typeof value !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)) throw new QuestionError('invalid_input'); return value; }
