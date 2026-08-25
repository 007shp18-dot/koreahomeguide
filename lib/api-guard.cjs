'use strict';

const DEFAULT_UPSTREAM_TIMEOUT_MS = 5000;

function headerValue(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return Array.isArray(direct) ? direct[0] || '' : String(direct || '');
}

function allowedHosts() {
  const hosts = new Set(['koreahomeguide.com', 'www.koreahomeguide.com', 'localhost', '127.0.0.1']);
  for (const key of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    const value = String(process.env[key] || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (value) hosts.add(value.toLowerCase());
  }
  return hosts;
}

function trustedRequestSource(req = {}) {
  const origin = headerValue(req.headers, 'origin');
  const referer = headerValue(req.headers, 'referer');
  const source = origin || referer;
  if (!source) {
    const fetchSite = headerValue(req.headers, 'sec-fetch-site').toLowerCase();
    if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;
    return String(process.env.VERCEL_ENV || '').toLowerCase() !== 'production';
  }
  try {
    const parsed = new URL(source);
    return allowedHosts().has(parsed.hostname.toLowerCase());
  } catch (_) {
    return false;
  }
}

function completedMonthKeys(referenceDate = new Date(), count = 60) {
  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate || Date.now());
  const keys = [];
  for (let offset = 1; offset <= count; offset += 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    keys.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function isRecentCompletedMonth(value, { referenceDate = new Date(), maxMonths = 60 } = {}) {
  const normalized = String(value || '');
  if (!/^\d{6}$/.test(normalized)) return false;
  return completedMonthKeys(referenceDate, maxMonths).includes(normalized);
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function.');
  const controller = new AbortController();
  const externalSignal = options && options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once:true });
  }
  const timer = setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || DEFAULT_UPSTREAM_TIMEOUT_MS));
  try {
    return await fetchImpl(url, { ...options, signal:controller.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

function logApiError(route, error, context = {}) {
  const payload = {};
  for (const key of ['lawdCd', 'type', 'dealYmd', 'dong', 'buildingKey']) {
    if (context[key] !== undefined && context[key] !== null && String(context[key]) !== '') {
      payload[key] = String(context[key]);
    }
  }
  payload.message = error && error.message ? String(error.message) : String(error || 'Unknown error');
  console.error(`[${String(route || 'api')}]`, payload);
}

module.exports = {
  DEFAULT_UPSTREAM_TIMEOUT_MS,
  trustedRequestSource,
  isRecentCompletedMonth,
  fetchWithTimeout,
  logApiError
};
