'use strict';

const { isRentCheckAreaCode } = require('../providers/seoul-config.cjs');
const { validatedResultSource } = require('../acquisition-context.js');
const { calculateBrokerageFee } = require('../brokerage-utils.js');

const LOCALES = new Set(['en','zh-CN']);
const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached','studio']);
const DEPOSIT_OUTCOMES = Object.freeze([
  'returned_on_time',
  'returned_late',
  'returned_with_deductions',
  'not_returned_after_moveout',
  'still_renting'
]);
const OUTCOME_SET = new Set(DEPOSIT_OUTCOMES);
const REPORT_ID_RE = /^[A-Za-z0-9_-]{16,80}$/;
const BROKERAGE_RULE_VERSION = 'seoul-2026-08-28';

function invalid(error) {
  return { ok:false, error };
}

function numberInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function optionalMoney(value) {
  if (value === '' || value == null) return null;
  const number = numberInRange(value, 0, 1_000_000_000);
  return number == null ? null : Math.round(number);
}

function normalizeExperiencePayload(body = {}, now = new Date()) {
  if (String(body.kind || '') !== 'experience_report') return invalid('Unsupported experience request.');

  const reportId = String(body.reportId || '').trim();
  if (!REPORT_ID_RE.test(reportId)) return invalid('Invalid experience report ID.');

  const language = String(body.language || '').trim();
  if (!LOCALES.has(language)) return invalid('Unsupported language.');

  if (body.privacyConsent !== true) return invalid('Privacy consent is required.');
  const privacyNoticeVersion = String(body.privacyNoticeVersion || '').trim().slice(0, 20);
  if (!privacyNoticeVersion) return invalid('Privacy notice version is required.');

  const districtCode = String(body.districtCode || '').trim();
  if (!isRentCheckAreaCode(districtCode)) return invalid('Unsupported Seoul district.');

  const propertyType = String(body.propertyType || '').trim();
  if (!PROPERTY_TYPES.has(propertyType)) return invalid('Unsupported property type.');

  const depositWon = numberInRange(body.depositWon, 0, 100_000_000_000);
  const monthlyRentWon = numberInRange(body.monthlyRentWon, 0, 1_000_000_000);
  const areaSqm = numberInRange(body.areaSqm, 0.1, 1000);
  if (depositWon == null) return invalid('Deposit must be zero or greater.');
  if (monthlyRentWon == null) return invalid('Monthly rent must be zero or greater.');
  if (areaSqm == null) return invalid('Enter a valid floor area.');
  if (depositWon === 0 && monthlyRentWon === 0) return invalid('Enter a valid rental quote.');

  const rawFee = body.agentFeePaidWon;
  const agentFeePaidWon = optionalMoney(rawFee);
  if (rawFee !== '' && rawFee != null && agentFeePaidWon == null) return invalid('Enter a valid brokerage fee.');

  const depositOutcome = String(body.depositOutcome || '').trim();
  if (!OUTCOME_SET.has(depositOutcome)) return invalid('Select a valid deposit outcome.');

  let legalCapWon = null;
  let feeAboveCap = null;
  let capStatus = 'undetermined';
  if (propertyType !== 'officetel') {
    legalCapWon = calculateBrokerageFee({
      propertyType:'housing',
      depositWon,
      monthlyRentWon
    }).maxFeeWon;
    feeAboveCap = agentFeePaidWon == null ? null : agentFeePaidWon > legalCapWon;
    capStatus = 'calculated';
  }

  const created = now instanceof Date ? now : new Date(now || Date.now());
  return {
    ok:true,
    value:{
      kind:'experience_report',
      report_id:reportId,
      language,
      district_code:districtCode,
      property_type:propertyType,
      deposit_won:Math.round(depositWon),
      monthly_rent_won:Math.round(monthlyRentWon),
      area_sqm:areaSqm,
      agent_fee_paid_won:agentFeePaidWon,
      deposit_outcome:depositOutcome,
      legal_cap_won:legalCapWon,
      fee_above_cap:feeAboveCap,
      cap_status:capStatus,
      brokerage_rule_version:BROKERAGE_RULE_VERSION,
      source_page:validatedResultSource(String(body.sourcePage || '').trim().slice(0, 200)),
      created_at:(Number.isNaN(created.getTime()) ? new Date() : created).toISOString(),
      privacy_consent:true,
      privacy_notice_version:privacyNoticeVersion
    }
  };
}

module.exports = {
  BROKERAGE_RULE_VERSION,
  DEPOSIT_OUTCOMES,
  normalizeExperiencePayload
};
