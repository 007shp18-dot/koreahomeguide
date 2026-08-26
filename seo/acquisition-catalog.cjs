'use strict';

const {
  ENTRY_CONTEXTS,
  findEntryContext
} = require('../acquisition-context.js');

const GUIDE_META = {
  'wolse-vs-jeonse': {
    cluster: 'rent-basics',
    primaryQuery: 'wolse vs jeonse',
    userQuestion: 'How do wolse and jeonse differ in monthly cost, cash need, and deposit risk?',
    pagePromise: 'Compare the two rental structures before choosing how much cash to place in a Korean lease.'
  },
  'korea-rental-contract-checklist': {
    cluster: 'contract-safety',
    primaryQuery: 'korea rental contract checklist',
    userQuestion: 'What should a foreign tenant verify before signing a Korean rental contract?',
    pagePromise: 'Work through the property, owner, money, clause, and move-in checks in a practical order.'
  },
  'seoul-brokerage-fees': {
    cluster: 'move-in-cost',
    primaryQuery: 'seoul rental brokerage fee',
    userQuestion: 'How is the maximum Seoul rental brokerage fee calculated?',
    pagePromise: 'Understand the transaction-value formula, legal ceiling, officetel branches, VAT, and negotiation.'
  },
  'before-you-sign': {
    cluster: 'contract-safety',
    primaryQuery: 'checks before signing a rental contract in korea',
    userQuestion: 'Which checks must happen before a foreign renter transfers a large Korean rental deposit?',
    pagePromise: 'Put registry, owner, payment, residence reporting, fixed-date, and guarantee checks in sequence.'
  },
  'rent-apartment-korea-foreigner': {
    cluster: 'rental-process',
    primaryQuery: 'how to rent an apartment in korea as a foreigner',
    userQuestion: 'How can a foreigner rent an apartment in Korea from budgeting through move-in?',
    pagePromise: 'Follow the search, quote-check, verification, contract, payment, and move-in process step by step.'
  },
  'korea-rental-scams': {
    cluster: 'contract-safety',
    primaryQuery: 'korea rental scams',
    userQuestion: 'Which warning signs should stop a Korean rental deposit or reservation payment?',
    pagePromise: 'Recognize seven breaks in the property, owner, contract, and payment chain before sending money.'
  },
  'seoul-officetel-rent': {
    cluster: 'housing-type',
    primaryQuery: 'seoul officetel rent',
    userQuestion: 'What does a Seoul officetel really cost after deposit, rent, management fees, and trade-offs?',
    pagePromise: 'Compare the full monthly structure, usable area, registered use, and contract checks before choosing.'
  }
};
const DEEP_PATHS = new Set([
  '/guides/wolse-vs-jeonse/',
  '/guides/korea-rental-contract-checklist/',
  '/guides/seoul-brokerage-fees/',
  '/guides/before-you-sign/',
  '/guides/rent-apartment-korea-foreigner/',
  '/guides/korea-rental-scams/',
  '/guides/seoul-officetel-rent/',
  '/rent/gangnam-gu/apartment/',
  '/rent/mapo-gu/officetel/',
  '/rent/yongsan-gu/villa/'
]);
const MARKET_QUERY_TYPES = {
  apartment: 'apartment',
  officetel: 'officetel',
  villa: 'villa low-rise'
};

const ENTRY_PAGES = Object.freeze(ENTRY_CONTEXTS.map(context => {
  if (context.kind === 'guide') {
    const contract = GUIDE_META[context.slug];
    return Object.freeze({
      ...context,
      file: `${context.path.slice(1)}index.html`,
      ...contract,
      priorityTier: DEEP_PATHS.has(context.path) ? 'deep' : 'metadata'
    });
  }
  const queryType = MARKET_QUERY_TYPES[context.propertyType];
  return Object.freeze({
    ...context,
    file: `${context.path.slice(1)}index.html`,
    cluster: 'district-market',
    primaryQuery: `${context.districtLabel.toLowerCase()} ${queryType} rent prices`,
    userQuestion: `What do recent signed ${queryType} rents show in ${context.districtLabel}?`,
    pagePromise: `Review official MOLIT ${queryType} contracts by deposit, floor area, and recent contract date.`,
    priorityTier: DEEP_PATHS.has(context.path) ? 'deep' : 'metadata'
  });
}));

function findEntryPage(pathname) {
  const context = findEntryContext(pathname);
  return context ? ENTRY_PAGES.find(item => item.path === context.path) || null : null;
}

module.exports = { ENTRY_PAGES, findEntryPage };
