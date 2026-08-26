const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  buildRentCheckUrl,
  buildRentCheckCtaEvent,
  wireRentCheckLinks
} = require('../acquisition-links.js');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

test('market link carries district, type, source page, and renamed campaign context', () => {
  assert.equal(
    buildRentCheckUrl({
      sourcePage: '/rent/gangnam-gu/apartment/',
      lawdCd: '11680',
      propertyType: 'apartment',
      search: '?utm_source=reddit&utm_medium=community&utm_campaign=seoul_rent'
    }),
    '/tools/seoul-rent-check/?lawdCd=11680&type=apartment&from=%2Frent%2Fgangnam-gu%2Fapartment%2F&origin_source=reddit&origin_medium=community&origin_campaign=seoul_rent'
  );
});

test('builder rejects unsupported page, district, type, and control characters', () => {
  const href = buildRentCheckUrl({
    sourcePage: 'https://evil.example/',
    lawdCd: '99999',
    propertyType: 'castle',
    search: '?utm_source=bad%0Avalue'
  });
  assert.equal(href, '/tools/seoul-rent-check/?origin_source=badvalue');
});

test('builder rejects plausible noncatalogue sources and mismatched market tuples', () => {
  assert.equal(
    buildRentCheckUrl({ sourcePage: '/guides/not-real/' }),
    '/tools/seoul-rent-check/'
  );
  assert.equal(
    buildRentCheckUrl({
      sourcePage: '/rent/gangnam-gu/apartment/',
      lawdCd: '11440',
      propertyType: 'villa'
    }),
    '/tools/seoul-rent-check/'
  );
});

test('wire updates every generic Rent Check link on a market page', () => {
  const anchors = [{
    value: '/tools/seoul-rent-check/',
    getAttribute() { return this.value; },
    setAttribute(_, value) { this.value = value; }
  }];
  const doc = {
    querySelector(selector) {
      return selector === '#rentMarketPage'
        ? { dataset: { lawdCd: '11440', propertyType: 'villa' } }
        : null;
    },
    querySelectorAll() { return anchors; }
  };

  assert.equal(
    wireRentCheckLinks({ doc, location: { pathname: '/rent/mapo-gu/villa/', search: '' } }),
    1
  );
  assert.match(anchors[0].value, /lawdCd=11440&type=villa/);
  assert.match(anchors[0].value, /from=%2Frent%2Fmapo-gu%2Fvilla%2F/);
});

test('contextual Rent Check CTA emits a bounded, non-blocking analytics event', () => {
  let clickHandler;
  const anchor = {
    id: 'market-rent-check',
    value: '/tools/seoul-rent-check/',
    getAttribute() { return this.value; },
    setAttribute(_, value) { this.value = value; },
    addEventListener(type, handler) { if (type === 'click') clickHandler = handler; }
  };
  const events = [];
  const doc = {
    documentElement: { lang: 'en' },
    querySelector(selector) {
      return selector === '#rentMarketPage'
        ? { dataset: { lawdCd: '11680', propertyType: 'apartment' } }
        : null;
    },
    querySelectorAll() { return [anchor]; }
  };

  wireRentCheckLinks({
    doc,
    location: { pathname: '/rent/gangnam-gu/apartment/', search: '' },
    track(eventName, params) { events.push({ eventName, params }); }
  });
  const click = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  clickHandler(click);

  assert.equal(click.defaultPrevented, false);
  assert.deepEqual(events, [{
    eventName: 'rent_check_cta_click',
    params: {
      source_page: '/rent/gangnam-gu/apartment/',
      cta_id: 'market-rent-check',
      locale: 'en-US',
      district_code: '11680',
      property_type: 'apartment'
    }
  }]);
});

test('CTA event builder falls back from an unsafe identifier without exposing it', () => {
  assert.deepEqual(buildRentCheckCtaEvent({
    sourcePage: '/rent/gangnam-gu/apartment/',
    lawdCd: '11680',
    propertyType: 'apartment',
    ctaId: 'email@example.com',
    locale: 'zh-CN'
  }), {
    source_page: '/rent/gangnam-gu/apartment/',
    cta_id: 'rent_check_link',
    locale: 'zh-CN',
    district_code: '11680',
    property_type: 'apartment'
  });
});

test('all English acquisition pages load the contextual link helper', () => {
  for (const item of ENTRY_PAGES) {
    const html = fs.readFileSync(item.file, 'utf8');
    assert.match(html, /<script defer src="\/acquisition-context\.js"><\/script>/, item.file);
    assert.match(html, /<script defer src="\/acquisition-links\.js"><\/script>/, item.file);
    assert.ok(
      html.indexOf('/acquisition-context.js') < html.indexOf('/acquisition-links.js'),
      item.file
    );
  }
});
