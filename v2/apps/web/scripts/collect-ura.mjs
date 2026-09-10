#!/usr/bin/env node
/**
 * URA private residential collection.
 *
 * Read this before changing anything — the shape of this API is the opposite
 * of MOLIT's in the three ways that matter.
 *
 * 1. A FULL PULL IS 24 CALLS. Sales come in four batches covering all postal
 *    districts, five years each. Rentals come one quarter at a time, twenty
 *    quarters for five years. There is no district x month grid to walk, so
 *    none of the concurrency machinery the Korean collection needed applies
 *    here. Sequential is correct.
 *
 * 2. THE FIVE-YEAR WINDOW ROLLS. URA serves the last five years and nothing
 *    older, and it says records past five years may be amended or aborted.
 *    So this script ACCUMULATES: it merges each pull into a stored panel and
 *    never replaces it. Overwriting would silently truncate history the day a
 *    quarter falls out of the window, and we would not notice for months.
 *
 * 3. AN EMPTY RESULT IS A FAILURE, NOT AN ANSWER. A batch covers a quarter of
 *    Singapore over five years; zero rows means the call was rejected, not
 *    that nobody transacted. This is the same trap that left the Korean panel
 *    half empty at 596,260 rows — treat empty as an error and stop.
 *
 *   URA_ACCESS_KEY=... node scripts/collect-ura.mjs [--out data/ura] [--quarters 20]
 */

import fs from 'node:fs';
import path from 'node:path';

const TOKEN_URL = 'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1';
const DATA_URL = 'https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1';
const USER_AGENT = 'signedprice/1.0 (+https://signedprice.com)';

const args = process.argv.slice(2);
const argv = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = argv('--out', 'data/ura');
const QUARTERS = Number(argv('--quarters', 20));

const ACCESS_KEY = process.env.URA_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('URA_ACCESS_KEY is not set. Never hard-code it — export it for this run.');
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(url, headers) {
  const response = await fetch(url, { headers: { ...headers, 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

  const body = await response.json();
  // A failed call arrives as HTTP 200 with a Status field. Reading only Result
  // would turn "rejected" into "no rows".
  if (body.Status !== 'Success') {
    throw new Error(`URA status ${body.Status}: ${body.Message || 'no message'}`);
  }
  return body.Result;
}

async function getToken() {
  const token = await call(TOKEN_URL, { AccessKey: ACCESS_KEY });
  if (typeof token !== 'string' || !token) throw new Error('URA returned an empty token');
  return token;
}

function dataUrl(service, param, value) {
  const url = new URL(DATA_URL);
  url.searchParams.set('service', service);
  if (param) url.searchParams.set(param, value);
  return url;
}

// ---------- parsing ----------

/** URA dates are "mmyy" strings. Only five years are served, so the century is unambiguous. */
function parseMonth(mmyy) {
  const m = /^(\d{2})(\d{2})$/.exec(String(mmyy));
  if (!m) return null;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Rentals give area and floor as RANGES ("100-110", "01-05"), not exact values.
 * Sales give exact `area` but still a banded `floorRange`. Keep the raw string
 * and carry the midpoint separately — a midpoint is an assumption and must not
 * masquerade as a measurement.
 */
function parseRange(raw) {
  if (raw == null) return { raw: null, mid: null };
  const text = String(raw).trim();
  const m = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/.exec(text);
  if (m) return { raw: text, mid: (Number(m[1]) + Number(m[2])) / 2 };
  const single = Number(text);
  return { raw: text, mid: Number.isFinite(single) ? single : null };
}

/**
 * Tenure is decisive in Singapore and has no Korean equivalent. Freehold and a
 * 99-year lease with 60 years left are different assets at the same floor area,
 * so the remaining lease has to survive into the panel.
 */
function parseTenure(raw, contractYear) {
  const text = String(raw || '').trim();
  if (/freehold/i.test(text)) return { kind: 'freehold', years: null, from: null, remaining: null };

  const m = /(\d+)\s*yrs?\s*lease\s*commencing\s*from\s*(\d{4})/i.exec(text);
  if (!m) return { kind: 'unknown', years: null, from: null, remaining: null };

  const years = Number(m[1]);
  const from = Number(m[2]);
  const remaining = Number.isFinite(contractYear) ? years - (contractYear - from) : null;
  return { kind: 'leasehold', years, from, remaining };
}

const SALE_TYPE = { '1': 'new', '2': 'subsale', '3': 'resale' };

// ---------- flattening ----------

function flattenSales(projects) {
  const rows = [];
  for (const p of projects ?? []) {
    for (const t of p.transaction ?? []) {
      const month = parseMonth(t.contractDate);
      if (!month) continue;
      const floor = parseRange(t.floorRange);
      const area = Number(t.area);
      rows.push({
        project: p.project,
        street: p.street,
        marketSegment: p.marketSegment ?? null,
        district: t.district,
        propertyType: t.propertyType,
        month,
        areaSqm: Number.isFinite(area) ? area : null,
        floorRaw: floor.raw,
        floorMid: floor.mid,
        typeOfArea: t.typeOfArea ?? null,
        saleType: SALE_TYPE[String(t.typeOfSale)] ?? 'unknown',
        price: Number(t.price),
        nettPrice: t.nettPrice != null ? Number(t.nettPrice) : null,
        noOfUnits: t.noOfUnits != null ? Number(t.noOfUnits) : null,
        tenure: parseTenure(t.tenure, Number(month.slice(0, 4))),
      });
    }
  }
  return rows;
}

function flattenRentals(projects) {
  const rows = [];
  for (const p of projects ?? []) {
    for (const r of p.rental ?? []) {
      const month = parseMonth(r.leaseDate);
      if (!month) continue;
      const area = parseRange(r.areaSqm);
      rows.push({
        project: p.project,
        street: p.street,
        district: r.district,
        propertyType: r.propertyType,
        month,
        areaRaw: area.raw,     // the banded range URA actually reported
        areaMid: area.mid,     // our midpoint, clearly separate
        bedrooms: r.noOfBedRoom != null ? Number(r.noOfBedRoom) : null,
        rent: Number(r.rent),
      });
    }
  }
  return rows;
}

// ---------- accumulation ----------

/**
 * No row carries an id, so identity is the composite of everything that
 * describes the deal. Price is deliberately NOT in the key: URA amends
 * records, and an amended price must overwrite the old row rather than
 * appear beside it as a second sale.
 */
const saleKey = r =>
  [r.project, r.street, r.district, r.propertyType, r.month, r.areaSqm, r.floorRaw, r.saleType].join('|');
const rentKey = r =>
  [r.project, r.street, r.district, r.propertyType, r.month, r.areaRaw, r.bedrooms].join('|');

function loadPanel(file) {
  if (!fs.existsSync(file)) return { rows: [], firstSeen: {} };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function mergePanel(existing, incoming, keyOf, today) {
  const byKey = new Map(existing.rows.map(r => [keyOf(r), r]));
  let added = 0, updated = 0, unchanged = 0;

  for (const row of incoming) {
    const key = keyOf(row);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...row, firstSeen: today, lastSeen: today });
      added += 1;
    } else if (JSON.stringify({ ...prev, firstSeen: 0, lastSeen: 0 }) !==
               JSON.stringify({ ...row, firstSeen: 0, lastSeen: 0 })) {
      byKey.set(key, { ...row, firstSeen: prev.firstSeen, lastSeen: today });
      updated += 1;
    } else {
      byKey.set(key, { ...prev, lastSeen: today });
      unchanged += 1;
    }
  }

  return { rows: [...byKey.values()], added, updated, unchanged };
}

// ---------- run ----------

function recentQuarters(n) {
  const out = [];
  const now = new Date();
  let year = now.getUTCFullYear();
  let quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  for (let i = 0; i < n; i += 1) {
    out.push(`${String(year % 100).padStart(2, '0')}q${quarter}`);
    quarter -= 1;
    if (quarter === 0) { quarter = 4; year -= 1; }
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const token = await getToken();
  const headers = { AccessKey: ACCESS_KEY, Token: token };
  console.log('token acquired');

  // --- sales: four batches, five years each ---
  const sales = [];
  for (const batch of ['1', '2', '3', '4']) {
    const result = await call(dataUrl('PMI_Resi_Transaction', 'batch', batch), headers);
    const rows = flattenSales(result);
    // A batch spans a quarter of Singapore over five years. Zero is a failure.
    if (rows.length === 0) throw new Error(`batch ${batch} returned no rows — treat as failure, not as no data`);
    console.log(`  sales batch ${batch}: ${result.length} projects, ${rows.length} contracts`);
    sales.push(...rows);
    await sleep(500);
  }

  // --- rentals: one call per quarter ---
  const rentals = [];
  const quarters = recentQuarters(QUARTERS);
  const emptyQuarters = [];
  for (const q of quarters) {
    const result = await call(dataUrl('PMI_Resi_Rental', 'refPeriod', q), headers);
    const rows = flattenRentals(result);
    if (rows.length === 0) emptyQuarters.push(q);
    console.log(`  rentals ${q}: ${rows.length} contracts`);
    rentals.push(...rows);
    await sleep(500);
  }
  // The newest quarter can legitimately be thin; anything older cannot.
  const suspicious = emptyQuarters.filter(q => q !== quarters[0]);
  if (suspicious.length) {
    throw new Error(`empty rental quarters that should not be empty: ${suspicious.join(', ')}`);
  }

  const saleFile = path.join(OUT, 'sales.json');
  const rentFile = path.join(OUT, 'rentals.json');
  const salePanel = mergePanel(loadPanel(saleFile), sales, saleKey, today);
  const rentPanel = mergePanel(loadPanel(rentFile), rentals, rentKey, today);

  fs.writeFileSync(saleFile, JSON.stringify({ asOf: today, rows: salePanel.rows }));
  fs.writeFileSync(rentFile, JSON.stringify({ asOf: today, rows: rentPanel.rows }));

  const byType = rows => rows.reduce((a, r) => (a[r.saleType] = (a[r.saleType] || 0) + 1, a), {});
  console.log('\nsales   ', `total ${salePanel.rows.length}`,
    `(+${salePanel.added} new, ${salePanel.updated} amended)`, byType(salePanel.rows));
  console.log('rentals ', `total ${rentPanel.rows.length}`,
    `(+${rentPanel.added} new, ${rentPanel.updated} amended)`);
  console.log('\nRun this monthly. Rentals refresh on the 15th; sales on Tuesdays and Fridays.');
}

main().catch(error => {
  console.error('\ncollection failed:', error.message);
  console.error('Nothing was written. Fix the cause and re-run — a partial panel is worse than none.');
  process.exit(1);
});
