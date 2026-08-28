const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const en = fs.readFileSync('tools/seoul-rent-check/index.html','utf8');
const zh = fs.readFileSync('zh/tools/seoul-rent-check/index.html','utf8');
const codes = [
  '11680','11440','11170','11200','11560','11620','11230','11410','11290','11215',
  '11110','11140','11260','11305','11320','11350','11380','11470','11500','11530',
  '11545','11590','11650','11710','11740'
];

test('Rent Check exposes all 25 Seoul districts in EN and ZH', () => {
  for (const code of codes) {
    assert.match(en, new RegExp(`value="${code}"`));
    assert.match(zh, new RegExp(`value="${code}"`));
  }
  assert.match(en, /Gwanak-gu/);
  assert.match(en, /Dongdaemun-gu/);
  assert.match(en, /Seodaemun-gu/);
  assert.match(en, /Seongbuk-gu/);
  assert.match(en, /Gwangjin-gu/);
  assert.match(en, /Songpa-gu/);
  assert.match(en, /Jongno-gu/);
  assert.match(zh, /冠岳区/);
  assert.match(zh, /东大门区/);
  assert.match(zh, /西大门区/);
  assert.match(zh, /城北区/);
  assert.match(zh, /广津区/);
  assert.match(zh, /松坡区/);
  assert.match(zh, /钟路区/);
});

test('Rent Check header Guides links go to the guide hubs', () => {
  assert.match(en, /<nav>.*href="\/guides\/">Guides<\/a>/);
  assert.doesNotMatch(en, /<nav>.*href="\/guides\/wolse-vs-jeonse\/">Guides<\/a>/);
  assert.match(zh, /<nav>.*href="\/zh\/guides\/">租房指南<\/a>/);
  assert.doesNotMatch(zh, /<nav>.*href="\/zh\/guides\/wolse-vs-jeonse\/">租房指南<\/a>/);
});

test('Rent Check keeps canonical, hreflang, currency and v11 script wiring intact', () => {
  assert.match(en, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/tools\/seoul-rent-check\/">/);
  assert.match(en, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/tools\/seoul-rent-check\/"/);
  assert.match(zh, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/tools\/seoul-rent-check\/">/);
  assert.match(zh, /hreflang="en" href="https:\/\/koreahomeguide\.com\/tools\/seoul-rent-check\/"/);
  for (const html of [en, zh]) {
    assert.match(html, /id="currencySelect"/);
    assert.match(html, /\/currency-utils\.js/);
    assert.match(html, /rent-check-ui-utils\.js/);
    assert.match(html, /seoul-rent-check\/app\.js/);
    assert.match(html, /value="apartment"/);
    assert.match(html, /value="officetel"/);
    assert.match(html, /value="villa"/);
    assert.match(html, /value="detached"/);
    assert.match(html, /value="studio"/);
  }
});

test('Area selector contains exactly the 25 Rent Check district options', () => {
  for (const html of [en, zh]) {
    const match = html.match(/<select id="rentCheckArea">([\s\S]*?)<\/select>/);
    assert.ok(match);
    const options = [...match[1].matchAll(/<option value="(\d{5})">/g)].map(m => m[1]);
    assert.deepEqual(options, codes);
  }
});
