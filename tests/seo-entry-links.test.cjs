const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('English and Chinese homepages expose crawlable Dong entry links', () => {
  assert.match(read('index.html'), /class="home-neighborhood-entry"/);
  assert.match(read('index.html'), /href="\/seoul\/gangnam-gu\/yeoksam-dong\/officetel\/"/);
  assert.match(read('zh/index.html'), /class="home-neighborhood-entry"/);
  assert.match(read('zh/index.html'), /href="\/zh\/seoul\/mapo-gu\/yeonnam-dong\/officetel\/"/);
});

test('district hubs retain static Dong links before client data loads', () => {
  const en = read('rent/gangnam-gu/officetel/index.html');
  const zh = read('zh/rent/gangnam-gu/officetel/index.html');
  assert.match(en, /id="neighborhoodLinks"[\s\S]*href="\/seoul\/gangnam-gu\/yeoksam-dong\/officetel\/"/);
  assert.match(zh, /id="neighborhoodLinks"[\s\S]*href="\/zh\/seoul\/gangnam-gu\/yeoksam-dong\/officetel\/"/);
});

test('Explore has a static neighborhood directory in both locales', () => {
  assert.match(read('explore/index.html'), /class="explorer-static-directory"/);
  assert.match(read('explore/index.html'), /href="\/seoul\/yongsan-gu\/itaewon-dong\/officetel\/"/);
  assert.match(read('zh/explore/index.html'), /class="explorer-static-directory"/);
  assert.match(read('zh/explore/index.html'), /href="\/zh\/seoul\/yongsan-gu\/itaewon-dong\/officetel\/"/);
});

test('home Rent Check keeps size assistance in a shared compact row in both locales', () => {
  for (const file of ['index.html', 'zh/index.html']) {
    const html = read(file);
    assert.match(html, /class="rent-check-assist-row"/);
    assert.match(html, /rent-check-size-field"[\s\S]*?<\/label>\s*<div class="rent-check-assist-row"/);
  }
});
