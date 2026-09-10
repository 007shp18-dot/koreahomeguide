import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// Automatically include new static public pages; parameterized evidence routes
// are exercised with installed fixtures in their market-specific flow suites.
const app = resolve(process.cwd(), 'apps/web/app');
const routes = readdirSync(app, { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('/page.tsx') && !file.includes('[') && !file.startsWith('(admin)/'))
  .map(file => '/' + file.split('/').filter(part => !part.startsWith('(') && part !== 'page.tsx').join('/') + '/')
  .map(path => path.replace(/\/+/g, '/')).sort();

for (const path of routes) test(`public page census: ${path}`, async ({ page }) => {
  const response = await page.goto(path);
  if (path === '/kr/seoul/sell/') {
    // Explicit retired route: restoring a sale service here would be a regression.
    expect(response?.status()).toBe(404);
    return;
  }
  expect(response?.status(), path).toBeLessThan(400);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path}: viewport overflow`).toBe(true);
});

test('Seoul range context requires an individual size before an automatic cost subtotal', async ({page}) => {
 await page.goto('/tools/property-scenario/?market=kr-seoul&currency=KRW&price=935000000&areaBand=85-plus');
 await expect(page.getByRole('combobox', {name:'Net area', exact:true})).toHaveValue('');
 await expect(page.getByText(/Calculated subtotal:/)).toHaveCount(0);
 await expect(page.getByText(/selected transactions represent a size range/)).toBeVisible();
 await page.getByRole('combobox', {name:'Net area', exact:true}).selectOption('over');
 await expect(page.getByText(/Calculated subtotal:/)).toBeVisible();
 await expect(page.getByLabel('Purchase price (KRW)', {exact:true})).toHaveValue('935,000,000');
});
