const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('market position focuses on the typical range instead of raw price extremes', () => {
  assert.deepEqual(
    enUI.marketPositionModel({
      rating:'above',
      minValueWon:300_000,
      p25ValueWon:700_000,
      medianValueWon:850_000,
      p75ValueWon:977_500,
      maxValueWon:2_190_000,
      askingValueWon:1_200_000
    }),
    { quotePct:91.2, relation:'above', gapWon:222_500 }
  );
  assert.deepEqual(
    enUI.marketPositionModel({
      rating:'fair',
      p25ValueWon:700_000,
      p75ValueWon:1_000_000,
      askingValueWon:850_000
    }),
    { quotePct:50, relation:'within', gapWon:0 }
  );
});

test('market position rejects invalid data and handles a collapsed typical range', () => {
  assert.equal(enUI.marketPositionModel({ rating:'insufficient' }), null);
  assert.equal(enUI.marketPositionModel({ rating:'unknown', p25ValueWon:10, p75ValueWon:20, askingValueWon:12 }), null);
  assert.equal(enUI.marketPositionModel({ rating:'fair', p25ValueWon:null, p75ValueWon:20, askingValueWon:12 }), null);
  assert.equal(enUI.marketPositionModel({ rating:'fair', p25ValueWon:10, p75ValueWon:20, askingValueWon:'' }), null);
  assert.equal(enUI.marketPositionModel({ rating:'fair', p25ValueWon:20, p75ValueWon:10, askingValueWon:12 }), null);
  assert.equal(enUI.marketPositionModel({ rating:'fair', p25ValueWon:10, p75ValueWon:20, askingValueWon:21 }), null);
  assert.deepEqual(
    enUI.marketPositionModel({ rating:'fair', p25ValueWon:1_000_000, p75ValueWon:1_000_000, askingValueWon:1_000_000 }),
    { quotePct:50, relation:'within', gapWon:0 }
  );
  assert.deepEqual(
    enUI.marketPositionModel({ rating:'above', p25ValueWon:1_000_000, p75ValueWon:1_000_000, askingValueWon:1_200_000 }),
    { quotePct:96, relation:'above', gapWon:200_000 }
  );
  assert.equal(enUI.hasDistribution({ rating:'fair', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:12, percentileRank:null }), false);
  assert.equal(enUI.hasDistribution({ rating:'fair', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:12, percentileRank:101 }), false);
});

test('market position keeps exact boundaries typical and visibly separates outside quotes', () => {
  assert.deepEqual(enUI.marketPositionModel({ rating:'fair', p25ValueWon:100, p75ValueWon:200, askingValueWon:100 }), { quotePct:28, relation:'within', gapWon:0 });
  assert.deepEqual(enUI.marketPositionModel({ rating:'fair', p25ValueWon:100, p75ValueWon:200, askingValueWon:200 }), { quotePct:72, relation:'within', gapWon:0 });
  assert.deepEqual(enUI.marketPositionModel({ rating:'below', p25ValueWon:100, p75ValueWon:200, askingValueWon:99 }), { quotePct:26, relation:'below', gapWon:1 });
  assert.deepEqual(enUI.marketPositionModel({ rating:'above', p25ValueWon:100, p75ValueWon:200, askingValueWon:201 }), { quotePct:74, relation:'above', gapWon:1 });
});

test('market position summary states the useful distance from the typical range', () => {
  assert.equal(enUI.marketPositionSummary({ relation:'above', gapWon:222_500 }), 'above the upper end of the typical range');
  assert.equal(enUI.marketPositionSummary({ relation:'below', gapWon:100_000 }), 'below the lower end of the typical range');
  assert.equal(enUI.marketPositionSummary({ relation:'within', gapWon:0 }), 'inside the typical range');
  assert.equal(zhUI.marketPositionSummary({ relation:'above', gapWon:222_500 }), '比典型区间上限高');
  assert.equal(zhUI.marketPositionSummary({ relation:'below', gapWon:100_000 }), '比典型区间下限低');
});

test('evidence facts and mobile disclosure are localized from real result counts', () => {
  assert.deepEqual(enUI.evidenceFacts({ comparableCount:13, monthsUsed:3 }), {
    sampleLabel:'13 signed contracts',
    periodLabel:'Latest 3 completed months'
  });
  assert.deepEqual(enUI.evidenceFacts({ comparableCount:1, monthsUsed:1 }), {
    sampleLabel:'1 signed contract',
    periodLabel:'Latest 1 completed month'
  });
  assert.deepEqual(enUI.evidenceFacts({ comparableCount:'invalid', monthsUsed:NaN }), {
    sampleLabel:'0 signed contracts',
    periodLabel:'Latest 12 completed months'
  });
  assert.deepEqual(zhUI.evidenceFacts({ comparableCount:13, monthsUsed:3 }), {
    sampleLabel:'13 笔已签约成交',
    periodLabel:'最近 3 个完整月份'
  });
  assert.deepEqual(enUI.comparableDisclosure(10, false), {
    showToggle:true,
    hiddenCount:7,
    label:'Show all 10 comparison rows'
  });
  assert.deepEqual(enUI.comparableDisclosure(10, true), {
    showToggle:true,
    hiddenCount:0,
    label:'Show fewer comparison rows'
  });
  assert.deepEqual(zhUI.comparableDisclosure(3, false), {
    showToggle:false,
    hiddenCount:0,
    label:''
  });
});

test('the shared Rent Check runtime wire the market-position visual and bounded UI events', () => {
  for (const file of ['app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /KHGRentCheckUI\.marketPositionModel\(data\)/, file);
    assert.match(source, /KHGRentCheckUI\.marketPositionSummary\(model\)/, file);
    assert.match(source, /KHGRentCheckUI\.ratingLabel\(data\.rating,data\.verdictBasis\)/, file);
    assert.match(source, /KHGRentCheckUI\.hasDistribution\(data\)&&Boolean\(model\)/, file);
    assert.doesNotMatch(source, /boxPlotModel|rent-check-box-whisker|rent-check-box-cap/, file);
    assert.match(source, /KHGRentCheckUI\.evidenceFacts\(data\)/, file);
    assert.match(source, /KHGRentCheckUI\.comparableDisclosure\(/, file);
    assert.match(source, /rent_check_confidence_open/, file);
    assert.match(source, /rent_check_comparables_expand/, file);
    assert.doesNotMatch(source, /rent_check_(?:confidence_open|comparables_expand)'[^\n]*(?:depositWon|rentWon|askingValueWon|areaSqm)/, file);
  }
});

test('result visuals keep mobile evidence compact and controls touchable', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const cold = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.rent-check-market-position/);
  assert.match(css, /\.rent-check-market-zone\.is-typical/);
  assert.match(css, /\.rent-check-market-marker/);
  assert.match(css, /\.rent-check-market-caption/);
  assert.doesNotMatch(css, /\.rent-check-box-whisker|\.rent-check-box-cap/);
  assert.match(css, /\.rent-check-evidence-facts/);
  assert.match(css, /\.rent-check-comparables-toggle\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.rent-check-mobile-extra\{[^}]*display:none/);
  assert.match(cold, /\.lead-capture\{[^}]*background:var\(--surface\)/);
});
