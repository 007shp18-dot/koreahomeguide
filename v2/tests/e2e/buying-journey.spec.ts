import { expect, test } from '@playwright/test';

for (const [locale, path] of [['en', '/'], ['ko', '/ko/'], ['zh-CN', '/zh-cn/']] as const) {
  test(`${locale} starts with four equal cities and changes budgets without crossing currencies`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.locator('[data-buying-city]')).toHaveCount(4);
    await expect(page.locator('[data-buying-city][aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('[data-buying-results]')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.screenshot({ fullPage: true });
    await testInfo.attach(`home-${locale}`, { body: initial, contentType: 'image/png' });
    for (const [city, currency, count] of [['seoul', 'KRW', 3], ['singapore', 'SGD', 3], ['dubai', 'AED', 3], ['tokyo', 'JPY', 5]] as const) {
      const cityButton = page.locator(`[data-buying-city="${city}"]`);
      await cityButton.focus();
      await page.keyboard.press('Enter');
      await expect(cityButton).toHaveAttribute('aria-pressed', 'true');
      const result = page.locator(`[data-buying-results="${city}"]`);
      await expect(result).toBeVisible();
      const budgetButtons = result.getByRole('group').getByRole('button');
      await expect(budgetButtons).toHaveCount(3);
      await expect(budgetButtons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await budgetButtons.first().click();
      await expect(budgetButtons.first()).toHaveAttribute('aria-pressed', 'true');
      const examples = result.locator('[data-example-scope] article');
      await expect(examples).toHaveCount(count);
      await expect(result.locator('a[href*="property-scenario"]')).toHaveAttribute('href', new RegExp(`currency=${currency}`));
      const dimensions = await budgetButtons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(dimensions.every(height => height >= 44)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (city === 'dubai' || city === 'tokyo') await testInfo.attach(`${city}-${locale}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
    // Returning to a previous city resets to that city's middle budget, not the last amount.
    await page.locator('[data-buying-city="seoul"]').click();
    await expect(page.locator('[data-buying-results="seoul"]').getByRole('group').getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  });
}
for (const locale of ['en', 'ko'] as const) {
  test(`${locale} budget selection reaches the matching interactive guide`, async ({ page }) => {
    test.setTimeout(90000);
    for (const city of ['seoul', 'singapore', 'dubai']) {
      await page.goto(locale === 'en' ? '/' : '/ko/');
      await page.locator(`[data-buying-city="${city}"]`).click();
      const result = page.locator(`[data-buying-results="${city}"]`);
      await result.getByRole('group').getByRole('button').first().click();
      await result.locator('a[href*="?budget="]').first().click();
      await expect(page).toHaveURL(new RegExp(`${locale === 'en' ? '' : '/ko'}/guides/.*budget=\\d+#buying-examples`));
      const group = page.getByRole('group', { name: locale === 'en' ? 'Purchase-price ceiling' : '매매가격 예산 상한' });
      await expect(group.getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
      await page.reload();
      await expect(group.getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
test('without JavaScript every city still offers a guide and an explorer', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const markets = page.locator('[data-home-region="markets"] li');
    await expect(markets).toHaveCount(4);
    for (const card of await markets.all()) {
      await expect(card.locator('a[href*="/guides/"]')).toHaveCount(1);
      await expect(card.locator('a[href*="/explore"]')).toHaveCount(1);
    }
  } finally { await context.close(); }
});

for (const [locale,prefix] of [['en',''],['ko','/ko'],['zh-CN','/zh-cn']] as const) {
 test(`${locale} receives a purchase enquiry only after a successful response`,async({page})=>{
  const requests: Record<string, unknown>[] = [];
  await page.route('**/api/purchase-enquiries/',async route=>{
   const body=route.request().postDataJSON(); requests.push(body);
   await route.fulfill({status:requests.length===1?503:201,contentType:'application/json',body:JSON.stringify(requests.length===1?{error:'unavailable'}:{state:'received',reference:body.requestId})});
  });
  await page.goto(`${prefix}/contact/?city=tokyo&budget=50000000`,{waitUntil:'domcontentloaded'});
  const enquiry=page.locator('#purchase-enquiry');
  const selects=enquiry.getByRole('combobox');
  await expect(selects.nth(0)).toHaveValue('tokyo');
  await expect(enquiry.locator('input[type="number"]')).toHaveValue('50000000');
  await selects.nth(0).selectOption('dubai');
  await expect(enquiry.locator('input[type="number"]')).toHaveValue('');
  await selects.nth(1).selectOption('own-use');
  await selects.nth(2).selectOption('soon');
  await enquiry.locator('input[type="email"]').fill('buyer@example.com');
  await enquiry.locator('textarea').fill('Compare two homes & check costs');
  await enquiry.getByRole('button').click();
  expect(requests).toHaveLength(0);
  await enquiry.getByRole('checkbox').check();
  const bounds=await enquiry.locator('select,input[type="number"],input[type="email"]').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));
  expect(bounds.every(height=>height===48)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await test.info().attach(`purchase-enquiry-${locale}`,{body:await page.screenshot(),contentType:'image/png'});
  await enquiry.getByRole('button').click();
  await expect(enquiry.getByRole('alert')).toBeVisible();
  await expect(enquiry.locator('textarea')).toHaveValue('Compare two homes & check costs');
  await enquiry.getByRole('button').click();
  await expect(enquiry.getByRole('status')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]?.requestId).toBe(requests[1]?.requestId);
  expect(requests[1]).toMatchObject({city:'dubai',budget:'',locale,consent:true,email:'buyer@example.com'});
  await expect(enquiry.locator('form')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 });
}
