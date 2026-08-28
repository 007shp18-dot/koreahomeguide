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

test('homepage desktop grid gives rough-size controls a full second row', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  const match = css.match(/\.funnel-rent-card \.rent-check-form\{grid-template-columns:([^;}]+)/);
  assert.ok(match, 'homepage Rent Check desktop grid is present');
  const minimums = [...match[1].matchAll(/minmax\((\d+)px,/g)].map(item => Number(item[1]));
  assert.equal(minimums.length, 4);
  assert.ok(minimums[0] >= 220, 'Area keeps its bilingual option readable');
  assert.ok(minimums[1] >= 220, 'Property type keeps its bilingual option readable');
  assert.ok(minimums[2] >= 170, 'Deposit remains readable');
  assert.ok(minimums[3] >= 170, 'Monthly-rent label stays on one line');
  assert.match(css, /\.funnel-rent-card \.rent-check-size-field\{grid-column:span 3\}/);
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
    heading:'Check the price before you decide',
    body:'This quote is above the recent comparable range. Compare nearby signed rents before agreeing to it.',
    primary:{ id:'explore_signed_rents', label:'See nearby signed rents', href:'explore' }
  });
  assert.deepEqual(zhUI.resultNextStep('above'), {
    heading:'决定前再核对一下价格',
    body:'这个报价高于近期可比区间。接受前，可先查看附近的已签约租金。',
    primary:{ id:'explore_signed_rents', label:'查看附近已签约租金', href:'explore' }
  });
  assert.equal(enUI.resultNextStep('fair').primary.href, '/guides/before-you-sign/');
  assert.equal(enUI.resultNextStep('below').primary.href, '/guides/before-you-sign/');
  assert.equal(enUI.resultNextStep('insufficient').primary.href, 'market');
  assert.equal(zhUI.resultNextStep('fair').primary.href, '/zh/guides/before-you-sign/');
});

test('verdict presentation leads with text, icon, difference, and evidence count', () => {
  assert.deepEqual(
    enUI.verdictPresentation({ rating:'above', differencePct:12.4, comparableCount:24 }),
    {
      icon:'↑',
      label:'Above market',
      difference:'12.4% above comparable median',
      sample:'Based on 24 signed contracts'
    }
  );
  assert.deepEqual(
    enUI.verdictPresentation({ rating:'fair', differencePct:1, comparableCount:1 }),
    {
      icon:'✓',
      label:'Typical range',
      difference:'1.0% above comparable median',
      sample:'Based on 1 signed contract'
    }
  );
  assert.match(zhUI.verdictPresentation({ rating:'insufficient', comparableCount:2 }).label, /可比/);
  assert.match(zhUI.verdictPresentation({ rating:'below', differencePct:-8, comparableCount:9 }).sample, /9 笔/);
});

test('distribution copy reads like a plain market reference in both languages', () => {
  assert.deepEqual(enUI.distributionCopy(), {
    title:'Recent comparable range',
    subtitle:'Middle 50% of the comparable signed contracts',
    rangeLabel:'Middle 50% (P25–P75)',
    positionLabel:'Where this quote sits'
  });
  assert.deepEqual(zhUI.distributionCopy(), {
    title:'近期可比成交区间',
    subtitle:'可比已签约成交中间 50% 的价格范围',
    rangeLabel:'中间 50%（P25–P75）',
    positionLabel:'这个报价的位置'
  });
});

test('insufficient data links only to an existing static market page', () => {
  assert.equal(enUI.marketPageUrl('11440', 'officetel', 'en'), '/rent/mapo-gu/officetel/');
  assert.equal(zhUI.marketPageUrl('11440', 'villa', 'zh-CN'), '/zh/rent/mapo-gu/villa/');
  assert.equal(enUI.marketPageUrl('11350', 'officetel', 'en'), null);
  assert.equal(enUI.marketPageUrl('11680', 'detached', 'en'), null);
  assert.equal(enUI.marketPageUrl('11680', 'studio', 'en'), null);
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
    assert.doesNotMatch(app, /rentCheckNextSecondary/);
    assert.doesNotMatch(html, /rentCheckNextSecondary/);
    assert.match(app, /KHGRentCheckUI\.confidenceExplanation\(data,mapped\.isStudioMapped\)/);
    assert.match(app, /confidenceSummary\.textContent=KHGRentCheckUI\.confidenceQuestion\(data\)/);
    assert.match(app, /facts\.methodLabel/);
    assert.match(app, /KHGRentCheckUI\.resultNextStep\(data\.rating\)/);
    assert.match(app, /KHGRentCheckUI\.verdictPresentation\(data\)/);
    assert.match(app, /KHGRentCheckUI\.distributionCopy\(\)/);
    assert.match(app, /KHGRentCheckUI\.marketPageUrl\(area\.value,mapped\.officialType,language\)/);
    assert.match(app, /KHGRentCheckUI\.explorerUrl\(area\.value,mapped\.officialType,language\)/);
    assert.match(app, /rent_check_next_action/);
    assert.match(app, /savedMount\.insertAdjacentElement\('beforebegin',nextStep\)/);
    assert.ok(html.indexOf('id="rentCheckComparableBody"') < html.indexOf('data-saved-quote-mount'), htmlFile);
  }
});

test('confidence disclosure and next actions remain readable and touchable on mobile', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.rent-check-verdict-primary>\[data-rent-verdict-label\]\{[^}]*font-size:var\(--text-2xl\)/);
  assert.match(css, /\.rent-check-verdict-primary>\[data-rent-verdict-difference\]\{[^}]*font-size:var\(--text-base\)/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.rent-check-verdict-primary>\[data-rent-verdict-label\]\{[^}]*font-size:var\(--text-2xl\)/);
  assert.match(css, /#rentCheckMeta\{[^}]*font-weight:700/);
  assert.match(css, /\.rent-check-confidence-details summary\{[^}]*min-height:44px/);
  assert.match(css, /\.rent-check-confidence-details summary::after/);
  assert.match(css, /\.rent-check-confidence-details\[open\] summary::after/);
  assert.match(css, /\.rent-check-confidence-details summary:focus-visible/);
  assert.match(css, /\.rent-check-next-actions\{[^}]*display:flex/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.rent-check-next-actions\{[^}]*flex-direction:column/);
});
