const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'home-market-preview.js');

test('homepage market preview has a dedicated data runtime', () => {
  assert.equal(fs.existsSync(modulePath), true);
});

if (fs.existsSync(modulePath)) {
  const preview = require(modulePath);

  test('market preview loads exact district summaries from the existing Explorer API', async () => {
    const requested = [];
    const responses = {
      '11440':{ districtCode:'11440', summary:{ medianMonthlyRentWon:820000, dataThroughMonth:'2026-07' } },
      '11680':{ districtCode:'11680', summary:{ medianMonthlyRentWon:1400000, dataThroughMonth:'2026-07' } },
      '11620':{ districtCode:'11620', summary:{ medianMonthlyRentWon:550000, dataThroughMonth:'2026-07' } }
    };
    const fetcher = async url => {
      const code = new URL(url, 'https://koreahomeguide.com').searchParams.get('lawdCd');
      requested.push(url);
      return { ok:true, json:async () => responses[code] };
    };

    const result = await preview.loadDistrictPreview(fetcher);

    assert.deepEqual(requested, [
      '/api/explore-area?lawdCd=11440&type=officetel',
      '/api/explore-area?lawdCd=11680&type=officetel',
      '/api/explore-area?lawdCd=11620&type=officetel'
    ]);
    assert.deepEqual(result.map(item => [item.code, item.medianMonthlyRentWon]), [
      ['11440', 820000],
      ['11680', 1400000],
      ['11620', 550000]
    ]);
    assert.equal(result.every(item => item.dataThroughMonth === '2026-07'), true);
  });

  test('market preview fails closed instead of presenting stale or partial numbers', async () => {
    const fetcher = async url => ({
      ok:!url.includes('11680'),
      json:async () => ({ districtCode:'11440', summary:{ medianMonthlyRentWon:820000 } })
    });
    await assert.rejects(() => preview.loadDistrictPreview(fetcher), /market preview unavailable/i);
  });
}
