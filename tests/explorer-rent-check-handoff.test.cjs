const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = rel => fs.readFileSync(rel, 'utf8');

for (const entry of [
  {
    html:'explore/index.html',
    app:'explore/app.js',
    toolPath:'/tools/seoul-rent-check/',
    action:'Check this area and housing type'
  },
  {
    html:'zh/explore/index.html',
    app:'zh/explore/app.js',
    toolPath:'/zh/tools/seoul-rent-check/',
    action:'检查这个区域和住宅类型'
  }
]) {
  test(`${entry.html} exposes contextual Rent Check handoffs for the active Explorer selection`, () => {
    const html = read(entry.html);
    const handoffs = html.match(/data-explorer-rent-check/g) || [];
    assert.equal(handoffs.length, 3, `${entry.html} should expose filter, context-rail, and final handoffs`);
    assert.match(html, new RegExp(`class="explorer-search-handoff"[^]*?${entry.action}`));
    assert.match(html, new RegExp(`href="${entry.toolPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    for (const id of ['explorer_filter_handoff','explorer_context_handoff','explorer_final_handoff']) {
      assert.match(html, new RegExp(`data-rent-check-cta="${id}"`));
    }
    const appPath = entry.app === 'explore/app.js' ? '/explore/app.js' : '/zh/explore/app.js';
    assert.match(html, new RegExp(`<script defer src="${appPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"></script>`));
    assert.ok(html.indexOf('/acquisition-links.js') < html.indexOf(appPath));
  });

  test(`${entry.app} refreshes Rent Check handoffs from area and property-type changes`, () => {
    const app = read(entry.app);
    const updater = (app.match(/function updateRentCheckHandoff\(\)\s*\{([^]*?)\n\}/) || [])[1] || '';
    assert.match(updater, /KHGAcquisitionLinks\.updateRentCheckLinksForSelection/);
    assert.match(updater, /lawdCd:areaSelect\.value/);
    assert.match(updater, /propertyType:typeSelect\.value/);
    assert.doesNotMatch(updater, /maxRent|maxDeposit|budgetValues/);
    assert.match(app, /areaSelect\.addEventListener\('change',updateRentCheckHandoff\)/);
    assert.match(app, /typeSelect\.addEventListener\('change',updateRentCheckHandoff\)/);
    assert.ok((app.match(/updateRentCheckHandoff\(\)/g) || []).length >= 3);
  });
}
