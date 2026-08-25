const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function page(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}
const en=()=>page('index.html'); const zh=()=>page('zh/index.html');

test('EN homepage preserves canonical, hreflang, Rent Check hooks, and the cold-start H1', () => {
  const html=en();
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /hreflang="en" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /<h1>Is your Seoul rent actually fair\?<\/h1>/);
  assert.match(html, /id="rentCheckForm"/);
  assert.match(html, /id="rentCheckResult"/);
});

test('ZH homepage preserves canonical, hreflang, and Rent Check hooks', () => {
  const html=zh();
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /hreflang="en" href="https:\/\/koreahomeguide\.com\/"/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/"/);
  assert.match(html, /id="rentCheckForm"/);
  assert.match(html, /id="rentCheckResult"/);
});

test('cold-start home deliberately demotes v12 move-journey and service cards', () => {
  for (const html of [en(),zh()]) {
    assert.doesNotMatch(html, /data-move-stage=/);
    assert.doesNotMatch(html, /data-move-service=/);
    assert.doesNotMatch(html, /Coming soon/);
    assert.doesNotMatch(html, /move-commerce\.css/);
    assert.doesNotMatch(html, /move-commerce\.js/);
    assert.match(html, /data-lead-capture/);
  }
});

test('existing primary navigation remains available in EN and ZH', () => {
  assert.match(en(), /href="\/explore\/">Explore<\/a>/);
  assert.match(en(), /href="\/tools\/seoul-rent-check\/">Rent Check<\/a>/);
  assert.match(en(), /href="\/guides\/">Guides<\/a>/);
  assert.match(zh(), /href="\/zh\/explore\/">租金探索<\/a>/);
  assert.match(zh(), /href="\/zh\/tools\/seoul-rent-check\/">租金检查<\/a>/);
  assert.match(zh(), /href="\/zh\/guides\/">租房指南<\/a>/);
});
