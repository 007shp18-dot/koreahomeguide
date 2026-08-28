const test = require('node:test');
const assert = require('node:assert/strict');

const guide = require('../property-type-guide.js');

test('property type guide explains Korean registered categories without reducing them to House', () => {
  assert.equal(guide.descriptionFor('officetel', 'en'), 'Mixed-use building often rented as compact housing; registered as 오피스텔.');
  assert.equal(guide.descriptionFor('detached', 'en'), 'Detached or multi-household housing registered as 단독·다가구.');
  assert.equal(guide.descriptionFor('officetel', 'zh-CN'), '常用于居住的办公住宅两用楼，登记类型为 오피스텔。');
  assert.equal(guide.descriptionFor('detached', 'zh-CN'), '独栋或多户住宅，登记类型为 단독·다가구。');
});
