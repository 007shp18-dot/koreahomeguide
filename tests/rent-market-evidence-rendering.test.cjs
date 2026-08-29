const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const explorer = require('../explore/explorer-utils.js');

function runtimeFor(file, locale) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML:'', textContent:'', className:'', value:locale === 'zh' ? 'CNY' : 'KRW',
      disabled:false, dataset:{ lawdCd:'11440', propertyType:'villa' },
      addEventListener() {}
    });
    return elements.get(selector);
  };
  const context = {
    document:{ querySelector:element },
    window:{ KHGExplorer:explorer },
    KHGExplorer:explorer,
    KHGCurrency:{ formatMoneyHtml:value => `<span class="money-primary">MONEY:${value}</span>` },
    KHGDate:{ formatDate:value => value, formatMonth:value => value },
    KHGBuildingNames:{ getBuildingNameDisplay:value => ({ primary:String(value || ''), secondary:'' }) },
    URLSearchParams,
    encodeURIComponent,
    fetch:async () => ({ ok:false, json:async () => ({}) }),
    console
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename:file });
  return { context, sizeBandGrid:element('#sizeBandGrid') };
}

for (const [locale, file, limited] of [
  ['en', 'rent-market-page.js', 'Under 5 contracts'],
  ['zh', 'zh/rent-market-page.js', '少于 5 份合同']
]) {
  test(`${locale} market area cards hide all medians below five observations`, () => {
    const { context, sizeBandGrid } = runtimeFor(file, locale);
    context.renderAreaGroups([{ count:4, approxAreaSqm:25, medianAreaSqm:24.5, medianDepositWon:88_888_888, medianMonthlyRentWon:9_999_999 }]);
    assert.match(sizeBandGrid.innerHTML, new RegExp(limited.replace(' contracts', '').replace('合同', '')));
    assert.match(sizeBandGrid.innerHTML, locale === 'zh' ? /4 份合同/ : /4 contracts/);
    assert.doesNotMatch(sizeBandGrid.innerHTML, /MONEY:9999999|MONEY:88888888|24\.5/);
  });

  test(`${locale} market area cards lead with rent when evidence is sufficient`, () => {
    const { context, sizeBandGrid } = runtimeFor(file, locale);
    context.renderAreaGroups([{ count:5, approxAreaSqm:25, medianAreaSqm:24.5, medianDepositWon:20_000_000, medianMonthlyRentWon:900_000 }]);
    assert.match(sizeBandGrid.innerHTML, /<strong class="market-evidence-rent"><span class="money-primary">MONEY:900000<\/span>/);
    assert.match(sizeBandGrid.innerHTML, /MONEY:20000000/);
    assert.match(sizeBandGrid.innerHTML, /24\.5/);
  });
}
