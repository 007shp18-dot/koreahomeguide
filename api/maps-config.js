'use strict';

function createHandler({ apiKey = process.env.GOOGLE_MAPS_BROWSER_KEY } = {}) {
  return function handler(req, res) {
    if (!req || req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    res.setHeader('Cache-Control', 'private, max-age=300');
    const key = String(apiKey || '').trim();
    return res.status(200).json(key ? { enabled:true, apiKey:key } : { enabled:false });
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
