export const runtime = 'nodejs';
export const maxDuration = 30;

// First release: Tokyo's 23 wards, 2024–2026, one quarter per request.
// This read-only endpoint does not create building identities or write to Neon.
const source = 'https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001';
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_RECORDS = 2000;
function json(body: unknown, status = 200) {
  return Response.json(body, {status, headers: {
    'cache-control': status === 200 ? 'public, max-age=300, s-maxage=86400' : 'no-store',
    'x-content-type-options': 'nosniff',
  }});
}
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 300) : '';
}
function positiveNumber(value: unknown): number | null {
  const label = text(value);
  if (!/^\d+(\.\d+)?$/.test(label)) return null;
  const number = Number(label);
  return Number.isFinite(number) && number > 0 && number <= Number.MAX_SAFE_INTEGER ? number : null;
}
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const entries = [...query.entries()];
  const city = query.get('city') ?? '13103';
  const year = query.get('year') ?? '2025';
  const quarter = query.get('quarter') ?? '4';
  if (entries.some(([key]) => !['city', 'year', 'quarter'].includes(key) || query.getAll(key).length !== 1)
    || !/^131(0[1-9]|1[0-9]|2[0-3])$/.test(city)
    || !/^(2024|2025|2026)$/.test(year) || !/^[1-4]$/.test(quarter)) {
    return json({error: 'invalid_query'}, 400);
  }
  const apiKey = process.env.SIGNEDPRICE_REINFOLIB_API_KEY?.trim();
  if (!apiKey) return json({error: 'source_not_configured'}, 503);
  const url = new URL(source);
  url.search = new URLSearchParams({city, year, quarter, language: 'en', priceClassification: '01'}).toString();
  try {
    const options: RequestInit & {next: {revalidate: number}} = {
      headers: {'Ocp-Apim-Subscription-Key': apiKey, Accept: 'application/json'},
      redirect: 'error', signal: AbortSignal.timeout(20000),
      next: {revalidate: 86400},
    };
    const response = await fetch(url, options);
    if (!response.ok || !response.body) return json({error: 'source_unavailable'}, 502);
    // Bound the decoded payload, including when the provider uses gzip.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let payload = '';
    let bytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > MAX_BYTES) {
          await reader.cancel();
          return json({error: 'source_response_too_large'}, 502);
        }
        payload += decoder.decode(part.value, {stream: true});
      }
      payload += decoder.decode();
    } finally { reader.releaseLock(); }
    const body = JSON.parse(payload);
    if (body?.status !== 'OK' || !Array.isArray(body.data)
      || body.data.some((row: unknown) => !row || typeof row !== 'object' || Array.isArray(row))) {
      return json({error: 'source_invalid'}, 502);
    }
    const records = body.data.slice(0, MAX_RECORDS).map((row: Record<string, unknown>, index: number) => ({
      // Response-local row reference only; identical disclosed rows can be distinct transactions.
      rowReference: city + '-' + year + '-Q' + quarter + '-' + (index + 1),
      type: text(row.Type), municipalityCode: text(row.MunicipalityCode),
      municipality: text(row.Municipality), district: text(row.DistrictName),
      price: positiveNumber(row.TradePrice), currency: 'JPY',
      areaSqm: positiveNumber(row.Area), areaLabel: text(row.Area),
      floorPlan: text(row.FloorPlan), buildingYear: text(row.BuildingYear),
      structure: text(row.Structure), period: text(row.Period),
      priceCategory: text(row.PriceCategory),
    }));
    return json({
      market: 'jp-tokyo', source: 'MLIT Real Estate Information Library · XIT001',
      sourceUrl: url.toString(), retrievedAt: new Date().toISOString(),
      query: {city, year, quarter, priceClassification: '01', language: 'en'},
      identityPrecision: 'anonymized_transaction', periodPrecision: 'quarter',
      totalSourceRecords: body.data.length, returnedRecords: records.length,
      truncated: body.data.length > MAX_RECORDS, records,
      limitations: ['Building names, exact addresses and unit identities are not supplied.',
        'Area and price values retain the precision disclosed by the provider.',
        'These are recorded transactions, not available listings.'],
    });
  } catch {
    return json({error: 'source_unavailable'}, 502);
  }
}
