const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('officetel guides calculate all-in monthly housing cost in both locales', () => {
  const en = fs.readFileSync('guides/seoul-officetel-rent/index.html', 'utf8');
  const zh = fs.readFileSync('zh/guides/seoul-officetel-rent/index.html', 'utf8');

  assert.match(en, /monthly rent \+ fixed management fee \+ average separately billed utilities \+ internet \+ parking/);
  assert.match(en, /about KRW 1,160,000 per month/);
  assert.match(zh, /月租＋固定管理费＋另付水电燃气的近期平均值＋网络＋停车/);
  assert.match(zh, /每月实际支出约116万韩元/);
  assert.match(en, /korea-rent-deposit-protection-foreigners/);
  assert.match(zh, /korea-rent-deposit-protection-foreigners/);
});
