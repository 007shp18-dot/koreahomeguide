'use strict';

const { trustedRequestSource } = require('../lib/api-guard.cjs');
const { normalizeLeadPayload } = require('../lib/lead-core.cjs');
const { normalizeExperiencePayload } = require('../lib/experience-report.cjs');
const { createLeadStore } = require('../lib/lead-store.cjs');

const MAX_BODY_BYTES = 16 * 1024;

function parseBody(body) {
  if (body == null) return {};
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return null;
    try { return JSON.parse(body); } catch (_) { return null; }
  }
  if (typeof body === 'object') {
    try {
      if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) return null;
    } catch (_) { return null; }
    return body;
  }
  return null;
}

function createHandler({
  storeLead = createLeadStore(),
  now = () => new Date(),
  sourceCheck = trustedRequestSource
} = {}) {
  return async function handler(req, res) {
    if (!req || req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
    if (!sourceCheck(req)) return res.status(403).json({ error:'Request source not allowed.' });

    const body = parseBody(req.body);
    if (!body) return res.status(400).json({ error:'Invalid request body.' });
    const parsed = body.kind === 'experience_report'
      ? normalizeExperiencePayload(body, now())
      : normalizeLeadPayload(body, now());
    if (!parsed.ok) return res.status(400).json({ error:parsed.error });

    try {
      await storeLead(parsed.value);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(201).json({ ok:true });
    } catch (_) {
      console.error('[lead]', {
        kind:parsed.value.kind,
        language:parsed.value.language,
        districtCode:parsed.value.district_code,
        message:'Lead storage unavailable.'
      });
      return res.status(503).json({ error:'Lead storage is temporarily unavailable.' });
    }
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.parseBody = parseBody;
