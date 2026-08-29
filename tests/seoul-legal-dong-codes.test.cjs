const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveSeoulLegalDongCode } = require('../providers/seoul-legal-dong-codes.cjs');

test('official Seoul legal-dong lookup resolves a dong only inside its selected district', () => {
  assert.equal(resolveSeoulLegalDongCode('11680', '역삼동'), '1168010100');
  assert.equal(resolveSeoulLegalDongCode('11440', '연남동'), '1144012400');
  assert.equal(resolveSeoulLegalDongCode('11680', '연남동'), '');
  assert.equal(resolveSeoulLegalDongCode('not-a-district', '역삼동'), '');
});

test('official Seoul legal-dong lookup normalizes harmless surrounding whitespace only', () => {
  assert.equal(resolveSeoulLegalDongCode(' 11680 ', ' 역삼동 '), '1168010100');
  assert.equal(resolveSeoulLegalDongCode('11680', ''), '');
});
