'use strict';

const DEFAULT_UPSTREAM_TIMEOUT_MS = 5000;
const MAX_UPSTREAM_CONCURRENCY = 2;
const DEFAULT_UPSTREAM_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const MAX_RETRY_DELAY_MS = 3000;

let activeUpstreamRequests = 0;
const upstreamQueue = [];

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

function acquireUpstreamSlot() {
  if (activeUpstreamRequests < MAX_UPSTREAM_CONCURRENCY) {
    activeUpstreamRequests += 1;
    return Promise.resolve();
  }
  return new Promise(resolve => upstreamQueue.push(resolve));
}

function releaseUpstreamSlot() {
  const next = upstreamQueue.shift();
  if (next) {
    next();
    return;
  }
  activeUpstreamRequests = Math.max(0, activeUpstreamRequests - 1);
}

async function withUpstreamSlot(task) {
  await acquireUpstreamSlot();
  try {
    return await task();
  } finally {
    releaseUpstreamSlot();
  }
}

function isRetryableUpstreamStatus(status) {
  return [429, 500, 502, 503, 504].includes(Number(status));
}

function retryAfterMs(headers, now = Date.now()) {
  const raw = headerValue(headers, 'retry-after').trim();
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const when = Date.parse(raw);
  if (!Number.isFinite(when)) return null;
  return Math.max(0, when - now);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function fetchWithRetry(fetchImpl, url, options = {}, timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS, retryOptions = {}) {
  const retries = Math.max(0, Math.floor(Number.isFinite(Number(retryOptions.retries)) ? Number(retryOptions.retries) : DEFAULT_UPSTREAM_RETRIES));
  const baseDelayMs = Math.max(0, Number.isFinite(Number(retryOptions.baseDelayMs)) ? Number(retryOptions.baseDelayMs) : DEFAULT_RETRY_BASE_DELAY_MS);
  const maxDelayMs = Math.max(0, Number.isFinite(Number(retryOptions.maxDelayMs)) ? Number(retryOptions.maxDelayMs) : MAX_RETRY_DELAY_MS);
  const sleepImpl = typeof retryOptions.sleepImpl === 'function' ? retryOptions.sleepImpl : sleep;

  for (let attempt = 0; ; attempt += 1) {
    const response = await withUpstreamSlot(() => fetchWithTimeout(fetchImpl, url, options, timeoutMs));
    if (attempt >= retries || !isRetryableUpstreamStatus(response && response.status)) return response;

    const instructedDelay = retryAfterMs(response.headers);
    const fallbackDelay = baseDelayMs * (2 ** attempt);
    const delay = Math.min(maxDelayMs, instructedDelay == null ? fallbackDelay : instructedDelay);
    await sleepImpl(delay);
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
  fetchWithRetry,
  logApiError
};
