const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('box plot maps min, quartiles, median, max and quote onto the full comparable range', () => {
  assert.deepEqual(
    enUI.boxPlotModel({
      rating:'above',
      minValueWon:700_000,
      p25ValueWon:830_000,
      medianValueWon:1_000_000,
      p75ValueWon:1_200_000,
      maxValueWon:1_400_000,
      askingValueWon:1_400_000
    }),
    { minPct:0, p25Pct:18.6, medianPct:42.9, p75Pct:71.4, maxPct:100, quotePct:100, relation:'above' }
  );
  assert.deepEqual(
    enUI.boxPlotModel({
      rating:'below',
      minValueWon:700_000,
      p25ValueWon:830_000,
      medianValueWon:1_000_000,
      p75ValueWon:1_200_000,
      maxValueWon:1_400_000,
      askingValueWon:700_000
    }),
    { minPct:0, p25Pct:18.6, medianPct:42.9, p75Pct:71.4, maxPct:100, quotePct:0, relation:'below' }
  );
});

test('box plot rejects missing, reversed, and insufficient distributions', () => {
  assert.equal(enUI.boxPlotModel({ rating:'insufficient' }), null);
  assert.equal(enUI.boxPlotModel({ rating:'unknown', minValueWon:5, p25ValueWon:10, medianValueWon:15, p75ValueWon:20, maxValueWon:25, askingValueWon:12 }), null);
  assert.equal(enUI.boxPlotModel({ rating:'fair', minValueWon:5, p25ValueWon:null, medianValueWon:15, p75ValueWon:20, maxValueWon:25, askingValueWon:12 }), null);
  assert.equal(enUI.boxPlotModel({ rating:'fair', minValueWon:5, p25ValueWon:10, medianValueWon:15, p75ValueWon:20, maxValueWon:25, askingValueWon:'' }), null);
  assert.equal(enUI.boxPlotModel({ rating:'fair', minValueWon:-1, p25ValueWon:10, medianValueWon:15, p75ValueWon:20, maxValueWon:25, askingValueWon:12 }), null);
  assert.equal(enUI.boxPlotModel({ rating:'fair', minValueWon:5, p25ValueWon:10, medianValueWon:8, p75ValueWon:20, maxValueWon:25, askingValueWon:12 }), null);
  assert.deepEqual(
    enUI.boxPlotModel({ rating:'fair', minValueWon:10, p25ValueWon:10, medianValueWon:10, p75ValueWon:10, maxValueWon:10, askingValueWon:10 }),
    { minPct:50, p25Pct:50, medianPct:50, p75Pct:50, maxPct:50, quotePct:50, relation:'within', collapsed:true }
  );
  assert.deepEqual(
    enUI.boxPlotModel({ rating:'above', minValueWon:10, p25ValueWon:10, medianValueWon:10, p75ValueWon:10, maxValueWon:10, askingValueWon:12 }),
    { minPct:50, p25Pct:50, medianPct:50, p75Pct:50, maxPct:50, quotePct:85, relation:'above', collapsed:true }
  );
  assert.equal(enUI.hasDistribution({ rating:'fair', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:12, percentileRank:null }), false);
  assert.equal(enUI.hasDistribution({ rating:'fair', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:12, percentileRank:101 }), false);
});

test('nearby price markers use a collision layout before their labels overlap', () => {
  assert.equal(enUI.priceMarkerCollision({ medianPct:50, quotePct:50 }), true);
  assert.equal(enUI.priceMarkerCollision({ medianPct:45, quotePct:60 }), true);
  assert.equal(enUI.priceMarkerCollision({ medianPct:20, quotePct:70 }), false);
  assert.equal(enUI.priceMarkerCollision(null), false);
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

test('all four Rent Check runtimes wire the visual model and bounded UI events', () => {
  for (const file of ['app.js','zh/app.js','tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /KHGRentCheckUI\.boxPlotModel\(data\)/, file);
    assert.match(source, /KHGRentCheckUI\.ratingLabel\(data\.rating,data\.verdictBasis\)/, file);
    assert.match(source, /KHGRentCheckUI\.hasDistribution\(data\)&&Boolean\(model\)/, file);
    assert.match(source, /visual\.dataset\.collapsed=String\(Boolean\(model\.collapsed\)\)/, file);
    assert.match(source, /KHGRentCheckUI\.priceMarkerCollision\(model\)/, file);
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
  assert.match(css, /\.rent-check-box-plot/);
  assert.match(css, /\.rent-check-box-whisker/);
  assert.match(css, /\.rent-check-box-range/);
  assert.match(css, /\.rent-check-box-median/);
  assert.match(css, /\.rent-check-box-quote/);
  assert.match(css, /\[data-collapsed="true"\]/);
  assert.match(css, /\[data-collision="true"\]/);
  assert.match(css, /\.rent-check-evidence-facts/);
  assert.match(css, /\.rent-check-comparables-toggle\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.rent-check-mobile-extra\{[^}]*display:none/);
  assert.match(cold, /\.lead-capture\{[^}]*background:#fff/);
});
