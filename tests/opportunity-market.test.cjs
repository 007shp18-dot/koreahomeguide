const test = require('node:test');
const assert = require('node:assert/strict');

const market = require('../seo/opportunity-market.cjs');

function dong({
  name,
  districtCode,
  districtName,
  bands
}) {
  return {
    dong:name,
    districtCode,
    districtName,
    contractCount:bands.reduce((sum, band) => sum + band.count, 0),
    depositBands:bands
  };
}

const evidence = [
  dong({
    name:'신림동', districtCode:'11620', districtName:'Gwanak-gu',
    bands:[
      { minDepositWon:10_000_000, maxDepositWon:30_000_000, count:6, medianDepositWon:10_000_000, medianMonthlyRentWon:560_000 },
      { minDepositWon:30_000_000, maxDepositWon:50_000_000, count:3, medianDepositWon:35_000_000, medianMonthlyRentWon:480_000 }
    ]
  }),
  dong({
    name:'회기동', districtCode:'11230', districtName:'Dongdaemun-gu',
    bands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:5, medianDepositWon:20_000_000, medianMonthlyRentWon:520_000 }]
  }),
  dong({
    name:'연희동', districtCode:'11410', districtName:'Seodaemun-gu',
    bands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:4, medianDepositWon:15_000_000, medianMonthlyRentWon:650_000 }]
  }),
  dong({
    name:'역삼동', districtCode:'11680', districtName:'Gangnam-gu',
    bands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:20, medianDepositWon:20_000_000, medianMonthlyRentWon:1_500_000 }]
  }),
  dong({
    name:'희소동', districtCode:'11440', districtName:'Mapo-gu',
    bands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:2, medianDepositWon:10_000_000, medianMonthlyRentWon:400_000 }]
  })
];

test('opportunity parser accepts only approved budget and deposit slugs', () => {
  assert.deepEqual(
    market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'officetel' }),
    { mode:'budget', slug:'under-700000-won', propertyType:'officetel', budgetWon:700_000, depositWon:null }
  );
  assert.deepEqual(
    market.parseOpportunity({ mode:'deposit', slug:'10-million-won' }),
    { mode:'deposit', slug:'10-million-won', propertyType:'officetel', budgetWon:null, depositWon:10_000_000 }
  );
  assert.equal(market.parseOpportunity({ mode:'budget', slug:'under-999999-won', propertyType:'officetel' }), null);
  assert.equal(market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'castle' }), null);
  assert.equal(market.parseOpportunity({ mode:'deposit', slug:'999-million-won' }), null);
});

test('budget opportunity uses a qualifying deposit band and ranks by contextual rent', () => {
  const query = market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'officetel' });
  const model = market.buildOpportunityModel(evidence, query);
  assert.deepEqual(model.neighborhoods.map(item => item.dong), ['회기동','신림동','연희동']);
  assert.deepEqual(model.neighborhoods.map(item => item.medianMonthlyRentWon), [520_000,560_000,650_000]);
  assert.deepEqual(model.neighborhoods.map(item => item.matchingContractCount), [5,6,4]);
  assert.equal(model.qualifyingContracts, 15);
  assert.equal(model.indexable, true);
});

test('deposit opportunity matches the half-open band containing the exact cash constraint', () => {
  const query = market.parseOpportunity({ mode:'deposit', slug:'10-million-won' });
  const model = market.buildOpportunityModel(evidence, query);
  assert.deepEqual(model.neighborhoods.map(item => item.dong), ['회기동','신림동','연희동','역삼동']);
  assert.equal(model.neighborhoods[1].medianDepositWon, 10_000_000);
  assert.equal(model.neighborhoods.some(item => item.medianMonthlyRentWon === 480_000), false);
});

test('opportunity evidence gate requires three neighborhoods and fifteen matching contracts', () => {
  const query = market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'officetel' });
  const twoNeighborhoods = market.buildOpportunityModel(evidence.slice(0, 2), query);
  assert.equal(twoNeighborhoods.neighborhoods.length, 2);
  assert.equal(twoNeighborhoods.indexable, false);

  const fourteenContracts = evidence.slice(0, 3).map((item, index) => ({
    ...item,
    depositBands:item.depositBands.map((band, bandIndex) => ({
      ...band,
      count:index === 0 && bandIndex === 0 ? 5 : band.count
    }))
  }));
  assert.equal(market.buildOpportunityModel(fourteenContracts, query).qualifyingContracts, 14);
  assert.equal(market.buildOpportunityModel(fourteenContracts, query).indexable, false);
});

test('opportunity paths are canonical and localized without arbitrary query strings', () => {
  const budget = market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'officetel' });
  const deposit = market.parseOpportunity({ mode:'deposit', slug:'10-million-won' });
  assert.equal(market.opportunityPath(budget, 'en'), '/seoul/officetel/under-700000-won/');
  assert.equal(market.opportunityPath(budget, 'zh'), '/zh/seoul/officetel/under-700000-won/');
  assert.equal(market.opportunityPath(deposit, 'en'), '/seoul/deposit/10-million-won/');
  assert.equal(market.opportunityPath(deposit, 'zh'), '/zh/seoul/deposit/10-million-won/');
});

test('approved opportunity catalogue is finite and contains the two launch examples', () => {
  const queries = market.approvedOpportunityQueries();
  assert.ok(queries.some(item => market.opportunityPath(item, 'en') === '/seoul/officetel/under-700000-won/'));
  assert.ok(queries.some(item => market.opportunityPath(item, 'en') === '/seoul/deposit/10-million-won/'));
  assert.deepEqual([...new Set(queries.map(item => item.propertyType))].sort(), ['apartment','officetel','villa']);
  assert.ok(queries.some(item => market.opportunityPath(item, 'en') === '/seoul/apartment/under-700000-won/'));
  assert.ok(queries.some(item => market.opportunityPath(item, 'en') === '/seoul/villa/under-700000-won/'));
  assert.equal(new Set(queries.map(item => market.opportunityPath(item, 'en'))).size, queries.length);
});
