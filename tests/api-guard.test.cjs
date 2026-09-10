const test = require('node:test');
const assert = require('node:assert/strict');

test('production accepts only KoreaHomeGuide browser origins', () => {
  const { trustedRequestSource } = require('../lib/api-guard.cjs');
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  try {
    assert.equal(trustedRequestSource({ headers:{ origin:'https://koreahomeguide.com' } }), true);
    assert.equal(trustedRequestSource({ headers:{ origin:'https://www.koreahomeguide.com' } }), true);
    assert.equal(trustedRequestSource({ headers:{ origin:'https://evil.example' } }), false);
    assert.equal(trustedRequestSource({ headers:{} }), false);
  } finally {
    if (previous == null) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('non-production permits local and test requests without an Origin header', () => {
  const { trustedRequestSource } = require('../lib/api-guard.cjs');
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'development';
  try {
    assert.equal(trustedRequestSource({ headers:{} }), true);
  } finally {
    if (previous == null) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});
