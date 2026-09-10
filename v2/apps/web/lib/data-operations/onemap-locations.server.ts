import 'server-only';

import { createHash, randomUUID } from 'node:crypto';

import type { SqlPort } from '../evidence-pool/repository.server';

const SOURCE = 'sg-onemap-building';
const AUTH_ENDPOINT = 'https://www.onemap.gov.sg/api/auth/post/getToken';
const SEARCH_ENDPOINT = 'https://www.onemap.gov.sg/api/common/elastic/search';
const SEARCH_SOURCE_URL = 'https://www.onemap.gov.sg/apidocs/search';
const RIGHTS_POLICY = 'sg-onemap-search-v1';
const PROVIDER = 'OneMap';
const MAX_RESPONSE_BYTES = 512_000;

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const normalizedIdentity = (value: string) => value.normalize('NFKC').toLocaleUpperCase('en-SG').replace(/[^A-Z0-9]+/g, '');

const STREET_ABBREVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  AVE: 'AVENUE',
  CRES: 'CRESCENT',
  CL: 'CLOSE',
  CTRL: 'CENTRAL',
  DR: 'DRIVE',
  HWY: 'HIGHWAY',
  JLN: 'JALAN',
  LOR: 'LORONG',
  NTH: 'NORTH',
  PK: 'PARK',
  PL: 'PLACE',
  RD: 'ROAD',
  STH: 'SOUTH',
  TER: 'TERRACE',
  UPP: 'UPPER',
});

export function canonicalOneMapStreet(value: string): string {
  const tokens = value.normalize('NFKC').toLocaleUpperCase('en-SG').replace(/[^A-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  return tokens.map((token, index) => {
    if (token === 'ST' && index > 0 && /^\d/.test(tokens[index + 1] ?? '')) return 'STREET';
    return STREET_ABBREVIATIONS[token] ?? token;
  }).join(' ');
}

type OneMapCredentials = Readonly<{
  email?: string;
  password?: string;
  token?: string;
}>;

type HdbLocationTarget = Readonly<{
  providerKey: string;
  entityId: string;
  block: string;
  street: string;
  previousHash: string | null;
}>;

type SafeOneMapResult = Readonly<{
  searchValue: string | null;
  block: string;
  roadName: string;
  building: string | null;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}>;

type ExactLocation = Readonly<{
  status: 'exact';
  resultCount: number;
  bytes: number;
  candidate: Readonly<{
    id: string;
    providerKey: string;
    contentHash: string;
    entityId: string;
    block: string;
    street: string;
    addressText: string;
    postalCode: string | null;
    latitude: number;
    longitude: number;
    rawResult: SafeOneMapResult;
    fetchedAt: string;
  }>;
}>;

type LocationOutcome = ExactLocation | Readonly<{
  status: 'no_result' | 'ambiguous' | 'error';
  resultCount: number;
  bytes: number;
  error: string | null;
}>;

type SelectedLocationOutcome = Omit<ExactLocation, 'bytes'> | Readonly<{
  status: 'no_result' | 'ambiguous';
  resultCount: number;
  error: string | null;
}>;

async function boundedText(response: Response, maximum = MAX_RESPONSE_BYTES): Promise<{ text: string; bytes: number }> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maximum) throw new Error('provider_response_too_large');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('provider_empty_response');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > maximum) {
      await reader.cancel();
      throw new Error('provider_response_too_large');
    }
    chunks.push(chunk.value);
  }
  return { text: Buffer.concat(chunks).toString('utf8'), bytes };
}

function safeProviderError(error: unknown): string {
  if (error instanceof Error && /^(provider_|invalid_|runtime_credential_|lease_)/.test(error.message)) return error.message;
  return 'provider_request_failed';
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('provider_invalid_json');
  }
}

function stringField(value: unknown, maximum: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const result = String(value).trim();
  return result !== '' && result.length <= maximum ? result : null;
}

function coordinate(value: unknown, minimum: number, maximum: number): number | null {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function safeResult(value: unknown): SafeOneMapResult | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  const block = stringField(row.BLK_NO, 40);
  const roadName = stringField(row.ROAD_NAME, 240);
  const address = stringField(row.ADDRESS, 500);
  const latitude = coordinate(row.LATITUDE, 1.15, 1.5);
  const longitude = coordinate(row.LONGITUDE, 103.55, 104.1);
  if (block === null || roadName === null || address === null || latitude === null || longitude === null) return null;
  const postal = stringField(row.POSTAL, 20);
  return Object.freeze({
    searchValue: stringField(row.SEARCHVAL, 500),
    block,
    roadName,
    building: stringField(row.BUILDING, 500),
    address,
    postalCode: postal && /^\d{6}$/.test(postal) ? postal : null,
    latitude,
    longitude,
  });
}

export function selectOneMapLocationCandidate(
  target: Omit<HdbLocationTarget, 'previousHash'>,
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): SelectedLocationOutcome {
  if (typeof payload !== 'object' || payload === null || !Array.isArray((payload as { results?: unknown }).results)) {
    throw new Error('provider_invalid_envelope');
  }
  const rawResults = (payload as { results: unknown[] }).results;
  if (rawResults.length > 100) throw new Error('provider_result_limit_exceeded');
  const exact = rawResults.map(safeResult).filter((row): row is SafeOneMapResult => row !== null)
    .filter((row) => normalizedIdentity(row.block) === normalizedIdentity(target.block)
      && canonicalOneMapStreet(row.roadName) === canonicalOneMapStreet(target.street));
  const distinct = new Map(exact.map((row) => [JSON.stringify(row), row]));
  if (distinct.size === 0) return { status: 'no_result', resultCount: rawResults.length, error: null };
  if (distinct.size !== 1) return { status: 'ambiguous', resultCount: distinct.size, error: null };
  const rawResult = [...distinct.values()][0]!;
  const identity = JSON.stringify(rawResult);
  return {
    status: 'exact',
    resultCount: rawResults.length,
    candidate: {
      id: randomUUID(),
      providerKey: target.providerKey,
      contentHash: digest(identity),
      entityId: target.entityId,
      block: target.block,
      street: target.street,
      addressText: rawResult.address,
      postalCode: rawResult.postalCode,
      latitude: rawResult.latitude,
      longitude: rawResult.longitude,
      rawResult,
      fetchedAt,
    },
  };
}

export async function requestOneMapToken(
  fetcher: typeof fetch = fetch,
  credentials: OneMapCredentials = {
    email: process.env.ONEMAP_EMAIL,
    password: process.env.ONEMAP_EMAIL_PASSWORD,
    token: process.env.ONEMAP_TOKEN,
  },
): Promise<string> {
  const email = credentials.email?.trim();
  const password = credentials.password?.trim();
  if ((!email || !password) && credentials.token?.trim()) return credentials.token.trim();
  if (!email || !password) throw new Error('runtime_credential_unavailable');
  let response: Response;
  try {
    response = await fetcher(AUTH_ENDPOINT, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error('provider_auth_transport');
  }
  if (!response.ok) throw new Error(`provider_auth_http_${response.status}`);
  const { text } = await boundedText(response, 32_000);
  const payload = parseJson(text) as { access_token?: unknown; expiry_timestamp?: unknown };
  const token = stringField(payload.access_token, 8_000);
  if (!token || token.length < 16) throw new Error('provider_auth_invalid_response');
  if (payload.expiry_timestamp !== undefined && payload.expiry_timestamp !== null) {
    const rawExpiry = payload.expiry_timestamp;
    const numeric = typeof rawExpiry === 'number' || /^\d+$/.test(String(rawExpiry)) ? Number(rawExpiry) : Number.NaN;
    const expiry = Number.isFinite(numeric)
      ? new Date(numeric < 10_000_000_000 ? numeric * 1_000 : numeric)
      : new Date(String(rawExpiry));
    if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now() + 300_000) throw new Error('provider_auth_expired_token');
  }
  return token;
}

export async function fetchOneMapLocation(
  target: Omit<HdbLocationTarget, 'previousHash'>,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<LocationOutcome> {
  const fetchPage = async (page: number) => {
    const query = new URLSearchParams({
      searchVal: `${target.block} ${target.street}`,
      returnGeom: 'Y',
      getAddrDetails: 'Y',
      pageNum: String(page),
    });
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetcher(`${SEARCH_ENDPOINT}?${query}`, {
          cache: 'no-store',
          redirect: 'error',
          headers: { Authorization: token },
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        if (attempt === 2) throw new Error('provider_search_transport');
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
      if (response.ok) break;
      if (response.status === 429) throw new Error('provider_rate_limited');
      if (response.status < 500) throw new Error(`provider_search_http_${response.status}`);
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
    if (!response?.ok) throw new Error(`provider_search_http_${response?.status ?? 'failed'}`);
    const bounded = await boundedText(response);
    const payload = parseJson(bounded.text);
    if (typeof payload !== 'object' || payload === null || !Array.isArray((payload as { results?: unknown }).results)) {
      throw new Error('provider_invalid_envelope');
    }
    const rawPages = (payload as Record<string, unknown>).totalNumPages;
    const totalPages = typeof rawPages === 'number' || /^\d+$/.test(String(rawPages)) ? Number(rawPages) : Number.NaN;
    const rawPage = (payload as Record<string, unknown>).pageNum;
    const returnedPage = typeof rawPage === 'number' || /^\d+$/.test(String(rawPage)) ? Number(rawPage) : page;
    if (!Number.isInteger(totalPages) || totalPages < 0 || returnedPage !== page) throw new Error('provider_invalid_envelope');
    return { payload: payload as { results: unknown[] }, totalPages, bytes: bounded.bytes };
  };
  const first = await fetchPage(1);
  if (first.totalPages > 10) return { status: 'ambiguous', resultCount: 100, bytes: first.bytes, error: 'provider_result_limit_exceeded' };
  const results = [...first.payload.results];
  let bytes = first.bytes;
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await fetchPage(page);
    if (next.totalPages !== first.totalPages) throw new Error('provider_total_changed');
    results.push(...next.payload.results);
    bytes += next.bytes;
  }
  return { ...selectOneMapLocationCandidate(target, { results }), bytes } as LocationOutcome;
}

type RunOptions = Readonly<{
  force?: boolean;
  limit?: number;
  fetcher?: typeof fetch;
  credentials?: OneMapCredentials;
}>;

function pacedFetcher(fetcher: typeof fetch, minimumIntervalMs: number): typeof fetch {
  if (minimumIntervalMs <= 0) return fetcher;
  let nextStart = 0;
  let queue = Promise.resolve();
  return (input, init) => {
    const request = queue.then(async () => {
      const wait = Math.max(0, nextStart - Date.now());
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      nextStart = Date.now() + minimumIntervalMs;
      return fetcher(input, init);
    });
    queue = request.then(() => undefined, () => undefined);
    return request;
  };
}

function targetFromRow(row: Record<string, unknown>): HdbLocationTarget | null {
  if (typeof row.provider_key !== 'string' || typeof row.entity_id !== 'string'
    || typeof row.block !== 'string' || typeof row.street !== 'string') return null;
  return {
    providerKey: row.provider_key,
    entityId: row.entity_id,
    block: row.block,
    street: row.street,
    previousHash: typeof row.previous_hash === 'string' ? row.previous_hash : null,
  };
}

export async function runOneMapLocationCollection(sql: SqlPort, options: RunOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const providerFetcher = pacedFetcher(fetcher, options.fetcher ? 0 : 550);
  const limit = Math.max(1, Math.min(250, options.limit ?? 100));
  await sql.query('INSERT INTO data_collection_state(source_id) VALUES($1) ON CONFLICT DO NOTHING', [SOURCE]);
  const leaseToken = randomUUID();
  const runId = randomUUID();
  const [lease] = await sql.query(`UPDATE data_collection_state
    SET lease_token=$2::uuid, lease_until=now()+interval '5 minutes', last_attempt_at=now()
    WHERE source_id=$1 AND (lease_until IS NULL OR lease_until<now())
      AND ($3::boolean OR next_due_at<=now()) RETURNING *`, [SOURCE, leaseToken, Boolean(options.force)]);
  if (!lease) return { sourceId: SOURCE, status: 'not_due_or_busy' };
  await sql.query(`WITH expired AS (
    UPDATE data_collection_runs SET status='failed',completed_at=now(),error_code='lease_expired'
    WHERE source_id=$2 AND status='running'
  ) INSERT INTO data_collection_runs(id,source_id,status) VALUES($1::uuid,$2,'running')`, [runId, SOURCE]);
  try {
    const rows = await sql.query(`SELECT current.provider_key,current.entity_id,current.block,current.street,
        pointer.content_hash AS previous_hash
      FROM hdb_building_current AS head
      INNER JOIN hdb_building_candidates AS current
        ON current.provider_key=head.provider_key AND current.content_hash=head.content_hash
      INNER JOIN property_entities AS entity ON entity.id=current.entity_id
      LEFT JOIN onemap_location_attempts AS attempt ON attempt.provider_key=current.provider_key
      LEFT JOIN onemap_location_current AS pointer ON pointer.provider_key=current.provider_key
      WHERE current.entity_id IS NOT NULL AND current.residential=true
        AND (attempt.next_due_at IS NULL OR attempt.next_due_at<=now())
        AND NOT EXISTS (
          SELECT 1 FROM public_entity_locations AS location
          WHERE location.entity_id=current.entity_id AND location.verification_status='verified'
            AND location.provider<>$2
        )
      ORDER BY coalesce(attempt.last_attempt_at,'-infinity'::timestamptz),current.provider_key
      LIMIT $1`, [limit, PROVIDER]);
    const targets = rows.map(targetFromRow).filter((target): target is HdbLocationTarget => target !== null);
    if (targets.length === 0) {
      const completed = await sql.query(`WITH owned AS MATERIALIZED (
        SELECT source_id FROM data_collection_state WHERE source_id=$1 AND lease_token=$2::uuid AND lease_until>now() FOR UPDATE
      ), done AS (
        UPDATE data_collection_state state SET last_success_at=now(),next_due_at=now()+interval '3 hours',
          consecutive_failures=0,last_error=NULL,anomaly=NULL,new_count=0,changed_count=0,lease_token=NULL,lease_until=NULL
        FROM owned WHERE state.source_id=owned.source_id RETURNING state.source_id
      ) UPDATE data_collection_runs SET status='unchanged',completed_at=now(),byte_count=0
        WHERE id=$3::uuid AND EXISTS(SELECT 1 FROM done) RETURNING id`, [SOURCE, leaseToken, runId]);
      if (!completed.length) throw new Error('lease_lost');
      return { sourceId: SOURCE, status: 'unchanged', attemptedCount: 0, newCount: 0, changedCount: 0, pendingCount: 0, exact: 0, noResult: 0, ambiguous: 0, errorCount: 0 };
    }
    const token = await requestOneMapToken(providerFetcher, options.credentials);
    const outcomes = new Array<{ target: HdbLocationTarget; outcome: LocationOutcome }>(targets.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < targets.length) {
        const index = cursor;
        cursor += 1;
        const target = targets[index]!;
        try {
          outcomes[index] = { target, outcome: await fetchOneMapLocation(target, token, providerFetcher) };
        } catch (error) {
          const code = safeProviderError(error);
          if (code === 'provider_rate_limited' || code === 'provider_search_http_401' || code === 'provider_search_http_403') throw error;
          outcomes[index] = { target, outcome: { status: 'error', resultCount: 0, bytes: 0, error: code } };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, targets.length) }, () => worker()));
    const exact = outcomes.filter((entry) => entry.outcome.status === 'exact') as Array<{ target: HdbLocationTarget; outcome: ExactLocation }>;
    const newCount = exact.filter(({ target }) => target.previousHash === null).length;
    const changedCount = exact.filter(({ target, outcome }) => target.previousHash !== null && target.previousHash !== outcome.candidate.contentHash).length;
    const candidates = exact.map(({ outcome }) => ({
      id: outcome.candidate.id,
      provider_key: outcome.candidate.providerKey,
      content_hash: outcome.candidate.contentHash,
      entity_id: outcome.candidate.entityId,
      block: outcome.candidate.block,
      street: outcome.candidate.street,
      address_text: outcome.candidate.addressText,
      postal_code: outcome.candidate.postalCode,
      latitude: outcome.candidate.latitude,
      longitude: outcome.candidate.longitude,
      raw_result: outcome.candidate.rawResult,
      fetched_at: outcome.candidate.fetchedAt,
    }));
    const attempts = outcomes.map(({ target, outcome }) => ({
      provider_key: target.providerKey,
      entity_id: target.entityId,
      status: outcome.status,
      result_count: outcome.resultCount,
      last_error: outcome.status === 'error' ? outcome.error : null,
      retry_days: outcome.status === 'error' ? 1 : 7,
    }));
    const byteCount = outcomes.reduce((sum, entry) => sum + entry.outcome.bytes, 0);
    const counts = {
      exact: exact.length,
      noResult: outcomes.filter(({ outcome }) => outcome.status === 'no_result').length,
      ambiguous: outcomes.filter(({ outcome }) => outcome.status === 'ambiguous').length,
      errorCount: outcomes.filter(({ outcome }) => outcome.status === 'error').length,
    };
    if (counts.errorCount === outcomes.length) throw new Error('provider_batch_failed');
    const batchHash = digest(outcomes.map(({ target, outcome }) => `${target.providerKey}:${outcome.status}:${outcome.status === 'exact' ? outcome.candidate.contentHash : outcome.error ?? ''}`).sort().join('\n'));
    const state = newCount > 0 && !lease.last_hash ? 'new' : newCount > 0 || changedCount > 0 ? 'changed' : 'unchanged';
    const anomaly = counts.errorCount > 0 ? `provider_errors:${counts.errorCount}` : counts.ambiguous > 0 ? `ambiguous_matches:${counts.ambiguous}` : null;
    const saved = await sql.query(`WITH owned AS MATERIALIZED (
        SELECT source_id FROM data_collection_state WHERE source_id=$1 AND lease_token=$2::uuid AND lease_until>now() FOR UPDATE
      ), candidates AS (
        INSERT INTO onemap_location_candidates(
          id,provider_key,content_hash,entity_id,block,street,address_text,postal_code,latitude,longitude,raw_result,fetched_at
        )
        SELECT row.id::uuid,row.provider_key,row.content_hash,row.entity_id,row.block,row.street,row.address_text,
          row.postal_code,row.latitude,row.longitude,row.raw_result,row.fetched_at::timestamptz
        FROM jsonb_to_recordset($3::jsonb) AS row(
          id text,provider_key text,content_hash text,entity_id text,block text,street text,address_text text,
          postal_code text,latitude double precision,longitude double precision,raw_result jsonb,fetched_at text
        ), owned ON CONFLICT(provider_key,content_hash) DO NOTHING RETURNING id
      ), pointers AS (
        INSERT INTO onemap_location_current(provider_key,content_hash)
        SELECT row.provider_key,row.content_hash
        FROM jsonb_to_recordset($3::jsonb) AS row(provider_key text,content_hash text), owned
        ON CONFLICT(provider_key) DO UPDATE SET content_hash=excluded.content_hash,last_seen_at=now()
        RETURNING provider_key
      ), attempts AS (
        INSERT INTO onemap_location_attempts(provider_key,entity_id,last_attempt_at,next_due_at,status,result_count,last_error)
        SELECT row.provider_key,row.entity_id,now(),now()+(row.retry_days*interval '1 day'),row.status,row.result_count,row.last_error
        FROM jsonb_to_recordset($4::jsonb) AS row(provider_key text,entity_id text,status text,result_count integer,last_error text,retry_days integer),owned
        ON CONFLICT(provider_key) DO UPDATE SET entity_id=excluded.entity_id,last_attempt_at=excluded.last_attempt_at,
          next_due_at=excluded.next_due_at,status=excluded.status,result_count=excluded.result_count,last_error=excluded.last_error
        RETURNING provider_key
      ), done AS (
        UPDATE data_collection_state state SET last_success_at=now(),next_due_at=now()+interval '3 hours',last_hash=$5,
          last_bytes=$6,consecutive_failures=0,last_error=NULL,anomaly=$7,new_count=$8,changed_count=$9,
          lease_token=NULL,lease_until=NULL
        FROM owned WHERE state.source_id=owned.source_id AND (SELECT count(*) FROM attempts)=$10 RETURNING state.source_id
      ) UPDATE data_collection_runs SET status=$11,completed_at=now(),byte_count=$6,anomaly=$7
        WHERE id=$12::uuid AND EXISTS(SELECT 1 FROM done) RETURNING id`, [
      SOURCE, leaseToken, JSON.stringify(candidates), JSON.stringify(attempts), batchHash, byteCount,
      anomaly, newCount, changedCount, targets.length, state, runId,
    ]);
    if (!saved.length) throw new Error('lease_lost');
    return { sourceId: SOURCE, status: state, attemptedCount: targets.length, newCount, changedCount, pendingCount: newCount + changedCount, ...counts, anomaly };
  } catch (error) {
    const code = safeProviderError(error);
    await sql.query(`WITH done AS (
      UPDATE data_collection_state SET consecutive_failures=consecutive_failures+1,last_error=$3,
        next_due_at=now()+least(24,power(2,least(consecutive_failures,5)))*interval '1 hour',lease_token=NULL,lease_until=NULL
      WHERE source_id=$1 AND lease_token=$2::uuid RETURNING source_id
    ) UPDATE data_collection_runs SET status='failed',completed_at=now(),error_code=$3
      WHERE id=$4::uuid`, [SOURCE, leaseToken, code, runId]);
    return { sourceId: SOURCE, status: 'failed', error: code };
  }
}

export type OneMapLocationCandidateItem = Readonly<{
  id: string;
  version: number;
  status: 'pending' | 'approved' | 'rejected';
  entityId: string;
  providerKey: string;
  block: string;
  street: string;
  addressText: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  rawResult: SafeOneMapResult;
  fetchedAt: string;
  sourceUrl: string;
  contentHash: string;
  isCurrent: boolean;
}>;

function timestamp(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function candidateItem(row: Record<string, unknown>): OneMapLocationCandidateItem {
  return {
    id: String(row.id),
    version: Number(row.version),
    status: row.status as OneMapLocationCandidateItem['status'],
    entityId: String(row.entity_id),
    block: String(row.block),
    street: String(row.street),
    addressText: String(row.address_text),
    postalCode: row.postal_code === null ? null : String(row.postal_code),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    rawResult: row.raw_result as SafeOneMapResult,
    fetchedAt: timestamp(row.fetched_at),
    sourceUrl: SEARCH_SOURCE_URL,
    providerKey: String(row.provider_key),
    contentHash: String(row.content_hash),
    isCurrent: Boolean(row.is_current),
  };
}

const REVIEW_SELECT = `SELECT candidate.*,
  EXISTS(SELECT 1 FROM onemap_location_current pointer
    WHERE pointer.provider_key=candidate.provider_key AND pointer.content_hash=candidate.content_hash) AS is_current
  FROM onemap_location_candidates AS candidate`;

export async function listOneMapLocationCandidates(sql: SqlPort, options: { page?: number; status?: string } = {}) {
  const page = options.page ?? 1;
  const status = options.status ?? 'pending';
  if (!Number.isInteger(page) || page < 1 || page > 10_000 || !['pending', 'approved', 'rejected', 'all'].includes(status)) throw new Error('invalid_filters');
  const [rows, totals] = await Promise.all([
    sql.query(`${REVIEW_SELECT} WHERE ($1='all' OR candidate.status=$1) ORDER BY candidate.fetched_at DESC,candidate.id LIMIT 25 OFFSET $2`, [status, (page - 1) * 25]),
    sql.query(`SELECT count(*)::int AS total FROM onemap_location_candidates WHERE ($1='all' OR status=$1)`, [status]),
  ]);
  return { items: rows.map(candidateItem), page, total: Number(totals[0]?.total ?? 0) };
}

export async function getOneMapLocationCandidate(sql: SqlPort, id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('invalid_id');
  const [row] = await sql.query(`${REVIEW_SELECT} WHERE candidate.id=$1::uuid`, [id]);
  if (!row) return null;
  const audit = await sql.query(`SELECT previous_version,next_version,previous_status,next_status,reason,actor,reviewed_at
    FROM onemap_location_review_audit WHERE candidate_id=$1::uuid ORDER BY reviewed_at DESC`, [id]);
  return { ...candidateItem(row), audit };
}

export async function reviewOneMapLocationCandidate(sql: SqlPort, input: {
  id: string;
  version: number;
  status: 'approved' | 'rejected';
  reason: string;
  actor: string;
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)
    || !Number.isInteger(input.version) || input.version < 1 || !['approved', 'rejected'].includes(input.status)
    || input.reason.trim().length < 3 || input.reason.length > 240 || !input.actor.trim() || input.actor.length > 200) {
    throw new Error('invalid_review');
  }
  const [row] = await sql.query(`WITH eligible AS MATERIALIZED (
      SELECT candidate.* FROM onemap_location_candidates AS candidate
      INNER JOIN property_entities AS entity ON entity.id=candidate.entity_id
      WHERE candidate.id=$1::uuid AND candidate.version=$2 AND candidate.status<>$3
        AND ($3='rejected' OR (
          EXISTS(SELECT 1 FROM onemap_location_current pointer
            WHERE pointer.provider_key=candidate.provider_key AND pointer.content_hash=candidate.content_hash)
          AND NOT EXISTS(SELECT 1 FROM public_entity_locations location
            WHERE location.entity_id=candidate.entity_id AND location.verification_status='verified' AND location.provider<>$7)
        ))
      FOR UPDATE OF candidate,entity
    ), location_written AS (
      INSERT INTO public_entity_locations(entity_id,market_id,latitude,longitude,precision,provider,
        provider_reference,rights_policy_id,verification_status,verified_at,updated_at)
      SELECT entity_id,'sg-singapore',latitude,longitude,'street',$7,content_hash,$8,'verified',now(),now()
      FROM eligible WHERE $3='approved'
        AND EXISTS(SELECT 1 FROM rights_policies rights WHERE rights.id=$8
          AND rights.can_store AND rights.can_display AND rights.can_use_commercially)
      ON CONFLICT(entity_id) WHERE verification_status='verified' DO UPDATE SET
        market_id=excluded.market_id,latitude=excluded.latitude,longitude=excluded.longitude,precision=excluded.precision,
        provider=excluded.provider,provider_reference=excluded.provider_reference,rights_policy_id=excluded.rights_policy_id,
        verification_status='verified',verified_at=now(),updated_at=now()
      WHERE public_entity_locations.provider=$7
      RETURNING entity_id,latitude,longitude,provider_reference
    ), changed AS (
      UPDATE onemap_location_candidates candidate SET status=$3,version=candidate.version+1
      FROM eligible WHERE candidate.id=eligible.id
        AND ($3='rejected' OR EXISTS(SELECT 1 FROM location_written)) RETURNING candidate.*
    ), audit AS (
      INSERT INTO onemap_location_review_audit(id,candidate_id,previous_version,next_version,previous_status,next_status,reason,actor)
      SELECT $6::uuid,changed.id,eligible.version,changed.version,eligible.status,changed.status,$4,$5
      FROM changed INNER JOIN eligible ON eligible.id=changed.id RETURNING candidate_id
    ), entity_written AS (
      UPDATE property_entities entity SET latitude=location.latitude,longitude=location.longitude,
        local_attributes=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(entity.local_attributes,
          '{locationPrecision}','\"street\"'::jsonb,true),'{locationProvider}',to_jsonb($7::text),true),
          '{locationProviderReference}',to_jsonb(location.provider_reference),true),
          '{locationRightsPolicyId}',to_jsonb($8::text),true),'{locationVerificationStatus}','\"verified\"'::jsonb,true),
        updated_at=now()
      FROM location_written location,changed,audit
      WHERE entity.id=location.entity_id AND changed.id=audit.candidate_id RETURNING entity.id
    ), withdrawn AS (
      DELETE FROM public_entity_locations location USING changed,audit
      WHERE $3='rejected' AND changed.id=audit.candidate_id AND location.entity_id=changed.entity_id
        AND location.provider=$7 AND location.provider_reference=changed.content_hash RETURNING location.entity_id
    ), entity_cleared AS (
      UPDATE property_entities entity SET latitude=NULL,longitude=NULL,
        local_attributes=entity.local_attributes-'locationPrecision'-'locationProvider'-'locationProviderReference'
          -'locationRightsPolicyId'-'locationVerificationStatus',updated_at=now()
      FROM withdrawn,changed WHERE entity.id=withdrawn.entity_id AND entity.id=changed.entity_id
        AND entity.local_attributes->>'locationProvider'=$7
        AND entity.local_attributes->>'locationProviderReference'=changed.content_hash RETURNING entity.id
    ) SELECT changed.id,changed.version,changed.status,changed.entity_id,
        EXISTS(SELECT 1 FROM entity_written) AS published,EXISTS(SELECT 1 FROM entity_cleared) AS withdrawn
      FROM changed INNER JOIN audit ON audit.candidate_id=changed.id`, [
    input.id, input.version, input.status, input.reason.trim(), input.actor.trim(), randomUUID(), PROVIDER, RIGHTS_POLICY,
  ]);
  return row ? {
    id: String(row.id),
    version: Number(row.version),
    status: String(row.status),
    entityId: String(row.entity_id),
    published: Boolean(row.published),
    withdrawn: Boolean(row.withdrawn),
  } : null;
}
