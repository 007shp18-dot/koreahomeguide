import { expect, test } from '@playwright/test';

const cityDestinations = [
  ['seoul', 'kr/seoul', 'KRW'], ['singapore', 'sg/singapore', 'SGD'],
  ['dubai', 'ae/dubai', 'AED'], ['tokyo', 'jp/tokyo', 'JPY'],
] as const;

for (const [locale, prefix] of [['en', ''], ['ko', '/ko'], ['zh-CN', '/zh-cn']] as const) {
  test(`${locale} offers direct city destinations and submits search in the selected city`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.goto(`${prefix}/`);
    const cards = page.locator('[data-home-region="markets"] article');
    await expect(cards).toHaveCount(4);
    for (const [index, [city, path, currency]] of cityDestinations.entries()) {
      await expect(cards.nth(index).locator(`[data-city-destination="${city}"]`)).toHaveAttribute('href', `${prefix}/${path}/explore/`);
      await expect(cards.nth(index)).toContainText(currency);
      await expect(cards.nth(index).locator('a[href*="/guides/"]')).toHaveCount(1);
    }
    await testInfo.attach(`home-${locale}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    for (const [city, path] of cityDestinations) {
      await page.goto(`${prefix}/`);
      const search = page.getByRole('search');
      await search.getByRole('searchbox').fill('Previous city query');
      await search.getByRole('combobox').selectOption(city === 'seoul' ? 'dubai' : city);
      if (city === 'seoul') await search.getByRole('combobox').selectOption('seoul');
      await expect(search.getByRole('searchbox')).toHaveValue('');
      await search.getByRole('searchbox').fill('Park');
      await search.getByRole('button').click();
      await expect(page).toHaveURL(url => url.pathname === `${prefix}/${path}/explore/` && url.searchParams.get('q') === 'Park');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}

for (const locale of ['en', 'ko'] as const) {
  test(`${locale} city guide links retain interactive budgets, native currencies and budget deep links`, async ({ page }) => {
    test.setTimeout(90_000);
    const prefix = locale === 'en' ? '' : '/ko';
    for (const [city, currency, firstBudget] of [['seoul', 'KRW', 600000000], ['singapore', 'SGD', 1000000], ['dubai', 'AED', 750000]] as const) {
      await page.goto(`${prefix}/`);
      const card = page.locator('[data-home-region="markets"] article').filter({ has: page.locator(`[data-city-destination="${city}"]`) });
      await expect(card).toContainText(currency);
      await card.locator('a[href*="/guides/"]').click();
      await expect(page).toHaveURL(new RegExp(`${prefix}/guides/${city}-.*buying-budget-guide/`));
      const group = page.getByRole('group', { name: locale === 'en' ? 'Purchase-price ceiling' : '매매가격 예산 상한' });
      const buttons = group.getByRole('button');
      await expect(buttons).toHaveCount(3);
      await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      const initialPrice = await page.locator('section[aria-labelledby="buying-costs"] dd').first().innerText();
      await buttons.first().click();
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'false');
      const budgetLabel = await buttons.first().innerText();
      await expect(page.locator('section[aria-labelledby="buying-costs"] dd').first()).toHaveText(budgetLabel);
      expect(budgetLabel).not.toBe(initialPrice);
      expect(budgetLabel).toMatch(currency === 'KRW' && locale === 'ko' ? /억/ : currency === 'SGD' ? /S\$/ : new RegExp(currency));
      await expect(page.locator('section[aria-labelledby="buying-examples"] details')).toHaveCount(3);
      const heights = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(heights.every(height => height >= 44)).toBe(true);
      const shared = new URL(page.url());
      shared.searchParams.set('budget', String(firstBudget));
      shared.hash = 'buying-examples';
      await page.goto(shared.href);
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      await page.reload();
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
test('without JavaScript every city still offers a guide and an explorer', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const markets = page.locator('[data-home-region="markets"] article');
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
