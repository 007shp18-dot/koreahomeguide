const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function page(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

const en = () => page('index.html');
const zh = () => page('zh/index.html');

test('EN homepage preserves canonical, hreflang, H1, and Rent Check hooks', () => {
  const html = en();
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/"\s*\/?>/);
  assert.match(html, /hreflang="en" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /<h1>Know the real price before you sign\.<\/h1>/);
  assert.match(html, /id="rentCheckForm"/);
  assert.match(html, /id="rentCheckResult"/);
});

test('ZH homepage preserves canonical, hreflang, and Rent Check hooks', () => {
  const html = zh();
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/"\s*\/?>/);
  assert.match(html, /hreflang="en" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /id="rentCheckForm"/);
  assert.match(html, /id="rentCheckResult"/);
});

test('EN homepage exposes all four move-journey stages', () => {
  const html = en();
  for (const stage of ['check', 'prepare', 'move', 'settle']) {
    assert.match(html, new RegExp(`data-move-stage="${stage}"`));
  }
  assert.match(html, /Your move to Seoul, step by step/);
  assert.match(html, /Moving to Seoul/);
});

test('ZH homepage exposes equivalent four move-journey stages', () => {
  const html = zh();
  for (const stage of ['check', 'prepare', 'move', 'settle']) {
    assert.match(html, new RegExp(`data-move-stage="${stage}"`));
  }
  assert.match(html, /搬到首尔/);
});

test('both homepages expose all six phase-1 service categories', () => {
  for (const html of [en(), zh()]) {
    for (const service of ['internet', 'sim_esim', 'moving', 'cleaning', 'insurance', 'relocation']) {
      assert.match(html, new RegExp(`data-move-service="${service}"`));
    }
  }
});

test('service cards avoid unverified brokerage and partner claims', () => {
  for (const html of [en(), zh()]) {
    assert.doesNotMatch(html, /We find you an apartment/i);
    assert.doesNotMatch(html, /Book this property/i);
    assert.doesNotMatch(html, /Guaranteed best rent/i);
    assert.doesNotMatch(html, /Our licensed broker/i);
    assert.doesNotMatch(html, /official partner/i);
  }
});

test('both homepages wire isolated v12 CSS and JS', () => {
  assert.match(en(), /<link rel="stylesheet" href="\/move-commerce\.css"\s*\/?>/);
  assert.match(zh(), /<link rel="stylesheet" href="\/move-commerce\.css"\s*\/?>/);
  assert.match(en(), /<script src="\/move-commerce\.js"><\/script>/);
  assert.match(zh(), /<script src="\/move-commerce\.js"><\/script>/);
});

test('existing primary navigation remains available in EN and ZH', () => {
  assert.match(en(), /href="\/explore\/">Explore<\/a>/);
  assert.match(en(), /href="\/tools\/seoul-rent-check\/">Rent Check<\/a>/);
  assert.match(en(), /href="\/guides\/">Guides<\/a>/);

  assert.match(zh(), /href="\/zh\/explore\/">租金探索<\/a>/);
  assert.match(zh(), /href="\/zh\/tools\/seoul-rent-check\/">租金检查<\/a>/);
  assert.match(zh(), /href="\/zh\/guides\/">租房指南<\/a>/);
});

test('isolated v12 stylesheet supports move sections and responsive grids', () => {
  const css = page('move-commerce.css');
  for (const selector of [
    '.hero-actions',
    '.move-journey-section',
    '.move-journey-grid',
    '.move-stage-card',
    '.move-services-section',
    '.move-services-grid',
    '.move-service-card',
    '.coming-soon-pill'
  ]) {
    assert.ok(css.includes(selector), `missing ${selector}`);
  }
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
});

test('commerce metadata is explicit and anonymous on both homepages', () => {
  assert.match(en(), /<body data-commerce-city="seoul" data-commerce-language="en">/);
  assert.match(zh(), /<body data-commerce-city="seoul" data-commerce-language="zh">/);
  for (const html of [en(), zh()]) {
    const services = [...html.matchAll(/data-move-service="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(services.sort(), ['cleaning', 'insurance', 'internet', 'moving', 'relocation', 'sim_esim']);
    const stages = [...html.matchAll(/data-move-stage="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(stages.sort(), ['check', 'move', 'prepare', 'settle']);
  }
});
