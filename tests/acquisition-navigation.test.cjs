const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

const guideSlugs = [
  'wolse-vs-jeonse',
  'korea-rental-contract-checklist',
  'seoul-brokerage-fees',
  'before-you-sign',
  'rent-apartment-korea-foreigner',
  'korea-rental-scams',
  'seoul-officetel-rent',
  'korea-rent-deposit-protection-foreigners'
];

test('every English entry page sends its header Guides action to the hub', () => {
  for (const item of ENTRY_PAGES) {
    const html = fs.readFileSync(item.file, 'utf8');
    const header = (html.match(/<header[\s\S]*?<\/header>/) || [])[0] || '';
    assert.match(header, /href="\/guides\/"[^>]*>Guides<\/a>/, item.file);
  }
});

test('every guide article links at least two sibling guides', () => {
  for (const slug of guideSlugs) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    const siblings = guideSlugs.filter(
      other => other !== slug && html.includes(`/guides/${other}/`)
    );
    assert.ok(siblings.length >= 2, `${slug}: ${siblings.join(', ')}`);
  }
});
