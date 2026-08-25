const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('English homepage presents Rent Check as the single primary action',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/Is your Seoul rent actually fair\?/);
  assert.match(html,/>Check my rent</);
  assert.match(html,/Official signed transactions/);
  assert.match(html,/Built for foreign renters/);
  assert.match(html,/data-lead-capture/);
  assert.match(html,/Explore Seoul by budget/);
  assert.doesNotMatch(html,/Make your move easier/);
  assert.doesNotMatch(html,/Coming soon/);
});

test('Chinese homepage mirrors the same funnel in localized copy',()=>{
  const html=fs.readFileSync('zh/index.html','utf8');
  assert.match(html,/首尔.*租金|租金.*合理/);
  assert.match(html,/data-lead-capture/);
  assert.match(html,/官方.*成交/);
  assert.doesNotMatch(html,/Coming soon/);
});

test('homepage preserves existing Rent Check DOM IDs',()=>{
  for(const file of ['index.html','zh/index.html']){
    const html=fs.readFileSync(file,'utf8');
    for(const id of ['rentCheckForm','rentCheckArea','rentCheckType','rentCheckDeposit','rentCheckRent','rentCheckAreaSqm','rentCheckButton','rentCheckResult']) assert.match(html,new RegExp(`id="${id}"`),`${file} ${id}`);
    assert.match(html,/src="\/lead-capture\.js"/);
  }
});

test('standalone Rent Check pages expose the shared post-result lead module',()=>{
  for(const file of ['tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/data-lead-capture/);
    assert.match(html,/src="\/lead-capture\.js"/);
  }
});

test('lead capture uses contextual consent copy rather than newsletter framing',()=>{
  for(const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/lead-consent-note/,file);
    assert.doesNotMatch(html,/Subscribe|newsletter|订阅.*新闻|Newsletter/i,file);
  }
});

test('lead module is hidden by default and comes after the complete Rent Check result markup',()=>{
  for(const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']){
    const html=fs.readFileSync(file,'utf8');
    const resultIndex=html.indexOf('id="rentCheckResult"');
    const leadIndex=html.indexOf('data-lead-capture');
    assert.ok(resultIndex >= 0 && leadIndex > resultIndex, file);
    assert.match(html,/class="lead-capture"[^>]*data-lead-capture[^>]*hidden/,file);
  }
});
