import { test, expect } from '@playwright/test';
import type { Evidence, PoolData } from '../../apps/web/lib/evidence-pool/contract';
import type { CollectionStatus } from '../../apps/web/lib/data-operations/repository.server';

test('overview preserves unknown counts and opens the exact city review filter', async ({ page, baseURL }) => {
  test.skip(!baseURL?.includes('127.0.0.1') && !baseURL?.includes('localhost'), 'Synthetic admin session is local-test-only.');
  const origin = new URL(baseURL!); origin.hostname = 'localhost';
  const cities: string[] = [];
  let writes = 0;
  await page.route('**/api/internal/**', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() !== 'GET') { writes++; return route.fulfill({ status: 500, json: { error: 'unexpected_write' } }); }
    if (url.pathname === '/api/internal/admin-overview/') {
      const city = url.searchParams.get('city') ?? 'all'; cities.push(city);
      return route.fulfill({ json: { city, refreshedAt: '2026-09-14T00:00:00Z', jobs: null, issues: [{ market: 'seoul', quality: 'duplicate', count: 7 }], editorial: { total: 2, articles: [] }, unavailable: ['수집 기록'] } });
    }
    if (url.pathname === '/api/internal/evidence-pool/') return route.fulfill({ json: { sources: [], evidence: [], total: 0, page: 1, counts: { pending: 0, approved: 0, rejected: 0, withdrawn: 0, expired: 0 } } });
    return route.fulfill({ status: 503, json: { error: 'fixture_not_configured' } });
  });
  const login = await page.request.post(`${origin.origin}/api/internal/evidence-session/`, { headers: { Origin: origin.origin }, data: { secret: 'playwright-only-evidence-admin-secret-32-characters' } });
  expect(login.status()).toBe(200);
  await page.goto(`${origin.origin}/admin/`);
  const dashboard = page.getByRole('region', { name: '운영 현황 대시보드' });
  await expect(dashboard.getByRole('alert')).toContainText('조회 실패');
  await expect(dashboard.getByRole('button', { name: /DB 저장·갱신/ })).toContainText('—');
  await expect(dashboard.getByRole('button', { name: /자료 확인 필요/ })).toContainText('7건');
  await expect(dashboard.getByRole('button', { name: /기사 발행 대기/ })).toContainText('2편');
  await dashboard.getByRole('button', { name: '서울', exact: true }).click();
  await expect.poll(() => cities.includes('seoul')).toBe(true);
  await expect(dashboard.getByRole('button', { name: '서울', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dashboard.getByRole('button', { name: '서울 중복 후보 살펴보기' }).click();
  await expect(page).toHaveURL(/#evidence$/);
  await expect(page.locator('select[name="market"]')).toHaveValue('seoul');
  await expect(page.locator('select[name="status"]')).toHaveValue('pending');
  await expect(page.getByLabel('수집 점검')).toHaveValue('duplicate');
  expect(writes).toBe(0);
});

test('collection operations separates failed, unrun and unpublished states without writes', async ({ page, baseURL }) => {
  test.skip(!baseURL?.includes('127.0.0.1') && !baseURL?.includes('localhost'), 'Synthetic admin session is local-test-only.');
  const origin = new URL(baseURL!); origin.hostname = 'localhost';
  const source: CollectionStatus = { sourceId:'fixture-seoul',name:'서울 검증 출처',market:'seoul',category:'fees',url:'https://example.com/source',mode:'page-monitor',intervalDays:7,limitation:'검증용 자료',lastSuccessAt:'2026-09-09T00:00:00Z',lastAttemptAt:'2026-09-09T00:00:00Z',nextDueAt:'2099-01-01T00:00:00Z',lastPublishedAt:null,consecutiveFailures:0,lastError:null,anomaly:null,newCount:0,changedCount:0,pendingCount:0,latestSnapshotId:null,probe:null,pendingCandidateCount:0,recordCount:0 };
  const sources = [source, {...source,sourceId:'fixture-singapore',name:'싱가포르 실패 출처',market:'singapore',consecutiveFailures:2,lastError:'http_503',pendingCount:3}, {...source,sourceId:'fixture-tokyo',name:'도쿄 미실행 출처',market:'tokyo',lastSuccessAt:null,lastAttemptAt:null,nextDueAt:null}];
  let writes = 0; let publicationFails = true;
  await page.route('**/api/internal/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') { writes++; return route.fulfill({status:500,json:{error:'unexpected_write'}}); }
    if (path === '/api/internal/data-collection/') return route.fulfill({json:{sources,markets:[],publication:'review required'}});
    if (path === '/api/internal/singapore-publication/') return route.fulfill(publicationFails ? {status:503,json:{error:'unavailable'}} : {json:{publication:null}});
    if (path === '/api/internal/evidence-pool/') return route.fulfill({json:{sources:[],evidence:[],total:0,page:1,counts:{pending:0,approved:0,rejected:0,withdrawn:0,expired:0}}});
    return route.fulfill({status:503,json:{error:'fixture_not_configured'}});
  });
  const login = await page.request.post(`${origin.origin}/api/internal/evidence-session/`, {headers:{Origin:origin.origin},data:{secret:'playwright-only-evidence-admin-secret-32-characters'}});
  expect(login.status()).toBe(200);
  await page.goto(`${origin.origin}/admin/evidence/`);
  await page.getByRole('button',{name:'수집·데이터 상태',exact:true}).click();
  const panel = page.getByRole('region',{name:'정기 수집 운영',exact:true});
  const table = panel.getByRole('table',{name:/출처별 수집 상태/});
  await expect(table.getByText('서울 검증 출처',{exact:true})).toBeVisible();
  await expect(panel.getByRole('button',{name:/싱가포르.*공개 상태 조회 실패/})).toBeVisible();
  await panel.getByLabel('확인할 상태',{exact:true}).selectOption('failed');
  await expect(table.getByText('싱가포르 실패 출처',{exact:true})).toBeVisible();
  await expect(table.getByText('서울 검증 출처',{exact:true})).toHaveCount(0);
  await panel.getByLabel('도시',{exact:true}).selectOption('tokyo');
  await expect(panel.getByText('선택한 조건에 맞는 항목이 없습니다.')).toBeVisible();
  await panel.getByRole('button',{name:'필터 초기화'}).click();
  await panel.getByLabel('확인할 상태',{exact:true}).selectOption('unrun');
  await expect(table.getByText('도쿄 미실행 출처',{exact:true})).toBeVisible();
  await expect(table.getByText('실행 기록 없음 · 정상 여부 미확인')).toBeVisible();
  await expect(table.getByText('싱가포르 실패 출처',{exact:true})).toHaveCount(0);
  publicationFails = false;
  await panel.getByRole('button',{name:'수집·공개 상태 새로고침'}).click();
  await expect(panel.getByRole('button',{name:/싱가포르.*공개 버전 기록 없음/})).toBeVisible();
  await expect(panel.locator('details').filter({has:page.locator('summary').filter({hasText:'검증·공개·건물 보강 작업'})})).not.toHaveAttribute('open','');
  expect(writes).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('evidence filters, bulk confirmation and consent dashboard are usable', async ({ page, baseURL }) => {
  test.skip(!baseURL?.includes('127.0.0.1') && !baseURL?.includes('localhost'), 'Synthetic admin credentials are only used on the local test server.');
  // NextURL canonicalizes loopback IPs to localhost; use that same origin
  // for the strict same-origin session endpoint and its cookie.
  const adminURL = new URL(baseURL!); adminURL.hostname = 'localhost';
  const adminOrigin = adminURL.origin;
  const now = new Date().toISOString();
  const row: Evidence = { id: '11111111-1111-4111-8111-111111111111', sourceId: '22222222-2222-4222-8222-222222222222', sourceName: '검증용 공식 출처', sourceStatus: 'approved', sourceKind: 'official', version: 1, createdAt: now, status: 'pending', market: 'seoul', tier: 'essential', metric: 'sale_price', basis: 'paid', amount: 500000000, currency: 'KRW', unit: 'total', area: '검증 지역', building: '검증 단지', sizeSqm: 80, observedOn: now.slice(0,10), expiresOn: '2099-12-31', url: 'https://example.com/evidence', housingType: '아파트', conditions: '잔금 지급 완료, 공실 인도' };
  let changed = false; let previews = 0; let confirmations = 0;
  const queried: string[] = [];
  await page.route('**/api/internal/evidence-pool/**', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === 'POST') {
      const command = request.postDataJSON();
      expect(command.scope.ids).toEqual([row.id]); expect(command.reason).toBe('공식 근거와 조건 확인');
      if (command.action === 'bulk-review') { expect(command.fingerprint).toBe('a'.repeat(32)); changed = true; confirmations++; }
      else { expect(command.action).toBe('bulk-preview'); previews++; }
      return route.fulfill({ json: { matched: 1, eligible: 1, blocked: 0, fingerprint: 'a'.repeat(32), ...(changed ? {changed:1} : {}) } });
    }
    if (url.searchParams.get('view') === 'research') return route.fulfill({ json: { countedAt: now, lastAggregatedAt: null, priorities: [], total: 1, groups: [{market:'kr-seoul',tool:'single-quote',count:1}], distributions: [{market:'kr-seoul',tool:'single-quote',currency:'KRW',kind:'band',field:'area',value:'sqm-60-85',label:'60–85 m²',count:1}], recent: [{market:'kr-seoul',tool:'single-quote',createdAt:now,expiresAt:'2099-12-31T00:00:00.000Z',bands:{area:'60–85 m²'},categories:{verdict:'typical'}}] } });
    queried.push(url.searchParams.get('quality') ?? '');
    const data: PoolData = { sources: [], evidence: [{...row,status:changed?'approved':'pending',version:changed?2:1}], total:1, page:1, counts:{pending:changed?0:1,approved:changed?1:0,rejected:0,withdrawn:0,expired:0} };
    return route.fulfill({json:data});
  });
  const login = await page.request.post(`${adminOrigin}/api/internal/evidence-session/`, {headers:{Origin:adminOrigin},data:{secret:'playwright-only-evidence-admin-secret-32-characters'}});
  expect(login.status(), await login.text()).toBe(200);
  await page.goto(`${adminOrigin}/admin/evidence/`);
  await expect(page.getByRole('button',{name:'검증 단지',exact:true})).toBeVisible();
  await page.getByLabel('수집 점검').selectOption('qualified');
  await page.getByRole('button',{name:'조회',exact:true}).click();
  await expect.poll(() => queried.includes('qualified')).toBe(true);
  await page.getByLabel('검증 단지 선택').check();
  await page.getByLabel('공통 검토 사유').fill('공식 근거와 조건 확인');
  await page.getByRole('button',{name:'처리 대상 확인'}).click();
  await expect(page.getByText('조회 1건 · 처리 가능 1건 · 제외 0건')).toBeVisible();
  expect(previews).toBe(1); expect(confirmations).toBe(0);
  await page.getByRole('button',{name:'1건 승인 확정'}).click();
  await expect(page.getByText('1건의 결정과 이력을 저장했습니다.')).toBeVisible();
  expect(confirmations).toBe(1);
  await page.getByRole('button',{name:'공유 조사 자료',exact:true}).click();
  await expect(page.getByRole('heading',{name:'보관 중인 공유 1건'})).toBeVisible();
  await expect(page.getByText('60–85 m²',{exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
