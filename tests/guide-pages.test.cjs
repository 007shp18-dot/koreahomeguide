const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const slugs = [
  'wolse-vs-jeonse',
  'korea-rental-contract-checklist',
  'seoul-brokerage-fees',
  'before-you-sign',
  'rent-apartment-korea-foreigner',
  'korea-rental-scams',
  'seoul-officetel-rent',
  'korea-rent-deposit-protection-foreigners'
];

test('guide pairs exist, are substantial, and cross-link via hreflang', () => {
  for (const slug of slugs) {
    const enFile = `guides/${slug}/index.html`;
    const zhFile = `zh/guides/${slug}/index.html`;
    assert.equal(fs.existsSync(enFile), true, enFile);
    assert.equal(fs.existsSync(zhFile), true, zhFile);
    const en = fs.readFileSync(enFile,'utf8');
    const zh = fs.readFileSync(zhFile,'utf8');
    assert.match(en, new RegExp(`hreflang="zh-CN"[^>]+/zh/guides/${slug}/`));
    assert.match(zh, new RegExp(`hreflang="en"[^>]+/guides/${slug}/`));
    assert.ok(en.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length >= 450, `English depth: ${slug}`);
    assert.ok(zh.replace(/<[^>]+>/g,'').replace(/\s+/g,'').length >= 900, `Chinese depth: ${slug}`);
    assert.match(en, /\/tools\//);
    assert.match(zh, /\/zh\/tools\//);
  }
});

test('guide hubs expose every guide and the sitemap lists each localized URL', () => {
  const enHub = fs.readFileSync('guides/index.html','utf8');
  const zhHub = fs.readFileSync('zh/guides/index.html','utf8');
  const sitemap = fs.readFileSync('sitemap-static.xml','utf8');

  for (const slug of slugs) {
    assert.match(enHub, new RegExp(`href="/guides/${slug}/"`), `EN hub: ${slug}`);
    assert.match(zhHub, new RegExp(`href="/zh/guides/${slug}/"`), `ZH hub: ${slug}`);
    assert.match(sitemap, new RegExp(`<loc>https://koreahomeguide\\.com/guides/${slug}/</loc>`), `EN sitemap: ${slug}`);
    assert.match(sitemap, new RegExp(`<loc>https://koreahomeguide\\.com/zh/guides/${slug}/</loc>`), `ZH sitemap: ${slug}`);
  }
});
