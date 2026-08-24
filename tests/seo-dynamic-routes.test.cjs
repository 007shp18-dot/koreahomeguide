const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../providers/seoul-config.cjs');
const routes = require('../seo/seo-route-utils.cjs');

test('district slugs resolve both directions', () => {
  assert.equal(config.districtCodeFromSlug('mapo-gu'), '11440');
  assert.equal(config.districtSlugFromCode('11440'), 'mapo-gu');
  assert.equal(config.districtCodeFromSlug('nope-gu'), null);
});

test('curated Dong slugs are readable and reversible without inventing romanization', () => {
  assert.equal(routes.dongSlugFromName('연남동'), 'yeonnam-dong');
  assert.equal(routes.dongNameFromSlug('yeonnam-dong'), '연남동');
  assert.equal(routes.dongSlugFromName('합정동'), 'hapjeong-dong');
  assert.equal(routes.dongNameFromSlug('성수동1가'), '성수동1가');
  assert.equal(routes.dongSlugFromName('테스트동'), '테스트동');
});

test('building slugs are deterministic and collision-safe across identical names in different dongs', () => {
  const a = routes.buildingSlug({ buildingName:'Twin Villa', buildingKey:'연남동::twin villa' });
  const b = routes.buildingSlug({ buildingName:'Twin Villa', buildingKey:'서교동::twin villa' });
  assert.match(a, /^twin-villa-[a-f0-9]{7}$/);
  assert.match(b, /^twin-villa-[a-f0-9]{7}$/);
  assert.notEqual(a, b);
  assert.equal(a, routes.buildingSlug({ buildingName:'Twin Villa', buildingKey:'연남동::twin villa' }));
});

test('building slug resolver matches only the exact deterministic slug', () => {
  const buildings = [
    { buildingName:'Twin Villa', buildingKey:'연남동::twin villa', dong:'연남동' },
    { buildingName:'Twin Villa', buildingKey:'서교동::twin villa', dong:'서교동' }
  ];
  const slug = routes.buildingSlug(buildings[0]);
  assert.equal(routes.resolveBuildingSlug(buildings, slug).dong, '연남동');
  assert.equal(routes.resolveBuildingSlug(buildings, 'twin-villa-deadbee'), null);
});

test('canonical SEO URL builders produce EN and ZH Dong/building paths', () => {
  const dong = routes.buildDongSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', lang:'en' });
  const zhDong = routes.buildDongSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', lang:'zh' });
  const building = { buildingName:'Twin Villa', buildingKey:'연남동::twin villa' };
  assert.equal(dong, '/seoul/mapo-gu/yeonnam-dong/villa/');
  assert.equal(zhDong, '/zh/seoul/mapo-gu/yeonnam-dong/villa/');
  assert.match(routes.buildBuildingSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', building, lang:'en' }), /^\/seoul\/mapo-gu\/yeonnam-dong\/villa\/twin-villa-[a-f0-9]{7}\/$/);
});
