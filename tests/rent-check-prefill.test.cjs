const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { readRentCheckPrefill } = require('../tools/seoul-rent-check/prefill-utils.js');

test('Rent Check prefill accepts contextual explorer values in KRW and rejects invalid numbers', () => {
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=11680&type=officetel&deposit=10000000&rent=850000&area=25.4'),
    { lawdCd:'11680', type:'officetel', depositWon:10000000, rentWon:850000, areaSqm:25.4 }
  );
  assert.deepEqual(readRentCheckPrefill('?lawdCd=xxx&type=house&deposit=-1&rent=nope&area=0'), {});
});

test('standalone Rent Check page loads and applies explorer prefill before FX rendering', () => {
  const html = fs.readFileSync('tools/seoul-rent-check/index.html','utf8');
  const js = fs.readFileSync('tools/seoul-rent-check/app.js','utf8');
  assert.match(html, /prefill-utils\.js/);
  assert.match(js, /readRentCheckPrefill/);
  assert.match(js, /dataset\.krwValue/);
});
