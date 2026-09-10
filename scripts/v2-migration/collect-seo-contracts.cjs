'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  renderBuildingPage,
  renderDongPage
} = require('../../seo/seo-page-renderer.cjs');
const { enhanceDongHtml } = require('../../seo/dong-seo-v10-8.cjs');
const { normalizeGuideHubLinks } = require('../../seo/seo-html-postprocess.cjs');
const {
  buildOpportunityModel,
  parseOpportunity
} = require('../../seo/opportunity-market.cjs');
const { renderOpportunityPage } = require('../../seo/opportunity-page.cjs');

const ORIGIN = 'https://koreahomeguide.com';

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
}

function attributes(tag) {
  const result = {};
  const source = String(tag || '');
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;
  while ((match = pattern.exec(source))) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function readTag(html, name) {
  const match = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i').exec(String(html || ''));
  return match ? decodeHtml(match[1].trim()) : '';
}

function readMeta(html, name) {
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = attributes(tag);
    if (attrs.name && attrs.name.toLowerCase() === String(name).toLowerCase()) return attrs.content || '';
  }
  return '';
}

function readLink(html, rel) {
  const tags = String(html || '').match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = attributes(tag);
    const rels = String(attrs.rel || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (rels.includes(String(rel).toLowerCase())) return attrs.href || '';
  }
  return '';
}

function readAlternates(html) {
  const alternates = [];
  const tags = String(html || '').match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = attributes(tag);
    const rels = String(attrs.rel || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!rels.includes('alternate') || !attrs.href || !attrs.hreflang) continue;
    alternates.push({ hreflang:attrs.hreflang, href:attrs.href });
  }
  return alternates;
}

function readJsonLdTypes(html) {
  const types = new Set();
  const scripts = String(html || '').match(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const add = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(add);
    const type = value['@type'];
    if (Array.isArray(type)) type.forEach(item => { if (typeof item === 'string' && item) types.add(item); });
    else if (typeof type === 'string' && type) types.add(type);
    if (Array.isArray(value['@graph'])) value['@graph'].forEach(add);
  };
  for (const script of scripts) {
    const body = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    try { add(JSON.parse(body)); } catch (_) { /* Preserve capture even if a page has malformed JSON-LD. */ }
  }
  return [...types].sort((a, b) => a.localeCompare(b));
}

function normalizeRobots(value) {
  const robots = String(value || '').trim();
  if (!robots) return 'index,follow';
  return robots.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ');
}

function isIndexableRobots(value) {
  return !normalizeRobots(value).split(/[\s,]+/).some(token => token.toLowerCase() === 'noindex');
}

function normalizedPath(value) {
  try {
    const url = new URL(String(value || ''), ORIGIN);
    return `${url.pathname}${url.search}`;
  } catch (_) {
    return String(value || '').split('#')[0];
  }
}

function sitemapFiles(rootDir) {
  return fs.readdirSync(rootDir, { withFileTypes:true })
    .filter(entry => entry.isFile() && /^sitemap.*\.xml$/i.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function sitemapLocations(rootDir) {
  const locations = [];
  for (const file of sitemapFiles(rootDir)) {
    const html = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const matches = html.match(/<loc>\s*([^<]+?)\s*<\/loc>/gi) || [];
    for (const match of matches) {
      const value = /<loc>\s*([^<]+?)\s*<\/loc>/i.exec(match);
      if (value) locations.push({ file, path:normalizedPath(decodeHtml(value[1])) });
    }
  }
  return locations;
}

function findSitemapMembership(routePath, rootDir) {
  const target = normalizedPath(routePath);
  const matches = sitemapLocations(rootDir)
    .filter(item => item.path === target)
    .map(item => item.file);
  return matches.sort((a, b) => a.localeCompare(b));
}

function contractFromHtml({ path: routePath, html, rootDir, sitemapSources }) {
  const canonical = readLink(html, 'canonical');
  return {
    path:routePath,
    canonical,
    alternates:readAlternates(html),
    title:readTag(html, 'title'),
    description:readMeta(html, 'description'),
    robots:normalizeRobots(readMeta(html, 'robots')),
    schemaTypes:readJsonLdTypes(html),
    sitemapSources:Array.isArray(sitemapSources)
      ? [...new Set(sitemapSources.filter(Boolean).map(String))]
      : findSitemapMembership(canonical || routePath, rootDir)
  };
}

function fixtureSummary() {
  return {
    totalContracts:24,
    contractCount:24,
    medianMonthlyRentWon:1_250_000,
    medianDepositWon:10_000_000,
    medianJeonseDepositWon:300_000_000,
    typicalAreaSqm:59.8,
    dataThroughMonth:'2026-07',
    newContractMonthlyRentCount:14,
    renewalMonthlyRentCount:6,
    contractTypeCounts:{ new:14, renewal:6, unspecified:4 },
    depositBands:[
      { minDepositWon:5_000_000, maxDepositWon:10_000_000, count:8, medianMonthlyRentWon:1_200_000, medianDepositWon:7_000_000 },
      { minDepositWon:10_000_000, maxDepositWon:20_000_000, count:7, medianMonthlyRentWon:1_350_000, medianDepositWon:15_000_000 }
    ],
    areaGroups:[
      { approxAreaSqm:59.8, count:8, medianMonthlyRentWon:1_250_000, medianDepositWon:10_000_000 },
      { approxAreaSqm:84.7, count:6, medianMonthlyRentWon:1_650_000, medianDepositWon:20_000_000 }
    ],
    recentTransactions:[
      { areaSqm:59.8, dealAmountWon:1_200_000, floor:8, contractDate:'2026-07-15', monthlyRentWon:1_200_000, depositWon:7_000_000, contractType:'new' },
      { areaSqm:84.7, dealAmountWon:1_500_000, floor:12, contractDate:'2026-06-20', monthlyRentWon:1_500_000, depositWon:15_000_000, contractType:'renewal' }
    ]
  };
}

function fixtureBuilding() {
  return {
    buildingName:'Yeonnam Central Heights',
    buildingKey:'fixture-building-001',
    dong:'연남동',
    contractCount:12,
    monthlyRentCount:8,
    typicalAreaSqm:59.8,
    medianJeonseDepositWon:300_000_000,
    depositBands:fixtureSummary().depositBands
  };
}

function dynamicContracts(rootDir) {
  const areaCode = '11440';
  const districtName = 'Mapo-gu';
  const dong = '연남동';
  const propertyType = 'apartment';
  const summary = fixtureSummary();
  const building = fixtureBuilding();
  const detail = {
    ...building,
    monthlyTrend:[{ month:'2026-06', count:6, medianMonthlyRentWon:1_200_000 }, { month:'2026-07', count:6, medianMonthlyRentWon:1_250_000 }],
    areaGroups:summary.areaGroups,
    contractTypeCounts:summary.contractTypeCounts,
    recentTransactions:summary.recentTransactions
  };
  const dongHtml = lang => normalizeGuideHubLinks(enhanceDongHtml(renderDongPage({
    lang, areaCode, districtName, dong, propertyType, summary, buildings:[building], fxRates:{ USD:0.00074, CNY:0.0052 }
  }), { lang, areaCode, districtName, dong, propertyType, summary }), lang);
  const buildingHtml = lang => renderBuildingPage({
    lang, areaCode, districtName, dong, propertyType, summary, detail, fxRates:{ USD:0.00074, CNY:0.0052 }
  });
  const result = [
    contractFromHtml({
      path:'/seoul/:district/:dong/:type/', html:dongHtml('en'), rootDir,
      sitemapSources:['/sitemaps/seoul/mapo-gu/apartment/', 'api/sitemap-market.js']
    }),
    contractFromHtml({
      path:'/zh/seoul/:district/:dong/:type/', html:dongHtml('zh'), rootDir,
      sitemapSources:['/sitemaps/seoul/mapo-gu/apartment/', 'api/sitemap-market.js']
    }),
    contractFromHtml({
      path:'/seoul/:district/:dong/:type/:building/', html:buildingHtml('en'), rootDir,
      sitemapSources:['/sitemaps/seoul/mapo-gu/apartment/buildings/', 'api/sitemap-market.js']
    }),
    contractFromHtml({
      path:'/zh/seoul/:district/:dong/:type/:building/', html:buildingHtml('zh'), rootDir,
      sitemapSources:['/sitemaps/seoul/mapo-gu/apartment/buildings/', 'api/sitemap-market.js']
    })
  ];

  const fixtureDongs = ['연남동','서교동','망원동'].map((item, index) => ({
    dong:item,
    districtCode:areaCode,
    districtName,
    depositBands:[
      { minDepositWon:5_000_000, maxDepositWon:10_000_000, count:6 + index, medianMonthlyRentWon:900_000 + index * 50_000, medianDepositWon:7_000_000 },
      { minDepositWon:10_000_000, maxDepositWon:20_000_000, count:6 + index, medianMonthlyRentWon:950_000 + index * 50_000, medianDepositWon:15_000_000 }
    ]
  }));
  const opportunities = [
    parseOpportunity({ mode:'budget', slug:'under-1000000-won', propertyType:'apartment' }),
    parseOpportunity({ mode:'deposit', slug:'10-million-won' })
  ];
  for (const query of opportunities) {
    const model = buildOpportunityModel(fixtureDongs, query);
    const routePrefix = query.mode === 'budget' ? '/seoul/:type/:slug/' : '/seoul/deposit/:slug/';
    for (const lang of ['en', 'zh']) {
      const html = renderOpportunityPage({ lang, model, dataThroughMonth:'2026-07', fxRates:{ USD:0.00074, CNY:0.0052 } });
      result.push(contractFromHtml({
        path:lang === 'zh' ? `/zh${routePrefix}` : routePrefix,
        html,
        rootDir,
        sitemapSources:[
          query.mode === 'budget'
            ? '/sitemaps/seoul/opportunities/apartment/'
            : '/sitemaps/seoul/opportunities/officetel/',
          'api/sitemap-market.js'
        ]
      }));
    }
  }
  return result;
}

/**
 * Capture the current static HTML metadata and representative dynamic SEO
 * templates. Dynamic contracts intentionally use fixed, non-personal fixture
 * data; no upstream API calls are made.
 *
 * @param {string} rootDir repository root
 * @param {Array<{path:string, sourceFile:string}>} routes Task 1 LegacyRoute inventory
 * @returns {Array<object>} deterministic SeoContract records
 */
function collectSeoContracts(rootDir, routes) {
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('rootDir must be a non-empty string');
  if (!Array.isArray(routes)) throw new TypeError('routes must be an array');
  const resolvedRoot = path.resolve(rootDir);
  const contracts = routes.map(route => {
    if (!route || typeof route.path !== 'string' || typeof route.sourceFile !== 'string') {
      throw new TypeError('routes must contain LegacyRoute records');
    }
    const source = path.resolve(resolvedRoot, route.sourceFile);
    const relative = path.relative(resolvedRoot, source);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new TypeError('route sourceFile escapes rootDir');
    return contractFromHtml({
      path:route.path,
      html:fs.readFileSync(source, 'utf8'),
      rootDir:resolvedRoot
    });
  });
  return contracts.concat(dynamicContracts(resolvedRoot)).sort((a, b) => a.path.localeCompare(b.path));
}

function writeContracts(outputFile, contracts) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(outputPath, `${JSON.stringify(contracts, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const routesIndex = process.argv.indexOf('--routes');
  const writeIndex = process.argv.indexOf('--write');
  if (routesIndex === -1 || !process.argv[routesIndex + 1] || writeIndex === -1 || !process.argv[writeIndex + 1]) {
    console.error('Usage: node scripts/v2-migration/collect-seo-contracts.cjs --routes <routes.json> --write <output.json>');
    process.exitCode = 1;
  } else {
    const routeFile = path.resolve(process.argv[routesIndex + 1]);
    const routes = JSON.parse(fs.readFileSync(routeFile, 'utf8'));
    writeContracts(process.argv[writeIndex + 1], collectSeoContracts(process.cwd(), routes));
  }
}

module.exports = {
  collectSeoContracts,
  contractFromHtml,
  findSitemapMembership,
  isIndexableRobots,
  readAlternates,
  readJsonLdTypes,
  readLink,
  readMeta,
  readTag
};
