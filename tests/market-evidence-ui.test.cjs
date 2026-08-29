const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const Explorer = require('../explore/explorer-utils.js');

test('market evidence presentation hides price context below five contracts', () => {
  assert.deepEqual(Explorer.marketEvidencePresentation(0, 'en'), {
    count:0, render:false, sufficient:false, sampleLabel:'', limitedLabel:''
  });
  assert.deepEqual(Explorer.marketEvidencePresentation(1, 'en'), {
    count:1, render:true, sufficient:false, sampleLabel:'1 contract', limitedLabel:'Under 5'
  });
  assert.deepEqual(Explorer.marketEvidencePresentation(4, 'en'), {
    count:4, render:true, sufficient:false, sampleLabel:'4 contracts', limitedLabel:'Under 5'
  });
  assert.deepEqual(Explorer.marketEvidencePresentation(5, 'en'), {
    count:5, render:true, sufficient:true, sampleLabel:'5 contracts', limitedLabel:''
  });
});

test('Chinese market evidence uses one non-plural contract label', () => {
  assert.equal(Explorer.marketEvidencePresentation(1, 'zh').sampleLabel, '1 份合同');
  assert.equal(Explorer.marketEvidencePresentation(5, 'zh-CN').sampleLabel, '5 份合同');
});

test('market and building runtimes consume the shared evidence gate', () => {
  for (const file of ['rent-market-page.js','zh/rent-market-page.js','explore/building/app.js','zh/explore/building/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /KHGExplorer\.marketEvidencePresentation\(/, file);
    assert.match(source, /market-evidence-row/, file);
    assert.match(source, /market-evidence-rent/, file);
    assert.match(source, /market-evidence-count/, file);
  }
});
