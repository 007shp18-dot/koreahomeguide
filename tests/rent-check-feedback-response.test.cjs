const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('confidence explanation names the actual matched sample and tier boundaries', () => {
  assert.equal(
    enUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:72 }),
    'High confidence: 72 contracts matched the same district and the same official property category within ±15% size and ±25% deposit across the latest 3 completed months.'
  );
  assert.equal(
    enUI.confidenceExplanation({ confidence:'medium', tier:2, comparableCount:5 }),
    'Medium confidence: 5 contracts matched the same district and the same official property category within ±20% size and ±35% deposit across the latest 6 completed months.'
  );
  assert.equal(
    zhUI.confidenceExplanation({ confidence:'high', tier:1, comparableCount:72 }),
    '高可信度：最近 3 个完整月份内，有 72 笔同一区、同一官方房屋分类的成交符合面积 ±15% 和押金 ±25% 的范围。'
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
