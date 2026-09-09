import { test, expect } from '@playwright/test';
import type { Evidence, PoolData } from '../../apps/web/lib/evidence-pool/contract';

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
    if (url.searchParams.get('view') === 'research') return route.fulfill({ json: { total: 1, groups: [{market:'kr-seoul',tool:'single-quote',count:1}], distributions: [{market:'kr-seoul',tool:'single-quote',currency:'KRW',kind:'band',field:'area',value:'sqm-60-85',label:'60–85 m²',count:1}], recent: [{market:'kr-seoul',tool:'single-quote',createdAt:now,expiresAt:'2099-12-31T00:00:00.000Z',bands:{area:'60–85 m²'},categories:{verdict:'typical'}}] } });
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
  await page.getByRole('button',{name:'Tool 공유 데이터',exact:true}).click();
  await expect(page.getByRole('heading',{name:'보관 중인 공유 1건'})).toBeVisible();
  await expect(page.getByText('60–85 m²',{exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
