import { register } from 'node:module';

register(new URL('../../../scripts/typescript-extension-loader.mjs', import.meta.url));

const { EDITORIAL_PORTFOLIO, validateEditorialPortfolio } = await import('../content/portfolio-manifest.ts');
const { GUIDES } = await import('../lib/guide/guide-content.ts');
const { STARTER_EDITORIAL_ARTICLES } = await import('../lib/insights/editorial-content.ts');
const { CHINESE_KOREA_ARTICLES } = await import('../lib/insights/chinese-korea-articles.ts');

validateEditorialPortfolio(EDITORIAL_PORTFOLIO);

const redirects = new Map([
  ['rent-apartment-korea-foreigner', 'rent-an-apartment-in-korea'],
  ['read-seoul-apartment-sale-prices', 'read-seoul-sale-transactions'],
  ['compare-seoul-district-property-prices', 'compare-seoul-district-prices'],
  ['korea-apartment-buying-checklist', 'buy-property-in-korea-as-foreigner'],
  ['before-you-sign', 'korea-rental-contract-checklist'],
]);
const mergeTargets = new Map([
  ['compare-two-contracts', 'wolse-vs-jeonse'],
  ['read-district-evidence', 'compare-seoul-district-prices'],
  ['understand-publication-limits', 'read-seoul-sale-transactions'],
  ['korea-rent-deposit-protection-foreigners', 'korea-rental-contract-checklist'],
  ['korea-rental-scams', 'korea-rental-contract-checklist'],
  ['seoul-officetel-rent', 'rent-an-apartment-in-korea'],
  ['seoul-brokerage-fees', 'rent-an-apartment-in-korea'],
]);
const portfolioSlugs = new Set(EDITORIAL_PORTFOLIO.map(({ slug }) => slug));

function classification(slug) {
  if (portfolioSlugs.has(slug)) return { action: 'migrate', target: slug };
  if (redirects.has(slug)) return { action: 'redirect', target: redirects.get(slug) };
  if (mergeTargets.has(slug)) return { action: 'merge', target: mergeTargets.get(slug) };
  return { action: 'archive', target: null };
}

const inventory = [
  ...GUIDES.map(({ slug }) => ({ route: `/kr/seoul/guide/${slug}/`, ...classification(slug) })),
  ...STARTER_EDITORIAL_ARTICLES.map(({ slug }) => ({ route: `/insights/${slug}/`, ...classification(slug) })),
  ...CHINESE_KOREA_ARTICLES.map(({ slug }) => ({ route: `/zh-cn/kr/seoul/insights/${slug}/`, ...classification(slug) })),
];

const allowed = new Set(['migrate', 'merge', 'archive', 'redirect']);
if (inventory.some(({ action }) => !allowed.has(action))) throw new Error('Unclassified public content route.');

console.log('SignedPrice editorial portfolio audit');
console.log(`PASS: ${EDITORIAL_PORTFOLIO.length} reviewed records (EN ${EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'en').length}, zh-CN ${EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'zh-CN').length})`);
for (const item of inventory) console.log(`${item.action.padEnd(8)} ${item.route}${item.target === null ? '' : ` -> ${item.target}`}`);
console.log(`PASS: ${inventory.length} legacy routes classified; duplicate reader questions blocked.`);
