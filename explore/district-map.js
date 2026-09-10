(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGExplorerDistrictMap = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const MIN_EVIDENCE = 5;

  const METRICS = Object.freeze({
    'adjusted-per-sqm':Object.freeze({ en:'Deposit-adjusted monthly cost per ㎡', zh:'押金调整后每月每㎡成本' }),
    monthly:Object.freeze({ en:'Median monthly rent', zh:'月租中位数' }),
    deposit:Object.freeze({ en:'Median deposit', zh:'押金中位数' })
  });

  function finite(value) {
    if (value == null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeDistrict(row = {}) {
    const summary = row.summary || {};
    return {
      districtCode:String(row.districtCode || ''),
      slug:String(row.slug || ''),
      districtName:String(row.districtName || ''),
      districtNameKo:String(row.districtNameKo || ''),
      summary,
      contractCount:Number(row.contractCount ?? summary.totalContracts ?? summary.contractCount ?? 0)
    };
  }

  function evidenceState(row = {}) {
    const summary = row.summary || {};
    const count = Number(row.contractCount ?? summary.totalContracts ?? summary.contractCount ?? 0);
    return count >= MIN_EVIDENCE ? 'sufficient' : 'insufficient';
  }

  function metricValue(row, metric = 'adjusted-per-sqm') {
    if (evidenceState(row) !== 'sufficient') return null;
    const summary = row && row.summary || {};
    if (metric === 'monthly') return finite(summary.medianMonthlyRentWon);
    if (metric === 'deposit') return finite(summary.medianDepositWon);
    return finite(summary.adjustedPerSqmWon);
  }

  function metricRange(rows, metric) {
    const values = (Array.isArray(rows) ? rows : []).map(row => metricValue(row, metric)).filter(Number.isFinite);
    if (!values.length) return { min:0, max:1 };
    return { min:Math.min(...values), max:Math.max(...values) };
  }

  function rampIndex(value, range) {
    const number = finite(value);
    if (number === null) return -1;
    const min = finite(range && range.min);
    const max = finite(range && range.max);
    if (min === null || max === null || max <= min) return 0;
    return Math.min(4, Math.max(0, Math.floor(((number - min) / (max - min)) * 5)));
  }

  function metricLabel(metric, locale = 'en') {
    const record = METRICS[metric] || METRICS['adjusted-per-sqm'];
    return locale === 'zh' ? record.zh : record.en;
  }

  function featureDistrictCode(feature) {
    if (!feature) return '';
    if (typeof feature.getProperty === 'function') return String(feature.getProperty('districtCode') || '');
    return String(feature.properties && feature.properties.districtCode || '');
  }

  return Object.freeze({ MIN_EVIDENCE, normalizeDistrict, evidenceState, metricValue, metricRange, rampIndex, metricLabel, featureDistrictCode });
});
