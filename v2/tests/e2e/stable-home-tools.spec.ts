import {expect,test} from '@playwright/test';
import { visibleLanguageNavigation, visibleProductNavigation } from './site-header-helpers';

test('Chinese market cards align their primary actions on multi-column screens',async({page})=>{
 await page.goto('/zh-cn/kr/seoul/');
 await page.evaluate(()=>document.fonts.ready);
 const positions=await page.locator('[data-contextual-action]').evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect();const a=node.querySelector('[data-primary-action="explore"]')!.getBoundingClientRect();return {top:r.top,action:a.top-r.top};
 }));
 expect(positions).toHaveLength(4);
 if(Math.max(...positions.map(p=>p.top))-Math.min(...positions.map(p=>p.top))<=2)
  expect(Math.max(...positions.map(p=>p.action))-Math.min(...positions.map(p=>p.action))).toBeLessThanOrEqual(2);
});

test('home presents four city destinations and a separate budget journey without overflow', async ({page}) => {
 await page.goto('/');
 await page.evaluate(() => document.fonts.ready);
 await expect(page.locator('main [data-home-region]')).toHaveCount(1);
 await expect(page.getByRole('heading', {level:1})).toHaveCount(1);
 const cards = page.locator('[data-contextual-action]');
 await expect(cards).toHaveCount(4);
 const positions = await cards.evaluateAll(nodes => nodes.map(node => {
  const box = node.getBoundingClientRect();
  const action = node.querySelector('[data-primary-action="explore"]')!.getBoundingClientRect();
  const title = node.querySelector('h2')!;
  return {top:box.top, action:action.top, height:action.height, titleFits:title.scrollWidth <= title.clientWidth};
 }));
 expect(positions.every(p => p.height >= 44 && p.titleFits)).toBe(true);
 if (Math.max(...positions.map(p => p.top)) - Math.min(...positions.map(p => p.top)) <= 2)
  expect(Math.max(...positions.map(p => p.action)) - Math.min(...positions.map(p => p.action))).toBeLessThanOrEqual(2);
 for (const [index, path] of ['/kr/seoul/explore', '/sg/singapore/explore', '/ae/dubai/explore', '/jp/tokyo/explore'].entries())
  await expect(cards.nth(index).locator('[data-primary-action="explore"]')).toHaveAttribute('href', new RegExp('^' + path + '/?$'));
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 await expect(page.locator('main form')).toHaveCount(0);
 await page.getByRole('navigation', {name:'Take a closer look'}).getByRole('link', {name:/^Tools/}).click();
 await expect(page).toHaveURL(/\/tools\/?$/);
 await page.locator('main a[href="/passport/"], main a[href="/passport"]').first().click();
 await page.locator('input[data-amount-name="budget"]').fill('750000');
 await page.getByRole('button', {name:'Update comparison',exact:true}).click();
 await expect(page).toHaveURL(/\/passport\/.*budget=750000/);
 await expect(page.locator('[data-passport-market]')).toHaveCount(3);
});

test('neutral calculator changes currency without carrying the previous purchase amount',async({page})=>{
 await page.goto('/tools/property-scenario/?market=sg-singapore&currency=SGD&price=1000000');
 await expect(page.getByLabel('Purchase price (SGD)',{exact:true})).toHaveValue('1,000,000');
 await page.getByLabel('Market · currency').selectOption('ae-dubai');
 await expect(page.getByLabel('Purchase price (AED)',{exact:true})).toHaveValue('');
 await page.getByLabel('Purchase price (AED)',{exact:true}).fill('1000000');
 await page.getByLabel('Acquisition costs, including taxes and fees (AED)').fill('50000');
 await page.getByLabel('Expected monthly rent (AED)').fill('7000');
 await page.getByLabel('Annual operating costs, including taxes (AED)').fill('12000');
 await page.getByLabel('Expected vacant months per year').fill('1');
 await expect(page.getByText('6.19%',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('all tool languages use the same four primary navigation slots and Corrections has a useful report action',async({page})=>{
 for(const path of ['/tools/','/ko/tools/','/zh-cn/tools/']) {
  await page.goto(path);
  const navigation = await visibleProductNavigation(page);
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('.site-header__product-link')).toHaveCount(4);
  const rankings = navigation.getByRole('link', { name: /^(?:Rankings|지역 비교|地区排名)$/ });
  await expect(rankings).toHaveCount(0);
  await expect((await visibleLanguageNavigation(page)).getByRole('link')).toHaveText(['EN','KO','中文']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.goto('/kr/seoul/corrections/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Corrections');
 await expect(page.getByRole('link',{name:'Report an issue'})).toHaveAttribute('href',/^mailto:contact@signedprice.com/);
});

// Inspect the real tool routes, including empty states at every release viewport.
test('tool screens keep fields and results inside the viewport', async ({page}, testInfo) => {
 for (const [name, path, target] of [
  ['tools', '/tools/', 'main'],
  ['calculator', '/tools/property-scenario/', '[data-property-scenario]'],
  ['seoul-check', '/kr/seoul/check/', '[data-check-section="verdict"]'],
  ['singapore-check', '/sg/singapore/check/', '[data-singapore-check-workspace]'],
  ['dubai-check', '/ae/dubai/check/', '[data-dubai-check-workspace]'],
 ] as const) {
  await page.goto(path);
  await expect(page.locator(target).filter({visible:true}).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name).toBe(true);
  await testInfo.attach(`${name}-${testInfo.project.name}`, {body: await page.screenshot({fullPage:true}), contentType:'image/png'});
 }
});
