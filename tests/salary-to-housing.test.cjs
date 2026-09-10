'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rentCheck = require('../lib/rent-check-core.cjs');
const conversion = require('../deposit-conversion.js');

function source(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

test('the conversion rate has exactly one definition', () => {
  // rent-check-core used to own the constant. It must now borrow it, so the
  // browser tool and the server can never drift apart.
  assert.equal(rentCheck.DEPOSIT_CONVERSION_REFERENCE, conversion.DEPOSIT_CONVERSION_REFERENCE);
  assert.equal(rentCheck.monthlyRentAtDeposit, conversion.monthlyRentAtDeposit);

  const core = source('lib/rent-check-core.cjs');
  assert.match(core, /require\('\.\.\/deposit-conversion\.js'\)/);
  assert.doesNotMatch(core, /annualRate:\s*0?\.\d/, 'the rate must not be restated here');

  const app = source('tools/salary-to-housing/app.js');
  assert.match(app, /KHGDepositConversion/);
  assert.doesNotMatch(app, /0\.05/, 'the tool must not hardcode the rate either');
});

test('the module loads in a browser the same way the other shared utils do', () => {
  // UMD: assigns a global when there is no module system, exports when there is.
  const text = source('deposit-conversion.js');
  assert.match(text, /root\.KHGDepositConversion = api/);
  assert.match(text, /module\.exports = api/);

  const html = source('tools/salary-to-housing/index.html');
  const depositTag = html.indexOf('/deposit-conversion.js');
  const appTag = html.indexOf('/tools/salary-to-housing/app.js');
  assert.ok(depositTag > -1 && appTag > -1, 'both scripts must be linked');
  assert.ok(depositTag < appTag, 'the shared module must load before the app that reads it');
});

test('raising the deposit lowers the rent, by the stated rate', () => {
  const { monthlyRentAtDeposit } = conversion;
  // ₩900,000 signed at a ₩10M deposit, restated at ₩50M: ₩40M × 5% ÷ 12.
  assert.equal(Math.round(monthlyRentAtDeposit(900000, 10000000, 50000000)), 733333);
  // And the reverse direction costs the same amount.
  assert.equal(Math.round(monthlyRentAtDeposit(733333, 50000000, 10000000)), 900000);
  // Same deposit, no change.
  assert.equal(monthlyRentAtDeposit(900000, 20000000, 20000000), 900000);
});

test('the deposit gap depends on the deposit alone, not on the rent', () => {
  const { monthlyRentAtDeposit, DEPOSIT_CONVERSION_REFERENCE:ref } = conversion;
  const cash = 20000000;
  const deposit = 50000000;
  const expected = (deposit - cash) * ref.annualRate / 12;

  // Two neighborhoods with the same deposit but very different rents carry the
  // identical monthly gap — which is why the tool can headline one number.
  for (const rent of [500000, 900000, 2400000]) {
    assert.equal(
      Math.round(monthlyRentAtDeposit(rent, deposit, cash) - rent),
      Math.round(expected)
    );
  }
  assert.equal(Math.round(expected), 125000);
});

// The flip the tool exists to show: by advertised rent one home looks cheaper,
// and once both are restated at the same deposit the other is.
test('the advertised rent can rank homes in the opposite order to their real cost', () => {
  const { monthlyRentAtDeposit } = conversion;
  const looksCheap = { rent:500000, deposit:100000000 }; // low rent bought with a huge deposit
  const looksDear  = { rent:600000, deposit:10000000 };
  assert.ok(looksCheap.rent < looksDear.rent, 'on the listing the first looks cheaper');

  const cash = 20000000;
  const first = monthlyRentAtDeposit(looksCheap.rent, looksCheap.deposit, cash);
  const second = monthlyRentAtDeposit(looksDear.rent, looksDear.deposit, cash);
  assert.ok(first > second, 'restated at one deposit, the "cheap" one costs more');
  assert.equal(Math.round(first), 833333);
  assert.equal(Math.round(second), 558333);
});

// A property worth pinning down, because it is easy to claim the opposite: the
// cash term is the same for every home, so it shifts the whole list and never
// reorders it. The tool must not promise a personalised ranking.
test('a person\'s own cash shifts every rent equally and never reorders them', () => {
  const { monthlyRentAtDeposit } = conversion;
  const homes = [
    { rent:500000, deposit:100000000 },
    { rent:600000, deposit:10000000 },
    { rent:555000, deposit:50000000 }
  ];
  const order = cash => homes
    .map((home, index) => ({ index, priced:monthlyRentAtDeposit(home.rent, home.deposit, cash) }))
    .sort((a, b) => a.priced - b.priced)
    .map(item => item.index);

  const poor = order(0);
  const rich = order(200000000);
  assert.deepEqual(poor, rich, 'the ranking is the same at any level of cash');

  // What cash does change is the level, by one constant for everyone.
  const shiftFor = home => monthlyRentAtDeposit(home.rent, home.deposit, 0)
    - monthlyRentAtDeposit(home.rent, home.deposit, 30000000);
  const shifts = homes.map(shiftFor).map(Math.round);
  assert.deepEqual(shifts, [shifts[0], shifts[0], shifts[0]]);
  assert.equal(shifts[0], 125000);
});

test('the tool page keeps the conventions of the other tool pages', () => {
  const html = source('tools/salary-to-housing/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/tools\/salary-to-housing\/">/);
  assert.match(html, /\/styles\.css/);
  assert.match(html, /\/currency-utils\.js/);
  assert.match(html, /id="currencySelect"/);
  assert.match(html, /data-currency-input/);
  assert.match(html, /privacy-consent\.js/);
  // Wide tables must scroll in their own box rather than push the page sideways.
  assert.match(html, /class="table-wrap"/);
});

test('the tool adds no new API endpoint', () => {
  // api/ sits at the Hobby function ceiling, so this had to reuse what exists.
  const app = source('tools/salary-to-housing/app.js');
  const endpoints = [...app.matchAll(/fetch\(\s*[`'"]([^`'"$]*)/g)].map(match => match[1]);
  for (const endpoint of endpoints) {
    assert.match(endpoint, /^\/api\/(explore-seoul|fx)/, `unexpected endpoint ${endpoint}`);
  }
  const apiDir = path.join(__dirname, '..', 'api');
  const functions = fs.readdirSync(apiDir).filter(name => /\.(?:js|cjs|mjs)$/.test(name));
  assert.ok(functions.length <= 11, `api/ must stay at or below 11 files, found ${functions.length}`);
});

test('a thin neighborhood is left out rather than reported', () => {
  const app = source('tools/salary-to-housing/app.js');
  assert.match(app, /MIN_CONTRACTS\s*=\s*5/);
  assert.match(app, /contracts\s*<\s*MIN_CONTRACTS/);
});
