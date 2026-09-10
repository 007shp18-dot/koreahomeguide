import 'server-only';
import { randomUUID } from 'node:crypto';
import { contentDatabase } from '../db/postgres.server';
import { readPublicHeadlines } from '../news/public-headlines.server';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import { briefText, compareFindings, koreaDate, safeHttps, type BriefItem, type MorningBrief, type PageCheck } from './morning-brief';

const origin = 'https://www.signedprice.com';
const paths = ['/', '/ko/', '/news/', '/ko/news/', '/zh-cn/news/', '/kr/seoul/explore/', '/sg/singapore/', '/ae/dubai/', '/jp/tokyo/'];
export async function checkPage(path: string): Promise<PageCheck> {
  if (!paths.includes(path)) throw new Error('unsupported_probe');
  const href = origin + path; const started = Date.now();
  try {
    const response = await fetch(href, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'SignedPrice-Morning-Brief/1.0' } });
    const reader = response.body?.getReader(); let html = ''; let bytes = 0; const decoder = new TextDecoder();
    if (reader) {
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 2_000_000) throw new Error('body_limit'); html += decoder.decode(value, { stream: true }); } }
      finally { await reader.cancel().catch(() => undefined); }
    }
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1]?.replace(/<[^>]*>/gu, '').slice(0, 200) ?? '';
    const problem = !response.ok ? `HTTP ${response.status}` : !title ? 'HTML 제목 확인 불가' : !/<h1[\s>]/iu.test(html) ? 'HTML의 대표 제목 확인 필요' : null;
    return { href, status: response.status, milliseconds: Date.now() - started, title, problem };
  } catch { return { href, status: null, milliseconds: Date.now() - started, title: '', problem: '연결·리디렉션·응답 제한으로 검사 불가' }; }
}
export async function collectBrief(previous: MorningBrief | null, now = new Date()): Promise<MorningBrief> {
  const sql = contentDatabase(); if (!sql) throw new Error('database_not_configured');
  const report: MorningBrief = { date: koreaDate(now), checkedAt: now.toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null, pages: [], findings: [], content: [], issues: { 서울: [], 싱가포르: [], 두바이: [], 도쿄: [] }, unavailable: [], ...compareFindings([], []) };
  // At most three public requests at once, without triggering a full-site crawl.
  for (let i = 0; i < paths.length; i += 3) report.pages.push(...await Promise.all(paths.slice(i, i + 3).map(checkPage)));
  for (const page of report.pages) {
    if (page.problem) report.findings.push({ id: `page:${page.href}`, priority: page.status !== null && page.status >= 400 ? 'fix' : 'review', title: page.problem, evidence: page.href, href: page.href, action: '운영 화면과 서버 로그를 함께 확인하고 재현된 오류 수정' });
    else if (page.milliseconds > 3000) report.findings.push({ id: `slow:${page.href}`, priority: 'review', title: '서버 요청 3초 초과', evidence: `${page.milliseconds}ms 단일 관측; 사용자 체감 속도와 다름`, href: page.href, action: '반복 측정과 캐시·DB 로그로 실제 병목 여부 확인' });
  }
  const results = await Promise.allSettled([
    sql`SELECT source_id, last_success_at, consecutive_failures, last_error FROM data_collection_state WHERE consecutive_failures > 0 ORDER BY consecutive_failures DESC, source_id LIMIT 20`,
    sql`SELECT slug, locale, title, published_at FROM content_articles WHERE editorial_status = 'published' AND evidence_state <> 'withdrawn' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL AND published_at > ${new Date(now.getTime() - 86400_000).toISOString()}::timestamptz AND published_at <= ${now.toISOString()}::timestamptz ORDER BY published_at DESC LIMIT 100`,
    readPublicHeadlines(),
  ]);
  const [collection, articles, news] = results;
  if (collection.status === 'fulfilled') for (const row of collection.value) report.findings.push({ id: `collection:${row.source_id}`, priority: 'fix', title: `자료 수집 실패: ${row.source_id}`, evidence: `연속 ${row.consecutive_failures}회 · 마지막 성공 ${row.last_success_at ?? '기록 없음'}`, href: `${origin}/admin/evidence/`, action: '수집 운영에서 실패 원인·공급자 제한을 확인하고 데이터 갱신 상태 검증' });
  else report.unavailable.push('자료 수집 상태');
  const recent = (date: string) => Date.parse(date) > now.getTime() - 86400_000 && Date.parse(date) <= now.getTime();
  for (const locale of ['ko', 'en', 'zh-CN'] as const) for (const article of listPortfolioRecords(locale)) if (recent(article.publishedAt)) report.content.push({ title: article.title, href: origin + article.canonicalHref, date: article.publishedAt, label: locale });
  if (articles.status === 'fulfilled') for (const row of articles.value) {
    const prefix = row.locale === 'ko' ? '/ko' : row.locale === 'zh-CN' ? '/zh-cn' : '';
    report.content.push({ title: String(row.title), href: `${origin}${prefix}/news/${encodeURIComponent(String(row.slug))}/`, date: new Date(row.published_at).toISOString(), label: String(row.locale) });
  } else report.unavailable.push('DB 기사 목록');
  report.content = [...new Map(report.content.map(item => [item.href, item])).values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
  if (news.status === 'fulfilled' && news.value !== null) {
    const cityNames: Record<string, string> = { seoul: '서울', singapore: '싱가포르', dubai: '두바이', tokyo: '도쿄' }; const seen = new Set<string>();
    for (const item of news.value) {
      const city = cityNames[item.market]; const age = now.getTime() - Date.parse(item.publishedAt);
      const bucket = city ? report.issues[city] : undefined;
      if (!bucket || !Number.isFinite(age) || age < 0 || age > 7 * 86400_000 || !safeHttps(item.url) || seen.has(item.url) || bucket.length >= 3) continue;
      seen.add(item.url); bucket.push({ title: item.titleKo || item.title, href: item.url, date: item.publishedAt, label: item.publisher } satisfies BriefItem);
    }
  } else report.unavailable.push('부동산 뉴스');
  for (const [city, items] of Object.entries(report.issues)) if (!items.length) report.findings.push({ id: `news:${city}`, priority: 'review', title: `${city} 최신 이슈 근거 보강`, evidence: '최근 7일 수집·검토 목록에서 표시 가능한 항목 없음', action: '해당 도시의 공식 발표와 뉴스 수집 상태 확인; 빈 목록을 시장 안정으로 해석하지 않기', href: `${origin}/news/` });
  Object.assign(report, compareFindings(report.findings, previous?.findings ?? []));
  return report;
}
export async function listBriefs() {
  const sql = contentDatabase(); if (!sql) throw new Error('database_not_configured');
  return sql`SELECT report_date::text, state, report, email_state, completed_at FROM morning_briefs ORDER BY report_date DESC LIMIT 14`;
}
export async function runMorningBrief() {
  const sql = contentDatabase(); if (!sql) throw new Error('database_not_configured');
  const date = koreaDate(); const token = randomUUID();
  const acquired = await sql`INSERT INTO morning_briefs (report_date, state, lease_token, lease_until) VALUES (${date}, 'running', ${token}::uuid, now() + interval '5 minutes') ON CONFLICT (report_date) DO UPDATE SET state = 'running', lease_token = EXCLUDED.lease_token, lease_until = EXCLUDED.lease_until WHERE morning_briefs.state <> 'completed' AND morning_briefs.lease_until < now() RETURNING report_date`;
  if (!acquired.length) return { status: 'already-running-or-completed' };
  try {
    const previous = await sql`SELECT report FROM morning_briefs WHERE state = 'completed' AND report_date < ${date}::date ORDER BY report_date DESC LIMIT 1`;
    const report = await collectBrief((previous[0]?.report as MorningBrief | undefined) ?? null);
    const mailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MORNING_BRIEF_FROM && process.env.MORNING_BRIEF_TO);
    const stored = await sql`UPDATE morning_briefs SET state = 'completed', report = ${JSON.stringify(report)}::jsonb, completed_at = now(), email_state = ${mailConfigured ? 'pending' : 'not-configured'} WHERE report_date = ${date} AND lease_token = ${token}::uuid AND state = 'running' RETURNING report_date`;
    if (!stored.length) return { status: 'lease-lost' };
    if (mailConfigured) {
      // Only this winning run sends. Ambiguous network results are not retried automatically.
      try {
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `signedprice-morning-${date}` }, body: JSON.stringify({ from: process.env.MORNING_BRIEF_FROM, to: [process.env.MORNING_BRIEF_TO], subject: `SignedPrice 오늘 할 일 · ${date}`, text: briefText(report) }) });
        const result = await response.json() as { id?: string };
        await sql`UPDATE morning_briefs SET email_state = ${response.ok && result.id ? 'accepted' : 'failed'}, email_provider_id = ${response.ok ? result.id ?? null : null} WHERE report_date = ${date} AND lease_token = ${token}::uuid`;
      } catch { await sql`UPDATE morning_briefs SET email_state = 'failed' WHERE report_date = ${date} AND lease_token = ${token}::uuid`; }
    }
    return { status: 'completed', date };
  } catch (error) {
    await sql`UPDATE morning_briefs SET state = 'failed', lease_until = now() WHERE report_date = ${date} AND lease_token = ${token}::uuid AND state = 'running'`;
    throw error;
  }
}
