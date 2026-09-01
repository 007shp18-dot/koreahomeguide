import { redactUraDiagnostic, type UraCredential } from './credential.ts';

export const URA_TOKEN_URL = 'https://www.ura.gov.sg/uraDataService/insertNewToken.action';
export const URA_DATA_URL = 'https://www.ura.gov.sg/uraDataService/invokeUraDS';
export const URA_PRIVATE_SALE_SERVICE = 'PMI_Resi_Transaction';

export type UraFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type UraClientErrorCode =
  | 'authentication'
  | 'quota'
  | 'timeout'
  | 'provider'
  | 'schema'
  | 'incomplete_batch';

export class UraClientError extends Error {
  readonly name = 'UraClientError';
  readonly publicMessage = 'URA provider request failed.' as const;
  readonly code: UraClientErrorCode;

  constructor(code: UraClientErrorCode) {
    super(redactUraDiagnostic(code));
    this.code = code;
  }
}

export type UraClient = Readonly<{
  fetchPrivateResidentialTransactions(): Promise<readonly unknown[]>;
}>;

type UraClientOptions = UraCredential & Readonly<{
  fetch?: UraFetch;
  now?: () => number;
  timeoutMs?: number;
}>;

const TRANSIENT_STATUSES = new Set([502, 503, 504]);
const ENVELOPE_KEYS = ['Message', 'Result', 'Status'] as const;

function errorForStatus(status: number): UraClientError {
  if (status === 401 || status === 403) return new UraClientError('authentication');
  if (status === 429) return new UraClientError('quota');
  return new UraClientError('provider');
}

function envelopeResult(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new UraClientError('schema');
  }
  const envelope = value as Record<string, unknown>;
  const keys = Object.keys(envelope).sort();
  if (keys.length !== ENVELOPE_KEYS.length
    || keys.some((key, index) => key !== [...ENVELOPE_KEYS].sort()[index])
    || envelope.Status !== 'Success'
    || typeof envelope.Message !== 'string') {
    throw new UraClientError('schema');
  }
  return envelope.Result;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
    || (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError');
}

export function createUraClient(options: UraClientOptions): UraClient {
  const fetchImpl: UraFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 8_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('URA timeout is invalid.');

  async function requestJson(url: string, headers: Readonly<Record<string, string>>): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
          cache: 'no-store',
        });
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          if (!response.ok) throw errorForStatus(response.status);
          throw new UraClientError('schema');
        }
        if (response.ok) return body;
        if (attempt === 0 && TRANSIENT_STATUSES.has(response.status)) continue;
        throw errorForStatus(response.status);
      } catch (error) {
        if (error instanceof UraClientError) throw error;
        if (isAbort(error) || controller.signal.aborted) throw new UraClientError('timeout');
        throw new UraClientError('provider');
      } finally {
        clearTimeout(timer);
      }
    }
    throw new UraClientError('provider');
  }

  return Object.freeze({
    async fetchPrivateResidentialTransactions(): Promise<readonly unknown[]> {
      const tokenEnvelope = await requestJson(URA_TOKEN_URL, { AccessKey: options.accessKey });
      const token = envelopeResult(tokenEnvelope);
      if (typeof token !== 'string' || token.trim().length === 0) {
        throw new UraClientError('schema');
      }

      const batches: unknown[] = [];
      for (let batch = 1; batch <= 4; batch += 1) {
        const url = `${URA_DATA_URL}?service=${URA_PRIVATE_SALE_SERVICE}&batch=${batch}`;
        const envelope = await requestJson(url, { AccessKey: options.accessKey, Token: token });
        const result = envelopeResult(envelope);
        if (!Array.isArray(result) || result.length === 0) {
          throw new UraClientError('incomplete_batch');
        }
        batches.push(envelope);
      }
      return Object.freeze(batches);
    },
  });
}
