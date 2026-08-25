const test = require('node:test');
const assert = require('node:assert/strict');
const maps = require('../api/maps-config.js');

function responseRecorder() {
  return { statusCode:200, headers:{}, body:null, status(code){this.statusCode=code;return this;}, setHeader(k,v){this.headers[k]=v;}, json(v){this.body=v;return this;} };
}

test('maps config returns disabled without exposing an empty key', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'' })({ method:'GET' }, res);
  assert.deepEqual(res.body, { enabled:false });
});

test('maps config returns the configured browser key without public caching', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'GET' }, res);
  assert.deepEqual(res.body, { enabled:true, apiKey:'browser-key' });
  assert.match(res.headers['Cache-Control'], /private/);
});

test('maps config rejects non-GET methods', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'POST' }, res);
  assert.equal(res.statusCode, 405);
});
