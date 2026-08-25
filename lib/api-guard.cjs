'use strict';

const PRODUCTION_ORIGINS = new Set([
  'https://koreahomeguide.com',
  'https://www.koreahomeguide.com'
]);

function requestHeader(req, name) {
  const headers = req && req.headers || {};
  return String(headers[name] || headers[String(name).toLowerCase()] || '').trim();
}

function trustedRequestSource(req) {
  if (process.env.VERCEL_ENV !== 'production') return true;
  return PRODUCTION_ORIGINS.has(requestHeader(req, 'origin'));
}

module.exports = { trustedRequestSource };
