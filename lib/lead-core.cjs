'use strict';

const { isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALES = new Set(['en','zh-CN']);
const KINDS = new Set(['lead_capture','help_request']);
const RATINGS = new Set(['above','fair','below','insufficient']);
const CONFIDENCE = new Set(['high','medium','low']);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLocale(value) {
  const locale = String(value || '').trim();
  return LOCALES.has(locale) ? locale : null;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function boundedString(value, max) {
  return String(value || '').trim().slice(0, max);
}

function sanitizeAttribution(body = {}) {
  return {
    sourcePage:boundedString(body.sourcePage, 200),
    utmSource:boundedString(body.utmSource, 120),
    utmMedium:boundedString(body.utmMedium, 120),
    utmCampaign:boundedString(body.utmCampaign, 120),
    referrerHost:boundedString(body.referrerHost, 255)
  };
}

function invalid(error) {
  return { ok:false, error };
}

function normalizeLeadPayload(body = {}, now = new Date()) {
  const kind = String(body.kind || '').trim();
  if (!KINDS.has(kind)) return invalid('Unsupported lead request.');

  const email = normalizeEmail(body.email);
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return invalid('Enter a valid email address.');

  const language = normalizeLocale(body.language);
  if (!language) return invalid('Unsupported language.');

  const districtCode = String(body.districtCode || '').trim();
  if (!isSupportedAreaCode(districtCode)) return invalid('Unsupported Seoul district.');

  const propertyType = String(body.propertyType || '').trim();
  if (!isSupportedPropertyType(propertyType)) return invalid('Unsupported property type.');

  const areaSqm = Number(body.areaSqm);
  if (!Number.isFinite(areaSqm) || areaSqm <= 0 || areaSqm > 1000) return invalid('Enter a valid floor area.');

  const depositWon = body.depositWon === '' || body.depositWon == null ? 0 : Number(body.depositWon);
  const monthlyRentWon = body.monthlyRentWon === '' || body.monthlyRentWon == null ? 0 : Number(body.monthlyRentWon);
  if (!Number.isFinite(depositWon) || depositWon < 0) return invalid('Deposit must be zero or greater.');
  if (!Number.isFinite(monthlyRentWon) || monthlyRentWon < 0) return invalid('Monthly rent must be zero or greater.');

  const ratingRaw = String(body.rating || '').trim();
  const confidenceRaw = String(body.confidence || '').trim();
  const rating = RATINGS.has(ratingRaw) ? ratingRaw : null;
  const confidence = CONFIDENCE.has(confidenceRaw) ? confidenceRaw : null;

  const helpMessage = String(body.helpMessage || '').trim();
  if (helpMessage.length > 2000) return invalid('Help message is too long.');
  if (kind === 'help_request' && !helpMessage) return invalid('Tell us what you are worried about.');

  const attribution = sanitizeAttribution(body);
  const created = now instanceof Date ? now : new Date(now || Date.now());

  return {
    ok:true,
    value:{
      kind,
      email,
      language,
      district_code:districtCode,
      property_type:propertyType,
      deposit_won:Math.round(depositWon),
      monthly_rent_won:Math.round(monthlyRentWon),
      area_sqm:areaSqm,
      rating,
      confidence,
      asking_value_won:finiteOrNull(body.askingValueWon),
      median_value_won:finiteOrNull(body.medianValueWon),
      difference_pct:finiteOrNull(body.differencePct),
      comparable_count:finiteOrNull(body.comparableCount),
      months_used:finiteOrNull(body.monthsUsed),
      data_through_month:boundedString(body.dataThroughMonth, 20) || null,
      source_page:attribution.sourcePage,
      utm_source:attribution.utmSource,
      utm_medium:attribution.utmMedium,
      utm_campaign:attribution.utmCampaign,
      referrer_host:attribution.referrerHost,
      help_requested:kind === 'help_request',
      help_message:kind === 'help_request' ? helpMessage : '',
      created_at:(Number.isNaN(created.getTime()) ? new Date() : created).toISOString()
    }
  };
}

module.exports = { normalizeEmail, normalizeLocale, sanitizeAttribution, normalizeLeadPayload };
