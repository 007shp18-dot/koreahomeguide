'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const PAGES = [
  ['rent/gangnam-gu/apartment/index.html', '11680', 'apartment'],
  ['rent/mapo-gu/officetel/index.html', '11440', 'officetel'],
  ['rent/yongsan-gu/villa/index.html', '11170', 'villa']
];

test('representative market pages expose answer, evidence, limitation, CTA and FAQ', () => {
  for (const [file, lawdCd, type] of PAGES) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`data-lawd-cd="${lawdCd}"[^>]*data-property-type="${type}"`), file);
    assert.match(html, /data-search-answer="true"/, file);
    assert.match(html, /class="[^"]*market-method[^"]*"/, file);
    assert.match(html, /class="[^"]*market-limit[^"]*"/, file);
    assert.match(html, /class="[^"]*market-rent-check-cta[^"]*"[\s\S]*?href="\/tools\/seoul-rent-check\/"/, file);
    assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, file);
    assert.ok((html.match(/href="\/tools\/seoul-rent-check\/"/g) || []).length >= 2, file);
    assert.doesNotMatch(html, /data-slot="guide"|adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});

test('representative market pages keep the existing dynamic renderer', () => {
  for (const [file] of PAGES) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="marketStatus"/, file);
    assert.match(html, /id="depositBandGrid"/, file);
    assert.match(html, /id="sizeBandGrid"/, file);
    assert.match(html, /id="recentContractsBody"/, file);
    assert.match(html, /<script src="\/rent-market-page\.js"><\/script>/, file);
  }
});
