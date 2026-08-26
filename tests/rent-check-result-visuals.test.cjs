const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('price position maps the quote and median onto the interquartile range', () => {
  assert.deepEqual(
    enUI.pricePositionModel({
      rating:'above',
      p25ValueWon:830_000,
      medianValueWon:1_000_000,
      p75ValueWon:1_200_000,
      askingValueWon:1_400_000
    }),
    { medianPct:45.9, quotePct:100, relation:'above' }
  );
  assert.deepEqual(
    enUI.pricePositionModel({
      rating:'below',
      p25ValueWon:830_000,
      medianValueWon:1_000_000,
      p75ValueWon:1_200_000,
      askingValueWon:700_000
    }),
    { medianPct:45.9, quotePct:0, relation:'below' }
  );
});

test('price position rejects missing, reversed, and insufficient distributions', () => {
  assert.equal(enUI.pricePositionModel({ rating:'insufficient' }), null);
  assert.equal(enUI.pricePositionModel({ rating:'unknown', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:12 }), null);
  assert.equal(enUI.pricePositionModel({ rating:'fair', p25ValueWon:null, medianValueWon:10, p75ValueWon:20, askingValueWon:12 }), null);
  assert.equal(enUI.pricePositionModel({ rating:'fair', p25ValueWon:10, medianValueWon:15, p75ValueWon:20, askingValueWon:'' }), null);
  assert.equal(enUI.pricePositionModel({ rating:'fair', p25ValueWon:-1, medianValueWon:10, p75ValueWon:20, askingValueWon:12 }), null);
  assert.equal(enUI.pricePositionModel({ rating:'fair', p25ValueWon:10, medianValueWon:5, p75ValueWon:20, askingValueWon:12 }), null);
  assert.deepEqual(
    enUI.pricePositionModel({ rating:'fair', p25ValueWon:10, medianValueWon:10, p75ValueWon:10, askingValueWon:10 }),
    { medianPct:50, quotePct:50, relation:'within' }
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
    assert.match(source, /KHGRentCheckUI\.pricePositionModel\(data\)/, file);
    assert.match(source, /KHGRentCheckUI\.hasDistribution\(data\)&&Boolean\(model\)/, file);
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
  assert.match(css, /\.rent-check-price-track/);
  assert.match(css, /\.rent-check-price-quote/);
  assert.match(css, /\[data-collision="true"\]/);
  assert.match(css, /\.rent-check-evidence-facts/);
  assert.match(css, /\.rent-check-comparables-toggle\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[^}]*\.rent-check-mobile-extra\{[^}]*display:none/);
  assert.match(cold, /\.lead-capture\{[^}]*background:#fff/);
});
