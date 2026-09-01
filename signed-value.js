// SignedValue — estimated sale price for a Seoul apartment, from filed contracts.
//
// The lookup stores, for each (complex x area band), an ANCHOR: the fitted price
// of that group's own reference unit in the latest month. Serving needs nothing
// else — no dong table, no month table — because the anchor already contains the
// location and the time. This module only adjusts that anchor for the unit the
// person actually asked about.
//
// The published median error is part of the contract, not a footnote: every
// caller gets `mdapePct` back alongside the number so the UI can show the range
// the estimate could be wrong by. An estimate without its error is a guess
// wearing a suit.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SignedValue = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // Measured on 191,067 filed Seoul apartment sales over 36 months,
  // walk-forward out-of-sample across 4 folds.
  const ACCURACY = Object.freeze({
    mdapePct: 8.2,          // median absolute percentage error
    rangePct: [7.5, 9.5],   // spread across folds
    coveragePct: 92.9,      // share of transactions the building layer covers
    basis: 'walk-forward out-of-sample · 4 folds · Seoul apartments · 36 months'
  });

  // Below this, a gap between asking price and estimate is inside our own error
  // and means nothing. Above the second, it is worth asking why.
  const GAP = Object.freeze({ noisePct: 5, notablePct: 15 });

  const cache = new Map();

  async function loadDistrict(gu, base) {
    const key = String(gu);
    if (!cache.has(key)) {
      const url = (base || '/data/signedvalue/') + key + '.json';
      cache.set(key, fetch(url).then(r => {
        if (!r.ok) throw new Error('SignedValue data unavailable for ' + key);
        return r.json();
      }).catch(e => { cache.delete(key); throw e; }));
    }
    return cache.get(key);
  }

  function bandFor(areaSqm, bands) {
    const a = Number(areaSqm);
    const edges = [40, 60, 75, 85, 105, 135];
    let i = 0;
    while (i < edges.length && a >= edges[i]) i += 1;
    return bands[i];
  }

  // Estimate for one unit. Returns null when the complex has too few filed
  // sales in that size band — a missing estimate is the honest output there,
  // not a number derived from the neighbourhood average.
  function estimate(data, { dong, building, areaSqm, floor }) {
    const d = data.dongs && data.dongs[dong];
    if (!d) return null;
    const b = d[building];
    if (!b) return null;
    const band = bandFor(areaSqm, data.areaBands);
    const g = b[band];
    if (!g) return null;

    const [contracts, anchorManwon, refArea, refFloor] = g;
    const { lnArea, floorPerLevel } = data.coefficients;
    const area = Number(areaSqm), fl = Number(floor);
    if (!(area > 0)) return null;

    let won = anchorManwon * 1e4;
    won *= Math.pow(area / refArea, lnArea);
    if (Number.isFinite(fl)) won *= Math.pow(1 + floorPerLevel, fl - refFloor);

    const e = ACCURACY.mdapePct / 100;
    return {
      won: Math.round(won),
      low: Math.round(won * (1 - e)),
      high: Math.round(won * (1 + e)),
      contracts, band, refArea, refFloor,
      asOfMonth: data.asOfMonth,
      accuracy: ACCURACY
    };
  }

  // How to read a gap between an asking price and the estimate.
  // Three verdicts, and the first one is "this tells you nothing" — which is
  // the honest answer most of the time.
  function compareAsking(estimateResult, askingWon) {
    if (!estimateResult || !(askingWon > 0)) return null;
    const gapPct = 100 * (askingWon - estimateResult.won) / estimateResult.won;
    const abs = Math.abs(gapPct);
    let verdict, meaning;
    if (abs < GAP.noisePct) {
      verdict = 'within-error';
      meaning = '추정 오차 범위 안입니다. 이 차이만으로는 비싸다 싸다 판단할 수 없습니다.';
    } else if (abs < GAP.notablePct) {
      verdict = 'notable';
      meaning = gapPct > 0
        ? '추정보다 높습니다. 층·향·리모델링처럼 신고 자료에 없는 이유가 있는지 확인해 볼 만합니다.'
        : '추정보다 낮습니다. 급매이거나, 신고 자료에 없는 단점이 있을 수 있습니다.';
    } else {
      verdict = 'large';
      meaning = gapPct > 0
        ? '추정보다 크게 높습니다. 이유를 반드시 확인하세요.'
        : '추정보다 크게 낮습니다. 이유를 반드시 확인하세요.';
    }
    return { gapPct, verdict, meaning, thresholds: GAP };
  }

  return { ACCURACY, GAP, loadDistrict, estimate, compareAsking, bandFor };
});
