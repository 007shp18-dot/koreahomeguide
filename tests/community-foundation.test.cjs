const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const community = require('../community-core.js');

test('contract contribution validator keeps useful non-identifying fields', () => {
  const result = community.validateContribution({
    buildingId:'mapo-yeonnam-227-1', signedYm:'2026-06', sizeSqm:33.6,
    deposit:10_000_000, monthly:950_000, agencyFeePaid:396_000,
    maintenanceMonthly:70_000, maintenanceIncludes:['water','cleaning'], depositReturned:'still_here',
    unit:'1204', phone:'010-1234-5678'
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.monthly, 950_000);
  assert.equal(Object.hasOwn(result.value,'unit'), false);
  assert.equal(Object.hasOwn(result.value,'phone'), false);
});

test('public text strips phone, Kakao IDs and listing links', () => {
  const clean = community.scrubPublicText('Call 010-1234-5678, Kakao: rent_agent or https://new.land.naver.com/complexes/1');
  assert.doesNotMatch(clean, /010|rent_agent|naver\.com/);
  assert.match(clean, /\[removed\]/);
});

test('community aggregates require three independent recent reporters', () => {
  const base = { buildingId:'b1', signedYm:'2026-06', sizeSqm:33, deposit:10_000_000, monthly:900_000, maintenanceMonthly:60_000, agencyFeePaid:360_000, depositReturned:'full' };
  assert.equal(community.aggregateContributions([{...base,reporterHash:'a'},{...base,reporterHash:'a'},{...base,reporterHash:'b'}], new Date('2026-08-29')), null);
  const aggregate = community.aggregateContributions([
    {...base,reporterHash:'a'},
    {...base,reporterHash:'b',maintenanceMonthly:80_000,agencyFeePaid:420_000},
    {...base,reporterHash:'c',maintenanceMonthly:70_000,agencyFeePaid:396_000}
  ], new Date('2026-08-29'));
  assert.equal(aggregate.reportCount, 3);
  assert.equal(aggregate.maintenanceMonthly, 70_000);
  assert.equal(aggregate.agencyFeePaid, 396_000);
  assert.equal(aggregate.firstYearMonthly, 1_003_000);
  assert.equal(aggregate.depositReturnRate, 1);
  assert.equal(community.aggregateContributions([
    {...base,buildingId:'b1',reporterHash:'a'},
    {...base,buildingId:'b2',reporterHash:'b'},
    {...base,buildingId:'b3',reporterHash:'c'}
  ], new Date('2026-08-29')), null);
});

test('community contribution surface is honest while persistence is disabled', () => {
  const html = fs.readFileSync('community/add/index.html','utf8');
  const app = fs.readFileSync('community/add/app.js','utf8');
  assert.match(html, /data-community-enabled="false"/);
  assert.match(html, /Submission storage is not active yet/);
  assert.match(html, /type="submit"[^>]*disabled/);
  assert.doesNotMatch(app, /fetch\s*\(/);
  assert.match(fs.readFileSync('community/index.html','utf8'), /three independent recent reports/i);
});

test('About publishes independence and aggregate-only community rules in both locales', () => {
  assert.match(fs.readFileSync('about/index.html','utf8'), /three independent reports/i);
  assert.match(fs.readFileSync('zh/about/index.html','utf8'), /三份独立报告/);
});
