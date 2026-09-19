import {expect,test} from '@playwright/test';
import { visibleLanguageNavigation, visibleProductNavigation } from './site-header-helpers';

test('Chinese market cards align their primary actions on multi-column screens',async({page})=>{
 // Card dimensions are reserved by CSS; measure after DOM and fonts, independently of image completion.
 await page.goto('/zh-cn/', {waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 const positions=await page.locator('[data-home-region="markets"] article').evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect();const a=node.querySelector('[data-primary-action="explore"]')!.getBoundingClientRect();return {top:r.top,action:a.top-r.top};
 }));
 expect(positions).toHaveLength(4);
 if(Math.max(...positions.map(p=>p.top))-Math.min(...positions.map(p=>p.top))<=2)
  expect(Math.max(...positions.map(p=>p.action))-Math.min(...positions.map(p=>p.action))).toBeLessThanOrEqual(2);
});

test('home presents four direct city destinations and search without overflow', async ({page}) => {
 await page.goto('/', {waitUntil:'domcontentloaded'});
 await page.evaluate(() => document.fonts.ready);
 await expect(page.locator('main [data-home-region]')).toHaveCount(2);
 await expect(page.locator('[data-home-region="analysis"] article')).toHaveCount(3);
 await expect(page.getByRole('heading', {level:1})).toHaveCount(1);
 const cards = page.locator('[data-home-region="markets"] article');
 await expect(cards).toHaveCount(4);
 const positions = await cards.evaluateAll(nodes => nodes.map(node => {
  const box = node.getBoundingClientRect();
  const action = node.querySelector('[data-primary-action="explore"]')!.getBoundingClientRect();
  const title = node.querySelector('h3')!;
  return {top:box.top, action:action.top, height:action.height, titleFits:title.scrollWidth <= title.clientWidth};
 }));
 expect(positions.every(p => p.height >= 44 && p.titleFits)).toBe(true);
 if (Math.max(...positions.map(p => p.top)) - Math.min(...positions.map(p => p.top)) <= 2)
  expect(Math.max(...positions.map(p => p.action)) - Math.min(...positions.map(p => p.action))).toBeLessThanOrEqual(2);
 for (const [index, path] of ['/kr/seoul/explore', '/sg/singapore/explore', '/ae/dubai/explore', '/jp/tokyo/explore'].entries())
  await expect(cards.nth(index).locator('[data-primary-action="explore"]')).toHaveAttribute('href', new RegExp('^' + path + '/?$'));
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 await expect(page.getByRole('search').getByRole('combobox')).toHaveValue('seoul');
 await expect(page.getByRole('search').getByRole('searchbox')).toBeVisible();
 await page.locator('main aside').getByRole('link', {name:'Tools', exact:true}).click();
 await expect(page).toHaveURL(/\/tools\/?$/);
 await page.locator('main a[href="/passport/"], main a[href="/passport"]').first().click();
 await page.locator('input[data-amount-name="budget"]').fill('750000');
 await page.getByRole('button', {name:'Update comparison',exact:true}).click();
 await expect(page).toHaveURL(/\/passport\/.*budget=750000/);
 await expect(page.locator('[data-passport-market]')).toHaveCount(4);
});

for (const [locale, prefix, marketLabel, valuesLabel, names] of [
 ['en', '', 'Choose market', 'View values', ['Seoul', 'Singapore', 'Dubai']],
 ['ko', '/ko', '시장 선택', '수치 보기', ['서울', '싱가포르', '두바이']],
 ['zh-CN', '/zh-cn', '选择市场', '查看数值', ['首尔', '新加坡', '迪拜']],
] as const) {
 test(`${locale} report pulse switches the selected cohort, accessible values and source together`, async ({page}) => {
  await page.goto(`${prefix}/`);
  const choices = page.getByRole('group', {name:marketLabel, exact:true});
  const pulse = page.locator('section').filter({has:choices});
  await expect(choices.getByRole('button')).toHaveCount(3);
  for (const [index, [city, firstValue, lastValue]] of ([['seoul', '5,626', '5,321'], ['singapore', '594', '630'], ['dubai', '8,100', '7,142']] as const).entries()) {
   const choice = choices.getByRole('button', {name:names[index]!, exact:true});
   await choice.focus();
   await page.keyboard.press('Enter');
   await expect(choice).toHaveAttribute('aria-pressed', 'true');
   await expect(choices.locator('[aria-pressed="true"]')).toHaveCount(1);
   await expect(pulse.getByRole('img')).toHaveAccessibleName(new RegExp(names[index]!));
   await expect(pulse.locator(`a[href="${prefix}/news/${city}-monthly-2026-09/"]`)).toBeVisible();
   const disclosure = pulse.locator('details');
   if (!await disclosure.evaluate(node => (node as HTMLDetailsElement).open)) await disclosure.getByText(valuesLabel, {exact:true}).click();
   const table = pulse.getByRole('table');
   await expect(table).toBeVisible();
   await expect(table.locator('tbody tr')).toHaveCount(6);
   await expect(table.locator('tbody td').first()).toHaveText(firstValue);
   await expect(table.locator('tbody td').last()).toHaveText(lastValue);
   await expect(table.locator('caption')).toContainText(names[index]!);
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await expect(pulse.locator(`a[href="${prefix}/jp/tokyo/explore/"]`)).toBeVisible();
 });
}

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

test('tool languages retain their published primary navigation and Corrections has a useful report action',async({page})=>{
 for(const path of ['/tools/','/ko/tools/','/zh-cn/tools/']) {
  await page.goto(path);
  const navigation = await visibleProductNavigation(page);
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('.site-header__product-link')).toHaveCount(7);
  const rankings = navigation.getByRole('link', { name: /^(?:Rankings|랭킹|排行榜)$/ });
  await expect(rankings).toHaveCount(1);
  await expect((await visibleLanguageNavigation(page)).getByRole('link')).toHaveText(['EN','KO','中文']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.goto('/kr/seoul/corrections/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Seoul data corrections');
 await expect(page.getByRole('link',{name:'Report a data issue'})).toHaveAttribute('href',/^mailto:contact@signedprice.com/);
});

// Inspect the real tool routes, including empty states at every release viewport.
test('tool screens keep fields and results inside the viewport', async ({page}, testInfo) => {
 test.setTimeout(90_000);
 for (const [name, path, target] of [
  ['tools', '/tools/', 'main'],
  ['calculator', '/tools/property-scenario/', '[data-property-scenario]'],
  ['seoul-check', '/kr/seoul/check/', '[data-check-section="verdict"]'],
  ['singapore-check', '/sg/singapore/check/', '[data-singapore-check-workspace]'],
  ['dubai-check', '/ae/dubai/check/', '[data-dubai-check-workspace]'],
  ['tokyo-check', '/jp/tokyo/tools/', 'form[action="/jp/tokyo/tools/"]'],
  ['tokyo-check-ko', '/ko/jp/tokyo/tools/', 'form[action="/ko/jp/tokyo/tools/"]'],
  ['tokyo-check-zh', '/zh-cn/jp/tokyo/tools/', 'form[action="/zh-cn/jp/tokyo/tools/"]'],
  ['saved-zh', '/zh-cn/saved/', 'main'],
 ] as const) {
  await page.goto(path);
  await expect(page.locator(target).filter({visible:true}).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name).toBe(true);
  await testInfo.attach(`${name}-${testInfo.project.name}`, {body: await page.screenshot({fullPage:true}), contentType:'image/png'});
 }
});
