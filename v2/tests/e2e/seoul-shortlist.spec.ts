import { expect, test } from '@playwright/test';

test('budget shortlist saves conditions and tracks newly observed records across reloads', async ({ page }, testInfo) => {
  let updated = false;
  const item = {
    key: 'jongno-gu/jongno-test', buildingId: 'jongno-test', district: 'jongno-gu',
    name: '테스트 아파트', neighborhood: '테스트동',
    latest: { filedMonth: '2026-08', areaSqm: 84, priceWon: 800_000_000, floor: 3 },
    matchingCount: 1, signatures: ['2026-08|84|800000000|3|2000'],
  };
  await page.route('**/api/seoul/shortlist?**', async route => {
    const query = new URL(route.request().url()).searchParams;
    const row = { ...item, signatures: updated ? [...item.signatures, '2026-08|84|790000000|4|2000'] : item.signatures };
    await route.fulfill({ json: {
      status: 'ready', period: '2026-02/2026-08', generatedAt: '2026-09-07T00:00:00Z', since: '2026-06', total: 1, page: 1, pageSize: 24,
      items: [row], saved: query.getAll('saved').includes(item.key) ? [row] : [], missingSavedIds: [],
    } });
  });
  await page.goto('/ko/kr/seoul/shortlist/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('내 예산');
  await page.getByLabel('매매 예산 상한 · 억 원').fill('9');
  await page.getByRole('button', { name: '조건 저장하고 찾기' }).click();
  await page.getByRole('button', { name: '관심 단지 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: /관심 단지 1\/30/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('매매 예산 상한 · 억 원')).toHaveValue('9');
  await expect(page.getByRole('heading', { name: /관심 단지 1\/30/ })).toBeVisible();
  await expect(page.getByText(/^새로 확인된 기록 \d+건$/)).toHaveCount(0);
  updated = true;
  await page.getByRole('button', { name: '거래 변화 확인' }).click();
  await expect(page.getByText('새로 확인된 기록 1건', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '확인 완료', exact: true }).click();
  await expect(page.getByText('새로 확인된 기록 1건', { exact: true })).toHaveCount(0);
  const savedNote = page.locator('section[aria-labelledby="saved-title"] [data-research-note]');
  await savedNote.locator('summary').click();
  await page.waitForLoadState('networkidle');
  const noteRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) noteRequests.push(request.url()); });
  await savedNote.getByRole('textbox').fill('출퇴근 시간에 소음 확인\n주차 공간 문의');
  await savedNote.getByRole('button', { name: '메모 저장', exact: true }).click();
  await expect(savedNote.getByRole('status')).toHaveText('메모를 저장했어요.');
  expect(noteRequests).toEqual([]);
  await page.goto('/ko/saved/');
  const savedPageNote = page.locator('[data-research-note]');
  await savedPageNote.locator('summary').click();
  await expect(savedPageNote.getByRole('textbox')).toHaveValue('출퇴근 시간에 소음 확인\n주차 공간 문의');
  await page.screenshot({ path: testInfo.outputPath('discovery-saved-note.png'), fullPage: true });
  await page.reload();
  await savedPageNote.locator('summary').click();
  await expect(savedPageNote.getByRole('textbox')).toHaveValue('출퇴근 시간에 소음 확인\n주차 공간 문의');
  await savedPageNote.getByRole('button', { name: '메모 삭제', exact: true }).click();
  await expect(savedPageNote.getByRole('textbox')).toHaveValue('');
  await expect(page.getByRole('link', { name: /테스트 아파트/ })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
});
