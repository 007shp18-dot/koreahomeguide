import {expect,test} from '@playwright/test';

test('home city changes keep the panel, metric and Explore action in the same position',async({page})=>{
 await page.goto('/');
 const hero=page.locator('[data-home-region="hero"]');
 await hero.hover();
 await page.evaluate(()=>document.fonts.ready);
 const states=[];
 for(const city of ['Seoul','Singapore','Dubai']) {
  await hero.getByRole('tab',{name:new RegExp(city)}).click();
  const panel=hero.getByRole('tabpanel');
  await expect(panel.getByRole('link',{name:'Explore',exact:true})).toBeVisible();
  states.push(await panel.evaluate(node=>{
   const metric=node.querySelector('[data-evidence-state]')!;const action=node.querySelector('[data-primary-action]')!;
   return {height:node.getBoundingClientRect().height,metric:metric.getBoundingClientRect().top-node.getBoundingClientRect().top,action:action.getBoundingClientRect().top-node.getBoundingClientRect().top};
  }));
 }
 for(const key of ['height','metric','action'] as const) expect(Math.max(...states.map(s=>s[key]))-Math.min(...states.map(s=>s[key]))).toBeLessThanOrEqual(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('neutral calculator changes currency without carrying the previous purchase amount',async({page})=>{
 await page.goto('/tools/property-scenario/?market=sg-singapore&currency=SGD&price=1000000');
 await expect(page.getByLabel('Purchase price (SGD)',{exact:true})).toHaveValue('1000000');
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

test('all tool languages use the same five navigation slots and Corrections has a useful report action',async({page})=>{
 for(const path of ['/tools/','/ko/tools/','/zh-cn/tools/']) {
  await page.goto(path);await expect(page.locator('.site-header__product-link')).toHaveCount(5);
  await expect(page.locator('.site-header__language')).toHaveText(['EN','KO','中文']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.goto('/kr/seoul/corrections/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Corrections');
 await expect(page.getByRole('link',{name:'Report an issue'})).toHaveAttribute('href',/^mailto:contact@signedprice.com/);
});
