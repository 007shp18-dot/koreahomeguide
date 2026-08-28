const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  {file:'about/index.html', canonical:'https://koreahomeguide.com/about/', alt:'https://koreahomeguide.com/zh/about/', privacy:'/privacy/', terms:'/terms/'},
  {file:'zh/about/index.html', canonical:'https://koreahomeguide.com/zh/about/', alt:'https://koreahomeguide.com/about/', privacy:'/zh/privacy/', terms:'/zh/terms/'}
];

test('About and Methodology pages expose source, method, limits and commercial independence', () => {
  for (const page of pages) {
    assert.equal(fs.existsSync(page.file), true, page.file);
    const html = fs.readFileSync(page.file, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
    assert.match(html, new RegExp(`hreflang="(?:en|zh-CN)" href="${page.alt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    for (const marker of ['data-about-why','data-about-sources','data-about-method','data-about-limits','data-about-commercial','data-about-corrections']) assert.match(html, new RegExp(marker));
    assert.match(html, /MOLIT|国土交通部/);
    assert.match(html, /independent project|独立项目/);
    assert.match(html, /advertising|广告/);
    assert.match(html, /referral|推荐合作|合作推荐/);
    assert.match(html, /will not change|不会改变/);
    assert.match(html, /hello@koreahomeguide\.com/);
    assert.match(html, new RegExp(`href="${page.privacy}"`));
    assert.match(html, new RegExp(`href="${page.terms}"`));
    assert.doesNotMatch(html, /one person in Seoul|25 days|25日|founder|创始人/i);
  }
});

test('About pages are discoverable from the sitemap and touched product footers', () => {
  const sitemap = fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/about\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/about\//);
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html','explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /href="\/(?:zh\/)?about\/"/, file);
  }
});
