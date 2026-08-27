const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('confidence explanation names the actual matched sample and tier boundaries', () => {
  assert.equal(enUI.confidenceLabel('high'), 'Strong sample');
  assert.equal(enUI.confidenceLabel('medium'), 'Moderate sample');
  assert.equal(enUI.confidenceLabel('low'), 'Limited sample');
  assert.equal(zhUI.confidenceLabel('high'), '样本充分');
  assert.equal(
    enUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:72 }),
    'Strong sample: 72 contracts matched the same district and the same official property category within ±15% size and ±25% deposit across the latest 3 completed months.'
  );
  assert.equal(
    enUI.confidenceExplanation({ confidence:'medium', tier:2, comparableCount:5 }),
    'Moderate sample: 5 contracts matched the same district and the same official property category within ±20% size and ±35% deposit across the latest 6 completed months.'
  );
  assert.equal(
    zhUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:72 }),
    '样本充分：最近 3 个完整月份内，有 72 笔同一区、同一官方房屋分类的成交符合面积 ±15% 和押金 ±25% 的范围。'
  );
  assert.equal(enUI.confidenceExplanation({ rating:'insufficient', tier:null }), '');
  assert.match(
    enUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:9 }, true),
    /official detached\/multi-unit category used as the studio fallback/
  );
  assert.match(
    zhUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:9 }, true),
    /单间回退使用的官方独栋及多户住宅分类/
  );
});

test('sample-strength prompt names the actual level instead of the price verdict', () => {
  assert.equal(enUI.confidenceQuestion({ confidence:'high' }), 'Why is this a strong sample?');
  assert.equal(enUI.confidenceQuestion({ confidence:'medium' }), 'Why is this a moderate sample?');
  assert.equal(enUI.confidenceQuestion({ confidence:'low' }), 'Why is this a limited sample?');
  assert.equal(zhUI.confidenceQuestion({ confidence:'high' }), '为什么这组样本充分？');
});

test('evidence facts disclose the deposit conversion used for monthly-rent comparison', () => {
  assert.deepEqual(
    enUI.evidenceFacts({ comparableCount:7, monthsUsed:3, comparisonMode:'monthly-rent', conversionAnnualRate:0.05 }),
    {
      sampleLabel:'7 signed contracts',
      periodLabel:'Latest 3 completed months',
      methodLabel:'Monthly rents normalized to your deposit at 5.0%/year statutory reference'
    }
  );
  assert.deepEqual(
    zhUI.evidenceFacts({ comparableCount:7, monthsUsed:3, comparisonMode:'monthly-rent', conversionAnnualRate:0.05 }),
    {
      sampleLabel:'7 笔已签约成交',
      periodLabel:'最近 3 个完整月份',
      methodLabel:'按法定参考年率 5.0% 将月租换算到你的押金水平'
    }
  );
});

test('homepage desktop grid leaves enough room for a two-digit size without growing wider', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  const match = css.match(/\.funnel-rent-card \.rent-check-form\{grid-template-columns:([^;}]+)/);
  assert.ok(match, 'homepage Rent Check desktop grid is present');
  const minimums = [...match[1].matchAll(/minmax\((\d+)px,/g)].map(item => Number(item[1]));
  assert.equal(minimums.length, 6);
  assert.ok(minimums[0] >= 260, 'Area keeps the longest bilingual option readable');
  assert.ok(minimums[1] >= 250, 'Property type keeps the longest bilingual option readable');
  assert.ok(minimums[3] >= 185, 'Monthly-rent label stays on one line');
  assert.ok(minimums[4] >= 96, 'Size input has room for its number and unit');
  assert.ok(minimums.reduce((sum, width) => sum + width, 0) <= 1040, 'six columns still fit before the responsive breakpoint');
});

test('a distribution verdict describes the displayed typical range instead of a median threshold', () => {
  assert.equal(enUI.ratingLabel('fair', 'typical-range'), 'Typical range');
  assert.equal(
    enUI.resultSentence({ rating:'fair', verdictBasis:'typical-range', differencePct:20 }),
    'This quote sits within the typical range of recent comparable contracts.'
  );
  assert.equal(zhUI.ratingLabel('fair', 'typical-range'), '典型区间');
  assert.equal(
    zhUI.resultSentence({ rating:'fair', verdictBasis:'typical-range', differencePct:20 }),
    '这个报价位于近期可比成交的典型区间内。'
  );
  assert.equal(
    enUI.resultSentence({ rating:'above', verdictBasis:'typical-range', differencePct:25 }),
    'This quote is 25.0% above the recent comparable median.'
  );
  assert.equal(
    enUI.resultSentence({ rating:'above', verdictBasis:'typical-range', differencePct:0 }),
    'This quote is slightly above the recent comparable median.'
  );
});

test('a three-to-four-comparable verdict explicitly names the median fallback', () => {
  assert.equal(enUI.ratingLabel('fair', 'median-fallback'), 'Near sample median');
  assert.equal(enUI.ratingLabel('above', 'median-fallback'), 'Above sample median');
  assert.equal(
    enUI.resultSentence({ rating:'fair', verdictBasis:'median-fallback', differencePct:7 }),
    'With limited data, this quote is within 10% of the sample median.'
  );
  assert.equal(
    enUI.resultSentence({ rating:'above', verdictBasis:'median-fallback', differencePct:12 }),
    'With limited data, this quote is 12.0% above the sample median; the fallback threshold is 10%.'
  );
  assert.equal(zhUI.ratingLabel('fair', 'median-fallback'), '接近样本中位数');
  assert.equal(
    zhUI.resultSentence({ rating:'fair', verdictBasis:'median-fallback', differencePct:7 }),
    '样本有限时，这个报价在样本中位数的 ±10% 范围内。'
  );
});

test('result-specific next step makes an above-market verdict actionable', () => {
  assert.deepEqual(enUI.resultNextStep('above'), {
    heading:'Before you accept this quote',
    body:'Review the price difference and the contract checks that matter before you sign or transfer money.',
    primary:{ id:'signing_questions', label:'Review questions before signing', href:'/guides/before-you-sign/' },
    secondary:{ id:'explore_signed_rents', label:'Explore recent signed rents', href:'explore' }
  });
  assert.deepEqual(zhUI.resultNextStep('above'), {
    heading:'接受这个报价之前',
    body:'签约或转账前，请先核对价格差异以及合同中需要确认的事项。',
    primary:{ id:'signing_questions', label:'查看签约前应问的问题', href:'/zh/guides/before-you-sign/' },
    secondary:{ id:'explore_signed_rents', label:'查看近期已签约租金', href:'explore' }
  });
  assert.equal(enUI.resultNextStep('fair').primary.href, 'explore');
});

test('next-step Explorer URL preserves only an approved district and property type', () => {
  assert.equal(
    enUI.explorerUrl('11620', 'officetel', 'en'),
    '/explore/?lawdCd=11620&type=officetel'
  );
  assert.equal(
    zhUI.explorerUrl('11440', 'villa', 'zh-CN'),
    '/zh/explore/?lawdCd=11440&type=villa'
  );
  assert.equal(enUI.explorerUrl('99999', 'castle', 'en'), '/explore/');
});

test('all EN and ZH Rent Check surfaces expose confidence details and next actions', () => {
  const surfaces = [
    ['index.html', 'app.js'],
    ['zh/index.html', 'zh/app.js'],
    ['tools/seoul-rent-check/index.html', 'tools/seoul-rent-check/app.js'],
    ['zh/tools/seoul-rent-check/index.html', 'zh/tools/seoul-rent-check/app.js']
  ];
  for (const [htmlFile, appFile] of surfaces) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const app = fs.readFileSync(appFile, 'utf8');
    assert.match(html, /id="rentCheckResult"/);
    assert.match(app, /function ensureResultFeedback\(\)/);
    assert.match(app, /rentCheckConfidenceDetails/);
    assert.match(app, /rentCheckConfidenceExplanation/);
    assert.match(app, /rentCheckNextStep/);
    assert.match(app, /rentCheckNextPrimary/);
    assert.match(app, /rentCheckNextSecondary/);
    assert.match(app, /KHGRentCheckUI\.confidenceExplanation\(data,mapped\.isStudioMapped\)/);
    assert.match(app, /confidenceSummary\.textContent=KHGRentCheckUI\.confidenceQuestion\(data\)/);
    assert.match(app, /facts\.methodLabel/);
    assert.match(app, /KHGRentCheckUI\.resultNextStep\(data\.rating\)/);
    assert.match(app, /KHGRentCheckUI\.explorerUrl\(area\.value,mapped\.officialType,language\)/);
    assert.match(app, /rent_check_next_action/);
    assert.match(app, /summaryPanel\.insertAdjacentElement\('afterend',nextStep\)/);
  }
});

test('confidence disclosure and next actions remain readable and touchable on mobile', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /#rentCheckMeta\{[^}]*font-weight:700/);
  assert.match(css, /\.rent-check-confidence-details summary\{[^}]*min-height:44px/);
  assert.match(css, /\.rent-check-confidence-details summary::after/);
  assert.match(css, /\.rent-check-confidence-details\[open\] summary::after/);
  assert.match(css, /\.rent-check-confidence-details summary:focus-visible/);
  assert.match(css, /\.rent-check-next-actions\{[^}]*display:flex/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.rent-check-next-actions\{[^}]*flex-direction:column/);
});
