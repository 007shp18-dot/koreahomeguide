(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KHGCommunity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const RETURN_STATES = new Set(['full','partial','none','still_here']);
  const INCLUDES = new Set(['water','cleaning','electricity','gas','internet','parking','security','elevator']);
  const TOPICS = Object.freeze(['noise','landlords','commute','agency_fees','deposit_disputes','utilities','neighborhood']);

  function finiteMoney(value) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? Math.round(number) : null; }
  function validateContribution(input) {
    const source = input && typeof input === 'object' ? input : {};
    const buildingId = String(source.buildingId || '').trim();
    const signedYm = String(source.signedYm || '');
    const sizeSqm = Number(source.sizeSqm);
    const deposit = finiteMoney(source.deposit);
    const monthly = finiteMoney(source.monthly);
    const agencyFeePaid = finiteMoney(source.agencyFeePaid);
    const maintenanceMonthly = finiteMoney(source.maintenanceMonthly);
    const depositReturned = String(source.depositReturned || '');
    const errors = [];
    if (!/^[a-z0-9][a-z0-9:_-]{1,79}$/i.test(buildingId)) errors.push('buildingId');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(signedYm)) errors.push('signedYm');
    if (!Number.isFinite(sizeSqm) || sizeSqm < 5 || sizeSqm > 500) errors.push('sizeSqm');
    if ([deposit,monthly,agencyFeePaid,maintenanceMonthly].some(value => value == null)) errors.push('money');
    if (!RETURN_STATES.has(depositReturned)) errors.push('depositReturned');
    if (errors.length) return { ok:false, errors };
    return { ok:true, value:{
      buildingId, signedYm, sizeSqm:Math.round(sizeSqm * 10) / 10, deposit, monthly, agencyFeePaid, maintenanceMonthly,
      maintenanceIncludes:[...new Set(Array.isArray(source.maintenanceIncludes) ? source.maintenanceIncludes.filter(value => INCLUDES.has(value)) : [])],
      depositReturned
    } };
  }

  function scrubPublicText(value) {
    return String(value || '')
      .replace(/(?:\+?82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}/g, '[removed]')
      .replace(/(?:kakao(?:talk)?(?:\s*(?:id|:))?\s*)[a-z0-9_.-]{3,30}/gi, 'Kakao [removed]')
      .replace(/https?:\/\/(?:m\.)?(?:new\.land\.naver\.com|land\.naver\.com|zigbang\.com|dabangapp\.com)\/\S*/gi, '[removed]')
      .trim();
  }

  function median(values) {
    const numbers = values.map(Number).filter(Number.isFinite).sort((a,b) => a - b);
    if (!numbers.length) return null;
    const middle = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[middle] : Math.round((numbers[middle - 1] + numbers[middle]) / 2);
  }
  function within24Months(signedYm, now) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(signedYm || ''));
    if (!match) return false;
    const monthIndex = Number(match[1]) * 12 + Number(match[2]) - 1;
    const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
    return monthIndex <= current && monthIndex >= current - 23;
  }
  function filterMad(rows, key) {
    if (rows.length < 4) return rows;
    const center = median(rows.map(row => row[key]));
    const deviation = median(rows.map(row => Math.abs(Number(row[key]) - center)));
    if (!deviation) return rows;
    return rows.filter(row => Math.abs(Number(row[key]) - center) <= 2.5 * deviation);
  }
  function aggregateContributions(reports, now = new Date()) {
    const validRows = (Array.isArray(reports) ? reports : []).map(report => {
      const hash = String(report && report.reporterHash || '');
      if (!hash || !within24Months(report && report.signedYm, now)) return null;
      const valid = validateContribution(report);
      return valid.ok ? { ...valid.value, reporterHash:hash } : null;
    }).filter(Boolean);
    if (new Set(validRows.map(row => row.buildingId)).size !== 1) return null;
    const byReporter = new Map();
    validRows.forEach(row => {
      if (!byReporter.has(row.reporterHash)) byReporter.set(row.reporterHash, row);
    });
    let rows = [...byReporter.values()];
    if (rows.length < 3) return null;
    rows = filterMad(filterMad(rows,'maintenanceMonthly'),'agencyFeePaid');
    if (rows.length < 3) return null;
    const monthly = median(rows.map(row => row.monthly));
    const maintenanceMonthly = median(rows.map(row => row.maintenanceMonthly));
    const agencyFeePaid = median(rows.map(row => row.agencyFeePaid));
    const ended = rows.filter(row => row.depositReturned !== 'still_here');
    return Object.freeze({
      reportCount:rows.length,
      maintenanceMonthly,
      agencyFeePaid,
      firstYearMonthly:Math.round(monthly + maintenanceMonthly + agencyFeePaid / 12),
      depositReturnRate:ended.length ? ended.filter(row => row.depositReturned === 'full').length / ended.length : null
    });
  }

  return Object.freeze({ TOPICS, validateContribution, scrubPublicText, aggregateContributions });
});
