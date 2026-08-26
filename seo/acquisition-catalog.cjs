'use strict';

const {
  ENTRY_CONTEXTS,
  findEntryContext
} = require('../acquisition-context.js');

const GUIDE_META = {
  'wolse-vs-jeonse': ['rent-basics', 'wolse vs jeonse'],
  'korea-rental-contract-checklist': ['contract-safety', 'korea rental contract checklist'],
  'seoul-brokerage-fees': ['move-in-cost', 'seoul rental brokerage fee'],
  'before-you-sign': ['contract-safety', 'checks before signing a rental contract in korea'],
  'rent-apartment-korea-foreigner': ['rental-process', 'how to rent an apartment in korea as a foreigner'],
  'korea-rental-scams': ['contract-safety', 'korea rental scams'],
  'seoul-officetel-rent': ['housing-type', 'seoul officetel rent']
};
const MARKET_QUERY_TYPES = {
  apartment: 'apartment',
  officetel: 'officetel',
  villa: 'villa low-rise'
};

const ENTRY_PAGES = Object.freeze(ENTRY_CONTEXTS.map(context => {
  if (context.kind === 'guide') {
    const [cluster, primaryQuery] = GUIDE_META[context.slug];
    return Object.freeze({
      ...context,
      file: `${context.path.slice(1)}index.html`,
      cluster,
      primaryQuery
    });
  }
  return Object.freeze({
    ...context,
    file: `${context.path.slice(1)}index.html`,
    cluster: 'district-market',
    primaryQuery: `${context.districtLabel.toLowerCase()} ${MARKET_QUERY_TYPES[context.propertyType]} rent prices`
  });
}));

function findEntryPage(pathname) {
  const context = findEntryContext(pathname);
  return context ? ENTRY_PAGES.find(item => item.path === context.path) || null : null;
}

module.exports = { ENTRY_PAGES, findEntryPage };
