const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const en = fs.readFileSync('guides/korea-rent-deposit-protection-foreigners/index.html', 'utf8');
const zh = fs.readFileSync('zh/guides/korea-rent-deposit-protection-foreigners/index.html', 'utf8');

test('deposit protection guide distinguishes current HUG and HF foreign-tenant rules', () => {
  assert.match(en, /HUG's current application guidance expressly provides for foreign-registration/);
  assert.match(en, /HF's current Jeonse Keeper Guarantee eligibility checker says every tenant must be a Korean citizen/);
  assert.match(zh, /HUG当前申请资料明确列出外国人登记和国内居所相关文件/);
  assert.match(zh, /HF当前“全租守护保证”资格检查页面写明，全部租客必须是韩国国民/);
});

test('deposit protection guide cites current primary sources and warns against automatic approval', () => {
  for (const html of [en, zh]) {
    assert.match(html, /khug\.or\.kr/);
    assert.match(html, /hf\.go\.kr/);
    assert.match(html, /law\.go\.kr/);
    assert.match(html, /2026/);
    assert.match(html, /article-limit/);
  }
});
