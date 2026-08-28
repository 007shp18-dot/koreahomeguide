const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(file, 'utf8');

function htmlFiles(root = '.') {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'upload'].includes(entry.name)) continue;
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(file));
    else if (entry.name === 'index.html') files.push(file);
  }
  return files;
}

function navLinks(html) {
  const nav = html.match(/<nav>([^]*?)<\/nav>/)?.[1] || '';
  return [...nav.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map(([, href, label]) => ({ href, label: label.trim() }));
}

function optionLabels(html, selectId) {
  const select = html.match(new RegExp(`<select id="${selectId}"[^>]*>([^]*?)<\\/select>`))?.[1] || '';
  return [...select.matchAll(/<option[^>]*>([^<]+)<\/option>/g)]
    .map(([, label]) => label.replaceAll('&amp;', '&').trim());
}

test('primary navigation stays concise and consistent across localized pages', () => {
  for (const file of htmlFiles()) {
    const html = read(file);
    if (!/<header class="(?:site-header|compact-header)"/.test(html) || !/<nav>/.test(html)) continue;

    const chinese = file.startsWith('zh/') || file.startsWith(`.${path.sep}zh${path.sep}`);
    assert.deepEqual(navLinks(html), chinese ? [
      { href: '/zh/explore/', label: '租金探索' },
      { href: '/zh/tools/seoul-rent-check/', label: '租金检查' },
      { href: '/zh/guides/', label: '租房指南' }
    ] : [
      { href: '/explore/', label: 'Explore' },
      { href: '/tools/seoul-rent-check/', label: 'Rent Check' },
      { href: '/guides/', label: 'Guides' }
    ], file);
  }
});

test('core rent forms use plain home-type labels and compact choices', () => {
  const english = ['index.html', 'tools/seoul-rent-check/index.html', 'explore/index.html'];
  const chinese = ['zh/index.html', 'zh/tools/seoul-rent-check/index.html', 'zh/explore/index.html'];

  for (const file of english) assert.match(read(file), /<span>Home type<\/span>/, file);
  for (const file of chinese) assert.match(read(file), /<span>房型<\/span>/, file);

  assert.deepEqual(optionLabels(read('explore/index.html'), 'exploreType'), [
    'Officetel', 'Apartment', 'Villa / low-rise', 'House'
  ]);
  assert.deepEqual(optionLabels(read('zh/explore/index.html'), 'exploreType'), [
    'Officetel', '公寓', '低层住宅', '独栋 / 多户住宅'
  ]);

  for (const file of english.slice(0, 2)) {
    assert.deepEqual(optionLabels(read(file), 'rentCheckType'), [
      'Apartment', 'Officetel', 'Villa / low-rise', 'House', 'Studio / one-room'
    ], file);
    assert.match(read(file), /Use the registered home type if known\./, file);
  }
  for (const file of chinese.slice(0, 2)) {
    assert.deepEqual(optionLabels(read(file), 'rentCheckType'), [
      '公寓', 'Officetel', '低层住宅', '独栋 / 多户住宅', '单间 / One-room'
    ], file);
    assert.match(read(file), /如知道登记房型，请按登记类型选择。/, file);
  }
});
