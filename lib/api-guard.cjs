'use strict';

const DEFAULT_UPSTREAM_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRY_DELAY_MS = 2000;
const DEFAULT_TOTAL_RETRY_TIMEOUT_MS = 15000;
const MAX_CONCURRENT_UPSTREAM = 2;
const PRODUCTION_ORIGINS = new Set([
  'https://koreahomeguide.com',
  'https://www.koreahomeguide.com'
]);
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const SAFE_CONTEXT_FIELDS = ['lawdCd', 'type', 'dealYmd'];

let activeUpstream = 0;
const upstreamWaiters = [];

function requestHeader(req, name) {
  const headers = req && req.headers || {};
  const target = String(name).toLowerCase();
  const key = Object.keys(headers).find(candidate => String(candidate).toLowerCase() === target);
  return String(key ? headers[key] : '').trim();
}

function trustedRequestSource(req) {
  const origin = requestHeader(req, 'origin');
  if (origin) return PRODUCTION_ORIGINS.has(origin);

  if (requestHeader(req, 'sec-fetch-site').toLowerCase() === 'same-origin') return true;

  const referer = requestHeader(req, 'referer');
  if (referer) {
    try {
      return PRODUCTION_ORIGINS.has(new URL(referer).origin);
    } catch (_) {
      return false;
    }
  }

  return process.env.VERCEL_ENV !== 'production';
}

function isRecentCompletedMonth(dealYmd, { referenceDate = new Date(), maxMonths = 60 } = {}) {
  const value = String(dealYmd || '');
  if (!/^\d{6}$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  if (month < 1 || month > 12) return false;

  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) return false;

  const currentIndex = reference.getUTCFullYear() * 12 + reference.getUTCMonth();
  const candidateIndex = year * 12 + month - 1;
  const age = currentIndex - candidateIndex;
  return age >= 1 && age <= maxMonths;
}

function retryDeadlineError() {
  return new Error('Upstream retry deadline exceeded.');
}

async function acquireUpstreamSlot(waitTimeoutMs = Infinity) {
  if (activeUpstream < MAX_CONCURRENT_UPSTREAM) {
    activeUpstream += 1;
    return;
  }
  const waitLimit = Number(waitTimeoutMs);
  if (Number.isFinite(waitLimit) && waitLimit <= 0) throw retryDeadlineError();
  await new Promise((resolve, reject) => {
    const waiter = {
      settled:false,
      timer:null,
      grant() {
        if (waiter.settled) return false;
        waiter.settled = true;
        if (waiter.timer) clearTimeout(waiter.timer);
        resolve();
        return true;
      }
    };
    upstreamWaiters.push(waiter);
    if (Number.isFinite(waitLimit)) {
      waiter.timer = setTimeout(() => {
        if (waiter.settled) return;
        waiter.settled = true;
        const index = upstreamWaiters.indexOf(waiter);
        if (index >= 0) upstreamWaiters.splice(index, 1);
        reject(retryDeadlineError());
      }, waitLimit);
    }
  });
}

function releaseUpstreamSlot() {
  let next;
  while ((next = upstreamWaiters.shift())) {
    if (next.grant()) return;
  }
  activeUpstream -= 1;
}

async function withUpstreamSlot(work, waitTimeoutMs) {
  await acquireUpstreamSlot(waitTimeoutMs);
  try {
    return await work();
  } finally {
    releaseUpstreamSlot();
  }
}

async function fetchWithTimeout(
  fetchImpl,
  url,
  options = {},
  timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS,
  readBody = null
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    if (typeof readBody !== 'function') return response;
    const body = await readBody(response);
    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

function retryDelay(response, attempt, baseDelayMs) {
  const retryAfter = response && response.headers && response.headers.get
    ? response.headers.get('retry-after')
    : null;
  if (retryAfter !== null && retryAfter !== '') {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

    const at = Date.parse(retryAfter);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  }
  return baseDelayMs * (2 ** attempt);
}

async function fetchWithRetry(
  fetchImpl,
  url,
  options = {},
  timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS,
  {
    retries = 2,
    sleepImpl = ms => new Promise(resolve => setTimeout(resolve, ms)),
    baseDelayMs = 500,
    readBody = null,
    maxRetryDelayMs = DEFAULT_MAX_RETRY_DELAY_MS,
    totalTimeoutMs = DEFAULT_TOTAL_RETRY_TIMEOUT_MS,
    nowImpl = Date.now
  } = {}
) {
  const retryBudget = Math.max(0, Math.floor(Number(retries) || 0));
  const delayLimit = Math.max(0, Number(maxRetryDelayMs) || DEFAULT_MAX_RETRY_DELAY_MS);
  const totalLimit = Math.max(1, Number(totalTimeoutMs) || DEFAULT_TOTAL_RETRY_TIMEOUT_MS);
  const startedAt = nowImpl();
  let lastError;

  function remainingTime() {
    return totalLimit - Math.max(0, nowImpl() - startedAt);
  }

  async function waitBeforeRetry(delayMs) {
    const remaining = remainingTime();
    if (remaining <= 0) throw retryDeadlineError();
    const delay = Math.min(Math.max(0, Number(delayMs) || 0), delayLimit, remaining);
    if (delay > 0) await sleepImpl(delay);
  }

  for (let attempt = 0; attempt <= retryBudget; attempt += 1) {
    const waitBudget = remainingTime();
    if (waitBudget <= 0) throw retryDeadlineError();
    try {
      const result = await withUpstreamSlot(
        () => {
          const attemptBudget = remainingTime();
          if (attemptBudget <= 0) throw retryDeadlineError();
          return fetchWithTimeout(
            fetchImpl,
            url,
            options,
            Math.max(1, Math.min(Number(timeoutMs) || DEFAULT_UPSTREAM_TIMEOUT_MS, attemptBudget)),
            readBody
          );
        },
        waitBudget
      );
      const response = typeof readBody === 'function' ? result.response : result;
      if (!RETRYABLE_STATUS.has(response.status) || attempt === retryBudget) return result;
      await waitBeforeRetry(retryDelay(response, attempt, baseDelayMs));
    } catch (error) {
      lastError = error;
      if (attempt === retryBudget || /retry deadline exceeded/i.test(String(error && error.message))) throw error;
      await waitBeforeRetry(baseDelayMs * (2 ** attempt));
    }
  }
  throw lastError || new Error('Upstream request failed.');
}

function safeErrorMessage(error) {
  return String(error && error.message || 'Unknown upstream error')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]')
    .replace(/(serviceKey|key|token)=\S+/gi, '$1=[redacted]');
}

function logApiError(scope, error, context = {}) {
  const payload = {};
  for (const field of SAFE_CONTEXT_FIELDS) {
    if (context[field] !== undefined) payload[field] = context[field];
  }
  payload.message = safeErrorMessage(error);
  console.error(`[${String(scope || 'api')}]`, payload);
}

module.exports = {
  DEFAULT_UPSTREAM_TIMEOUT_MS,
  trustedRequestSource,
  isRecentCompletedMonth,
  fetchWithTimeout,
  fetchWithRetry,
  logApiError
};
