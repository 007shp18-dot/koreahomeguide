'use strict';

const { isSupportedPropertyType } = require('../providers/seoul-config.cjs');

const BUDGET_SLUGS = Object.freeze({
  'under-700000-won':700_000,
  'under-1000000-won':1_000_000,
  'under-1500000-won':1_500_000
});

const DEPOSIT_SLUGS = Object.freeze({
  '5-million-won':5_000_000,
  '10-million-won':10_000_000,
  '20-million-won':20_000_000,
  '30-million-won':30_000_000,
  '50-million-won':50_000_000
});

const BUDGET_PROPERTY_TYPES = Object.freeze(['apartment','officetel','villa']);
const MIN_MATCHING_CONTRACTS = 3;
const MIN_INDEXABLE_NEIGHBORHOODS = 3;
const MIN_INDEXABLE_CONTRACTS = 15;

function parseOpportunity({ mode, slug, propertyType } = {}) {
  const normalizedMode = String(mode || '');
  const normalizedSlug = String(slug || '').toLowerCase();
  if (normalizedMode === 'budget') {
    const budgetWon = BUDGET_SLUGS[normalizedSlug];
    const type = String(propertyType || '');
    if (!budgetWon || !BUDGET_PROPERTY_TYPES.includes(type) || !isSupportedPropertyType(type)) return null;
    return Object.freeze({ mode:'budget', slug:normalizedSlug, propertyType:type, budgetWon, depositWon:null });
  }
  if (normalizedMode === 'deposit') {
    const depositWon = DEPOSIT_SLUGS[normalizedSlug];
    if (!depositWon) return null;
    return Object.freeze({ mode:'deposit', slug:normalizedSlug, propertyType:'officetel', budgetWon:null, depositWon });
  }
  return null;
}

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function matchingBand(dong, query) {
  const bands = Array.isArray(dong && dong.depositBands) ? dong.depositBands : [];
  const eligible = bands.filter(band => {
    const count = Number(band && band.count);
    const rent = finitePositive(band && band.medianMonthlyRentWon);
    if (count < MIN_MATCHING_CONTRACTS || rent == null) return false;
    if (query.mode === 'budget') return rent <= query.budgetWon;
    const minimum = Number(band.minDepositWon);
    const maximum = Number(band.maxDepositWon);
    return Number.isFinite(minimum) && query.depositWon >= minimum && query.depositWon < maximum;
  });
  eligible.sort((a, b) => {
    if (query.mode === 'budget' && Number(a.count) !== Number(b.count)) return Number(b.count) - Number(a.count);
    const rentDifference = Number(a.medianMonthlyRentWon) - Number(b.medianMonthlyRentWon);
    if (rentDifference) return rentDifference;
    return Number(b.count) - Number(a.count);
  });
  return eligible[0] || null;
}

function buildOpportunityModel(dongs, query) {
  if (!query) return null;
  const neighborhoods = (Array.isArray(dongs) ? dongs : []).map(dong => {
    const band = matchingBand(dong, query);
    if (!band || !dong || !dong.dong || !dong.districtCode) return null;
    return Object.freeze({
      dong:String(dong.dong),
      districtCode:String(dong.districtCode),
      districtName:String(dong.districtName || ''),
      matchingContractCount:Number(band.count),
      medianMonthlyRentWon:Number(band.medianMonthlyRentWon),
      medianDepositWon:Number.isFinite(Number(band.medianDepositWon)) ? Number(band.medianDepositWon) : null,
      minDepositWon:Number.isFinite(Number(band.minDepositWon)) ? Number(band.minDepositWon) : null,
      maxDepositWon:Number.isFinite(Number(band.maxDepositWon)) ? Number(band.maxDepositWon) : null
    });
  }).filter(Boolean).sort((a, b) => {
    if (a.medianMonthlyRentWon !== b.medianMonthlyRentWon) return a.medianMonthlyRentWon - b.medianMonthlyRentWon;
    if (a.matchingContractCount !== b.matchingContractCount) return b.matchingContractCount - a.matchingContractCount;
    return `${a.districtName}:${a.dong}`.localeCompare(`${b.districtName}:${b.dong}`, 'en');
  });
  const qualifyingContracts = neighborhoods.reduce((sum, item) => sum + item.matchingContractCount, 0);
  return Object.freeze({
    query,
    neighborhoods:Object.freeze(neighborhoods),
    qualifyingContracts,
    indexable:neighborhoods.length >= MIN_INDEXABLE_NEIGHBORHOODS && qualifyingContracts >= MIN_INDEXABLE_CONTRACTS
  });
}

function opportunityPath(query, lang = 'en') {
  if (!query) return '';
  const prefix = String(lang || '').toLowerCase().startsWith('zh') ? '/zh' : '';
  if (query.mode === 'budget') return `${prefix}/seoul/${query.propertyType}/${query.slug}/`;
  if (query.mode === 'deposit') return `${prefix}/seoul/deposit/${query.slug}/`;
  return '';
}

function approvedOpportunityQueries() {
  const queries = [];
  for (const propertyType of BUDGET_PROPERTY_TYPES) {
    for (const slug of Object.keys(BUDGET_SLUGS)) queries.push(parseOpportunity({ mode:'budget', slug, propertyType }));
  }
  for (const slug of Object.keys(DEPOSIT_SLUGS)) queries.push(parseOpportunity({ mode:'deposit', slug }));
  return Object.freeze(queries.filter(Boolean));
}

module.exports = {
  BUDGET_SLUGS,
  DEPOSIT_SLUGS,
  MIN_MATCHING_CONTRACTS,
  MIN_INDEXABLE_NEIGHBORHOODS,
  MIN_INDEXABLE_CONTRACTS,
  parseOpportunity,
  matchingBand,
  buildOpportunityModel,
  opportunityPath,
  approvedOpportunityQueries
};
