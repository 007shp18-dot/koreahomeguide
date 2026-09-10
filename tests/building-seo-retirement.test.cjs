const test = require('node:test');
const assert = require('node:assert/strict');

const buildingApi = require('../api/seo-building-page.js');

function responseRecorder() {
  return {
    statusCode:200,
    headers:{},
    body:'',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    send(value) { this.body = String(value); return this; }
  };
}

test('building SEO returns 503 without a configured public-data key', async t => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.DATA_GO_KR_SERVICE_KEY;
  t.after(() => {
    if (previousKey === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  });

  let providerCalls = 0;
  const handler = buildingApi.createHandler({
    providerFactory:() => {
      providerCalls += 1;
      throw new Error('public-data provider must not be created');
    }
  });
  const res = responseRecorder();

  await handler({
    method:'GET',
    query:{
      district:'mapo-gu',
      dong:'yeonnam-dong',
      type:'villa',
      building:'twin-villa-deadbee',
      lang:'en'
    }
  }, res);

  assert.equal(res.statusCode, 503);
  assert.equal(providerCalls, 0);
  assert.equal(res.headers['X-Robots-Tag'], 'noindex,nofollow');
});

test('building SEO failure remains localized and non-indexable', async () => {
  const handler = buildingApi.createHandler();
  const cases = [
    {
      lang:'en',
      href:'/explore/?lawdCd=11440&amp;type=villa&amp;dong=%EC%97%B0%EB%82%A8%EB%8F%99',
      label:'Open Rent Explorer'
    },
    {
      lang:'zh',
      href:'/zh/explore/?lawdCd=11440&amp;type=villa&amp;dong=%EC%97%B0%EB%82%A8%EB%8F%99',
      label:'打开租金探索'
    }
  ];

  for (const current of cases) {
    const res = responseRecorder();
    await handler({
      method:'GET',
      query:{
        district:'mapo-gu',
        dong:'yeonnam-dong',
        type:'villa',
        building:'twin-villa-deadbee',
        lang:current.lang
      }
    }, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.headers['X-Robots-Tag'], 'noindex,nofollow');
  }
});
