const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { calculateBrokerageFee } = require('../brokerage-utils.js');
const { SEOUL_DISTRICTS, SEOUL_DISTRICT_SLUGS } = require('../providers/seoul-config.cjs');
const locations = require('../location-catalog.js');

function read(path){ return fs.readFileSync(path,'utf8'); }
function text(html){ return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim(); }

const newDistricts = {
  '11620':'Gwanak-gu',
  '11230':'Dongdaemun-gu',
  '11410':'Seodaemun-gu',
  '11290':'Seongbuk-gu',
  '11215':'Gwangjin-gu'
};

const zhDistrictLabels = {
  '11620':'冠岳区',
  '11230':'东大门区',
  '11410':'西大门区',
  '11290':'城北区',
  '11215':'广津区'
};

test('before-you-sign pillar guide exists in EN/ZH with substantive foreign-renter protection content', () => {
  const enPath = 'guides/before-you-sign/index.html';
  const zhPath = 'zh/guides/before-you-sign/index.html';
  assert.equal(fs.existsSync(enPath), true, enPath);
  assert.equal(fs.existsSync(zhPath), true, zhPath);
  const en = read(enPath);
  const zh = read(zhPath);
  assert.match(en, /hreflang="zh-CN"[^>]+\/zh\/guides\/before-you-sign\//);
  assert.match(zh, /hreflang="en"[^>]+\/guides\/before-you-sign\//);
  assert.ok(text(en).split(/\s+/).length >= 1000, 'English pillar guide should be at least 1000 words');
  assert.ok(text(zh).replace(/\s+/g,'').length >= 1800, 'Chinese pillar guide should be substantial');
  assert.match(en, /property registry|registry extract|등기/i);
  assert.match(en, /registered owner|landlord/i);
  assert.match(en, /foreign registration|residence.*report|change of residence/i);
  assert.match(en, /fixed date|confirmed date|확정일자/i);
  assert.match(en, /deposit guarantee|HUG/i);
  assert.match(en, /law\.go\.kr/);
  assert.match(en, /khug\.or\.kr/);
  assert.match(en, /immigration\.go\.kr|gov\.kr/);
  assert.match(en, /not legal advice|general information/i);
});

test('homepage before-you-sign guide card points to the pillar page in both locales', () => {
  const en = read('index.html');
  const zh = read('zh/index.html');
  assert.match(en, /class="funnel-guide" href="\/guides\/before-you-sign\/"[\s\S]{0,400}<h3>Before you sign<\/h3>/);
  assert.match(zh, /class="funnel-guide" href="\/zh\/guides\/before-you-sign\/"[\s\S]{0,400}<h3>签约前/);
});

test('homepage positioning is a Rent Check trust funnel rather than a listings promise', () => {
  const en = read('index.html');
  const zh = read('zh/index.html');
  assert.match(en, /<title>Seoul Rent Prices & Brokerage Fees, Explained in English \| KoreaHomeGuide<\/title>/);
  assert.match(en, /<h1>Is your Seoul rent actually fair\?<\/h1>/);
  assert.match(en, />Check my rent</);
  assert.match(en, /Official signed transactions/);
  assert.doesNotMatch(en, /Find a home in Seoul/i);
  assert.doesNotMatch(en, /<span class="eyebrow">Find a home<\/span>/i);
  assert.match(zh, /你的首尔租金报价真的合理吗？/);
  assert.match(zh, /检查我的租金/);
  assert.doesNotMatch(zh, /找到适合你的家|<span class="eyebrow">找房<\/span>/);
});

test('common Seoul studio rental brokerage example stays capped at KRW 300,000', () => {
  const fee = calculateBrokerageFee({ propertyType:'housing', depositWon:10_000_000, monthlyRentWon:800_000 });
  assert.equal(fee.transactionValueWon, 90_000_000);
  assert.equal(fee.maxRate, 0.004);
  assert.equal(fee.capWon, 300_000);
  assert.equal(fee.maxFeeWon, 300_000);
});

test('five student-heavy districts are supported by provider config and EN/ZH Rent Check plus Explorer controls', () => {
  const enHome = read('index.html');
  const enExplore = read('explore/index.html');
  const zhHome = read('zh/index.html');
  const zhExplore = read('zh/explore/index.html');
  for (const [code, name] of Object.entries(newDistricts)) {
    assert.equal(SEOUL_DISTRICTS[code], name, `${code} config`);
    const slug = name.toLowerCase();
    assert.equal(SEOUL_DISTRICT_SLUGS[slug], code, `${slug} slug`);
    assert.ok(enHome.includes(`<option value="${code}">${locations.districtLabel(code, 'en')}</option>`));
    assert.ok(enExplore.includes(`<option value="${code}">${locations.districtLabel(code, 'en')}</option>`));
    assert.ok(zhHome.includes(`<option value="${code}">${locations.districtLabel(code, 'zh-CN')}</option>`));
    assert.ok(zhExplore.includes(`<option value="${code}">${locations.districtLabel(code, 'zh-CN')}</option>`));
  }
});

test('sitemap includes the EN/ZH before-you-sign pillar guide', () => {
  const sitemap = read('sitemap-static.xml');
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/guides\/before-you-sign\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/guides\/before-you-sign\//);
});
