/**
 * URA Data Service client.
 *
 * Two things about this API shape the code below.
 *
 * 1. The AccessKey alone does not authorise a data call. It buys a Token that
 *    is good for the day, and every data request carries BOTH headers. So the
 *    client keeps a token in memory and refreshes it when the Singapore date
 *    rolls over — not the server's local date, since that is what URA's day
 *    boundary follows.
 *
 * 2. The API answers HTTP 200 with a Status field. A failed call still returns
 *    200, so an empty Result is ambiguous unless Status is read. We learned the
 *    same lesson the hard way on the MOLIT collection: treating "empty" as "no
 *    data" hid a half-empty pull for hours. Here a non-Success Status is an
 *    error, never an empty list.
 *
 * The AccessKey is read from the environment and never returned to a caller.
 */

const TOKEN_URL = 'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1';
const DATA_URL = 'https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1';

/** Undocumented but load-bearing in practice: URA rejects requests with no UA. */
const USER_AGENT = 'signedprice/1.0 (+https://signedprice.com)';

export type UraService =
  | 'PMI_Resi_Transaction'
  | 'PMI_Resi_Rental'
  | 'PMI_Resi_Rental_Median'
  | 'PMI_Resi_Developer_Sales'
  | 'PMI_Resi_Pipeline';

type ParamRule =
  | { readonly param: null }
  | { readonly param: string; readonly pattern: RegExp; readonly hint: string };

/**
 * Only these services are reachable through the proxy. An open passthrough
 * would let anyone spend our daily quota on endpoints we do not use.
 *
 * Note the two refPeriod formats are NOT the same: rentals are yyqq, developer
 * sales are mmyy. Mixing them silently returns nothing.
 */
export const URA_SERVICES: Record<UraService, ParamRule> = {
  PMI_Resi_Transaction: { param: 'batch', pattern: /^[1-4]$/, hint: '1-4 (postal district batch)' },
  PMI_Resi_Rental: { param: 'refPeriod', pattern: /^\d{2}q[1-4]$/, hint: 'yyqq, e.g. 25q2' },
  PMI_Resi_Rental_Median: { param: null },
  PMI_Resi_Developer_Sales: {
    param: 'refPeriod',
    pattern: /^(0[1-9]|1[0-2])\d{2}$/,
    hint: 'mmyy, e.g. 0925',
  },
  PMI_Resi_Pipeline: { param: null },
};

export function isUraService(value: string): value is UraService {
  return Object.prototype.hasOwnProperty.call(URA_SERVICES, value);
}

export interface ParamCheck {
  readonly ok: boolean;
  readonly reason?: string;
}

export function checkParam(service: UraService, value: string | null): ParamCheck {
  const rule = URA_SERVICES[service];

  if (rule.param === null) {
    return value ? { ok: false, reason: `${service} takes no parameter` } : { ok: true };
  }
  if (!value) {
    return { ok: false, reason: `${service} requires ${rule.param} (${rule.hint})` };
  }
  if (!rule.pattern.test(value)) {
    return { ok: false, reason: `${rule.param} must be ${rule.hint}` };
  }
  return { ok: true };
}

/** The date URA's daily token is scoped to. */
export function singaporeDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export class UraError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = 'UraError';
  }
}

// One token per day, shared across requests on this instance. The in-flight
// promise is cached too, so a burst of requests at midnight mints one token
// rather than one per request.
let cached: { date: string; token: string } | null = null;
let inFlight: Promise<string> | null = null;

async function mintToken(accessKey: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    headers: { AccessKey: accessKey, 'User-Agent': USER_AGENT },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new UraError('URA token request failed', 502, response.status);
  }

  const body = (await response.json()) as { Status?: string; Result?: unknown; Message?: string };
  if (body.Status !== 'Success' || typeof body.Result !== 'string' || !body.Result) {
    throw new UraError(body.Message || 'URA refused to issue a token', 502, response.status);
  }

  return body.Result;
}

export async function getToken(accessKey: string, force = false): Promise<string> {
  const today = singaporeDate();

  if (!force && cached && cached.date === today) return cached.token;
  if (!force && inFlight) return inFlight;

  inFlight = mintToken(accessKey)
    .then((token) => {
      cached = { date: today, token };
      return token;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test seam — resets the module-level token cache. */
export function resetTokenCache(): void {
  cached = null;
  inFlight = null;
}

export interface UraResult {
  readonly result: unknown;
  readonly count: number | null;
}

async function callOnce(
  accessKey: string,
  token: string,
  service: UraService,
  value: string | null,
): Promise<UraResult> {
  const url = new URL(DATA_URL);
  url.searchParams.set('service', service);

  const rule = URA_SERVICES[service];
  if (rule.param !== null && value) url.searchParams.set(rule.param, value);

  const response = await fetch(url, {
    headers: { AccessKey: accessKey, Token: token, 'User-Agent': USER_AGENT },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new UraError('URA data request failed', 502, response.status);
  }

  const body = (await response.json()) as { Status?: string; Result?: unknown; Message?: string };

  // A failure arrives as HTTP 200 with a Status field. Reading only Result
  // would turn "rejected" into "no rows", which is the wrong thing to be
  // unable to tell apart.
  if (body.Status !== 'Success') {
    throw new UraError(body.Message || `URA returned status ${body.Status}`, 502, response.status);
  }

  const result = body.Result ?? [];
  return { result, count: Array.isArray(result) ? result.length : null };
}

export async function fetchUra(
  accessKey: string,
  service: UraService,
  value: string | null,
): Promise<UraResult> {
  const token = await getToken(accessKey);

  try {
    return await callOnce(accessKey, token, service, value);
  } catch (error) {
    // A token can stop working before the day is out — an instance that woke
    // with a stale cache, or a token URA invalidated. One forced refresh
    // distinguishes that from a genuinely broken request.
    if (error instanceof UraError && error.upstreamStatus !== undefined) {
      const fresh = await getToken(accessKey, true);
      return callOnce(accessKey, fresh, service, value);
    }
    throw error;
  }
}
