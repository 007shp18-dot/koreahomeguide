const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('cold-start.css', 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (css.match(new RegExp(`${escaped}\\{([^}]*)\\}`)) || [])[1] || '';
}

function firstPixels(value) {
  const match = String(value || '').match(/(-?\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : NaN;
}

test('homepage keeps the desktop path to Rent Check compact', () => {
  const hero = rule('.funnel-hero');
  const trust = rule('.funnel-trust');
  const heroPadding = (hero.match(/padding:([^;]+)/) || [])[1];
  const trustMargin = (trust.match(/margin:0 auto (\d+)px/) || [])[1];

  assert.ok(firstPixels(heroPadding) <= 60, `desktop hero top padding is ${firstPixels(heroPadding)}px`);
  assert.ok(Number(trustMargin) <= 20, `trust strip bottom margin is ${trustMargin}px`);
});

test('homepage keeps the mobile path to Rent Check compact', () => {
  const heroTop = (css.match(/@media\(max-width:760px\)\{\.funnel-hero\{[^}]*padding-top:(\d+)px/) || [])[1];
  assert.ok(Number(heroTop) <= 40, `mobile hero top padding is ${heroTop}px`);
});
