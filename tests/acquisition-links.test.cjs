const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  buildRentCheckUrl,
  buildRentCheckCtaEvent,
  wireRentCheckLinks,
  updateRentCheckLinksForSelection
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

test('Explorer CTA analytics reads the final selected district and property type at click time', () => {
  let clickHandler;
  const anchor = {
    id:'explorer-filter-handoff',
    value:'/tools/seoul-rent-check/',
    getAttribute() { return this.value; },
    setAttribute(_, value) { this.value = value; },
    addEventListener(type, handler) { if (type === 'click') clickHandler = handler; }
  };
  const events = [];
  const doc = {
    documentElement:{ lang:'en' },
    querySelector() { return null; },
    querySelectorAll() { return [anchor]; }
  };

  wireRentCheckLinks({
    doc,
    location:{
      pathname:'/explore/',
      search:'?maxRent=987654&maxDeposit=87654321',
      href:'https://koreahomeguide.com/explore/?maxRent=987654&maxDeposit=87654321'
    },
    track(eventName, params) { events.push({ eventName, params }); }
  });
  anchor.value = '/tools/seoul-rent-check/?lawdCd=11440&type=villa&from=%2Fexplore%2F';
  clickHandler({ defaultPrevented:false });

  assert.deepEqual(events, [{
    eventName:'rent_check_cta_click',
    params:{
      source_page:'/explore/',
      cta_id:'explorer-filter-handoff',
      locale:'en-US',
      district_code:'11440',
      property_type:'villa',
      page_location:'https://koreahomeguide.com/explore/'
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

test('hub links preserve source attribution without inventing quote values', () => {
  assert.equal(
    buildRentCheckUrl({
      sourcePage:'/guides/',
      search:'?utm_source=google&utm_medium=organic'
    }),
    '/tools/seoul-rent-check/?from=%2Fguides%2F&origin_source=google&origin_medium=organic'
  );
});

test('Explorer selection updates every scoped Rent Check handoff without inventing quote values', () => {
  const anchors = [
    {
      value:'/tools/seoul-rent-check/',
      getAttribute() { return this.value; },
      setAttribute(_, value) { this.value = value; }
    },
    {
      value:'/tools/seoul-rent-check/?from=%2Fexplore%2F',
      getAttribute() { return this.value; },
      setAttribute(_, value) { this.value = value; }
    }
  ];
  const doc = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-explorer-rent-check]');
      return anchors;
    }
  };

  assert.equal(updateRentCheckLinksForSelection({
    doc,
    location:{ pathname:'/explore/', search:'?utm_source=google&utm_medium=organic&utm_campaign=launch' },
    lawdCd:'11680',
    propertyType:'officetel'
  }), 2);
  for (const anchor of anchors) {
    assert.equal(
      anchor.value,
      '/tools/seoul-rent-check/?lawdCd=11680&type=officetel&from=%2Fexplore%2F&origin_source=google&origin_medium=organic&origin_campaign=launch'
    );
    assert.doesNotMatch(anchor.value, /(?:deposit|rent|area)=/);
  }

  updateRentCheckLinksForSelection({
    doc,
    location:{ pathname:'/explore/', search:'?lawdCd=11440&type=villa' },
    lawdCd:'11440',
    propertyType:'villa'
  });
  for (const anchor of anchors) {
    assert.equal(
      anchor.value,
      '/tools/seoul-rent-check/?lawdCd=11440&type=villa&from=%2Fexplore%2F&origin_source=google&origin_medium=organic&origin_campaign=launch'
    );
  }
});

test('existing Dong CTA query is preserved and attributed without sensitive values', () => {
  assert.equal(
    buildRentCheckUrl({
      sourcePage:'/seoul/gangnam-gu/%EC%97%AD%EC%82%BC%EB%8F%99/officetel/',
      linkSearch:'?lawdCd=11680&type=officetel&deposit=10000000&rent=1200000&area=25'
    }),
    '/tools/seoul-rent-check/?lawdCd=11680&type=officetel&from=%2Fseoul%2Fgangnam-gu%2F%25EC%2597%25AD%25EC%2582%25BC%25EB%258F%2599%2Fofficetel%2F'
  );
});

test('officetel guide defaults the tool type without guessing a district or quote', () => {
  assert.equal(
    buildRentCheckUrl({ sourcePage:'/guides/seoul-officetel-rent/' }),
    '/tools/seoul-rent-check/?type=officetel&from=%2Fguides%2Fseoul-officetel-rent%2F'
  );
});

test('wire handles localized Rent Check links that already contain safe query values', () => {
  const anchor = {
    id:'dong-rent-check',
    value:'/zh/tools/seoul-rent-check/?lawdCd=11440&type=villa',
    getAttribute() { return this.value; },
    setAttribute(_, value) { this.value = value; },
    addEventListener() {}
  };
  const doc = {
    documentElement:{ lang:'zh-CN' },
    querySelector() { return null; },
    querySelectorAll() { return [anchor]; }
  };
  assert.equal(wireRentCheckLinks({
    doc,
    location:{ pathname:'/zh/seoul/mapo-gu/%EC%84%9C%EA%B5%90%EB%8F%99/villa/', search:'' }
  }), 1);
  assert.equal(
    anchor.value,
    '/zh/tools/seoul-rent-check/?lawdCd=11440&type=villa&from=%2Fzh%2Fseoul%2Fmapo-gu%2F%25EC%2584%259C%25EA%25B5%2590%25EB%258F%2599%2Fvilla%2F'
  );
});

test('hub pages load acquisition context before link wiring', () => {
  for (const file of ['guides/index.html','explore/index.html','zh/guides/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /src="\/acquisition-context\.js"/, file);
    assert.match(html, /src="\/acquisition-links\.js"/, file);
    assert.ok(html.indexOf('/acquisition-context.js') < html.indexOf('/acquisition-links.js'), file);
  }
});
