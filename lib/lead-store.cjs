'use strict';

function createLeadStore({
  fetchImpl = fetch,
  webhookUrl = process.env.LEAD_SHEET_WEBHOOK_URL,
  sharedSecret = process.env.LEAD_SHEET_SHARED_SECRET,
  timeoutMs = 5000
} = {}) {
  return async function storeLead(row) {
    if (!webhookUrl || !sharedSecret) throw new Error('Lead storage unavailable.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || 5000));
    try {
      const response = await fetchImpl(webhookUrl, {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ secret:sharedSecret, row }),
        signal:controller.signal
      });
      if (!response || !response.ok) throw new Error('Lead storage unavailable.');
      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      if (data && data.ok === false) throw new Error('Lead storage unavailable.');
      return { ok:true };
    } catch (_) {
      throw new Error('Lead storage unavailable.');
    } finally {
      clearTimeout(timer);
    }
  };
}

module.exports = { createLeadStore };
