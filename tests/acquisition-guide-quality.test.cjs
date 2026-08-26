'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const GUIDES = [
  'wolse-vs-jeonse',
  'korea-rental-contract-checklist',
  'seoul-brokerage-fees',
  'before-you-sign',
  'rent-apartment-korea-foreigner',
  'korea-rental-scams',
  'seoul-officetel-rent'
];

test('all deep guides expose the approved answer-to-Rent-Check contract', () => {
  for (const slug of GUIDES) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    assert.match(html, /data-search-answer="true"/, slug);
    assert.match(html, /class="[^"]*article-method[^"]*"/, slug);
    assert.match(html, /class="[^"]*article-limit[^"]*"/, slug);
    assert.match(html, /class="[^"]*article-primary-cta[^"]*"[\s\S]*?href="\/tools\/seoul-rent-check\/"/, slug);
    assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, slug);
  }
});

test('each guide has one dormant ad mount after substantive content', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.ad-slot\s*\{[^}]*display:\s*none!important/i);
  for (const slug of GUIDES) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    const mounts = html.match(/<div class="ad-slot" data-slot="guide" aria-hidden="true"><\/div>/g) || [];
    assert.equal(mounts.length, 1, slug);
    assert.ok(html.indexOf(mounts[0]) > html.indexOf('<h2'), slug);
  }
});

test('product and market surfaces remain free of ad mounts and AdSense scripts', () => {
  const productFiles = [
    'index.html', 'tools/seoul-rent-check/index.html', 'explore/index.html',
    'tools/brokerage-fee-calculator/index.html',
    'rent/gangnam-gu/apartment/index.html', 'rent/mapo-gu/officetel/index.html',
    'rent/yongsan-gu/villa/index.html'
  ];
  for (const file of productFiles) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /data-slot="guide"|adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});

function collectHtml(dir = '.') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return collectHtml(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  });
}

test('no public HTML loads an active AdSense script', () => {
  for (const file of collectHtml()) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});
