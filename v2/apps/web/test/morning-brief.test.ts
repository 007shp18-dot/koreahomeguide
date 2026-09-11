import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compareFindings, koreaDate, safeHttps, type Finding } from '../lib/operations/morning-brief';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: vi.fn() }));
vi.mock('../lib/news/public-headlines.server', () => ({ readPublicHeadlines: vi.fn() }));
vi.mock('../content/portfolio-manifest', () => ({ listPortfolioRecords: () => [] }));
import { checkPage, collectBrief, runMorningBrief } from '../lib/operations/morning-brief.server';
import { contentDatabase } from '../lib/db/postgres.server';
import { readPublicHeadlines } from '../lib/news/public-headlines.server';
import { GET, POST } from '../app/api/internal/morning-brief/route';
import { issueSession, SESSION_COOKIE } from '../lib/evidence-pool/auth.server';

beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('morning brief', () => {
  it('uses the Korean calendar date at midnight and year boundary', () => {
    expect(koreaDate(new Date('2026-12-31T14:59:59Z'))).toBe('2026-12-31');
    expect(koreaDate(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });
  it('rejects active or credential-bearing evidence URLs', () => {
    expect(safeHttps('javascript:alert(1)')).toBe(false); expect(safeHttps('https://user:pass@example.com')).toBe(false); expect(safeHttps('https://example.com/news')).toBe(true);
  });
  it('distinguishes absent findings from confirmed fixes', () => {
    const finding = (id: string) => ({ id } as Finding);
    expect(compareFindings([finding('b'), finding('c')], [finding('a'), finding('b')])).toEqual({ newFindingIds: ['c'], continuingFindingIds: ['b'], absentFindingIds: ['a'] });
  });
  it('does not fetch caller-selected URLs or forward credentials', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('<title>Home</title><h1>Home</h1>'));
    vi.stubGlobal('fetch', fetcher);
    await expect(checkPage('https://localhost/')).rejects.toThrow('unsupported_probe'); expect(fetcher).not.toHaveBeenCalled();
    expect((await checkPage('/')).problem).toBeNull();
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: 'error', cache: 'no-store' });
    expect(fetcher.mock.calls[0]?.[1].headers).not.toHaveProperty('Cookie');
  });
  it('reports failures as unavailable, not healthy data or a quiet market', async () => {
    vi.mocked(contentDatabase).mockReturnValue(vi.fn().mockRejectedValue(new Error('offline')) as unknown as NonNullable<ReturnType<typeof contentDatabase>>);
    vi.mocked(readPublicHeadlines).mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const report = await collectBrief(null, new Date('2026-09-10T23:00:00Z'));
    expect(report.unavailable).toEqual(['자료 수집 상태', 'DB 기사 목록', '부동산 뉴스']);
    expect(report.findings.some(item => item.priority === 'fix')).toBe(true);
    expect(Object.keys(report.issues)).toHaveLength(4);
  });
  it('does not regenerate or send when another run owns today', async () => {
    vi.mocked(contentDatabase).mockReturnValue(vi.fn().mockResolvedValue([]) as unknown as NonNullable<ReturnType<typeof contentDatabase>>);
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect(await runMorningBrief()).toEqual({ status: 'already-running-or-completed' }); expect(fetcher).not.toHaveBeenCalled();
  });
  it('protects private reads and rejects cross-origin and preview writes', async () => {
    vi.stubEnv('EVIDENCE_ADMIN_SECRET', 's'.repeat(40)); vi.stubEnv('CRON_SECRET', 'cron-secret');
    expect((await GET(new Request('https://www.signedprice.com/api/internal/morning-brief/'))).status).toBe(401);
    const cookie = `${SESSION_COOKIE}=${issueSession('s'.repeat(40))}`;
    expect((await POST(new Request('https://www.signedprice.com/api/internal/morning-brief/', { method: 'POST', headers: { cookie, origin: 'https://evil.example' } }))).status).toBe(403);
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect((await GET(new Request('https://www.signedprice.com/api/internal/morning-brief/', { headers: { authorization: 'Bearer cron-secret' } }))).status).toBe(403);
  });
});
