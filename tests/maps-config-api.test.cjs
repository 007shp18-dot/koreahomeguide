const test = require('node:test');
const assert = require('node:assert/strict');
const maps = require('../api/fx.js');

function responseRecorder() {
  return { statusCode:200, headers:{}, body:null, status(code){this.statusCode=code;return this;}, setHeader(k,v){this.headers[k]=v;}, json(v){this.body=v;return this;} };
}

test('maps config returns disabled without exposing an empty key', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'' })({ method:'GET', query:{ resource:'maps-config' } }, res);
  assert.deepEqual(res.body, { enabled:false });
});

test('maps config returns the configured browser key without public caching', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'GET', query:{ resource:'maps-config' } }, res);
  assert.deepEqual(res.body, { enabled:true, apiKey:'browser-key' });
  assert.match(res.headers['Cache-Control'], /private/);
});

test('maps config exposes an optional production map ID for advanced markers', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key', mapId:'production-map-id' })({ method:'GET', query:{ resource:'maps-config' } }, res);
  assert.deepEqual(res.body, { enabled:true, apiKey:'browser-key', mapId:'production-map-id' });
});

test('maps config never exposes the Google demo map ID in production', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key', mapId:'DEMO_MAP_ID' })({ method:'GET', query:{ resource:'maps-config' } }, res);
  assert.deepEqual(res.body, { enabled:true, apiKey:'browser-key' });
});

test('maps config rejects non-GET methods', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'POST', query:{ resource:'maps-config' } }, res);
  assert.equal(res.statusCode, 405);
});

test('public maps-config path rewrites to the consolidated handler', () => {
  const config = require('../vercel.json');
  assert.equal(config.rewrites.some(route =>
    route.source === '/api/maps-config' && route.destination === '/api/fx?resource=maps-config'
  ), true);
});
