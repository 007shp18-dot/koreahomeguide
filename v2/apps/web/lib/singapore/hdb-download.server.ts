import 'server-only';

export const HDB_DATASETS = Object.freeze({
  resale: 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc',
  rental: 'd_c9f57187485a850908655db0e8cfe651',
  property: 'd_17f5382f26140b1fdae0ba2ef6239d2f',
} as const);

export type HdbDataset = keyof typeof HDB_DATASETS;
export type HdbFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

const API_ROOT = 'https://api-open.data.gov.sg/v1/public/api/datasets';
const MAX_BYTES = 32 * 1024 * 1024;

function unavailable(): never {
  throw new Error('HDB dataset unavailable.');
}

function trustedDownloadUrl(value: unknown): URL {
  if (typeof value !== 'string') unavailable();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    unavailable();
  }
  const trusted = url.protocol === 'https:'
    && (url.hostname === 'data.gov.sg'
      || url.hostname.endsWith('.data.gov.sg')
      || url.hostname === 'amazonaws.com'
      || url.hostname.endsWith('.amazonaws.com'));
  if (!trusted || url.username !== '' || url.password !== '') unavailable();
  return url;
}

async function downloadUrl(response: Response): Promise<URL | null> {
  if (!response.ok) unavailable();
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    unavailable();
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) unavailable();
  const data = (payload as Record<string, unknown>).data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) unavailable();
  const value = (data as Record<string, unknown>).url;
  return value === undefined ? null : trustedDownloadUrl(value);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function downloadHdbCsv(
  dataset: HdbDataset,
  fetchImpl: HdbFetch = globalThis.fetch,
): Promise<Readonly<{ dataset: HdbDataset; csv: string }>> {
  const datasetId = HDB_DATASETS[dataset];
  if (datasetId === undefined) unavailable();
  const base = `${API_ROOT}/${datasetId}`;
  let url = await downloadUrl(await fetchImpl(`${base}/poll-download`, { cache: 'no-store' }));
  if (url === null) {
    await downloadUrl(await fetchImpl(`${base}/initiate-download`, { cache: 'no-store' }));
    for (let attempt = 0; attempt < 3 && url === null; attempt += 1) {
      if (attempt > 0) await wait(250);
      url = await downloadUrl(await fetchImpl(`${base}/poll-download`, { cache: 'no-store' }));
    }
  }
  if (url === null) unavailable();
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response.ok) unavailable();
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) unavailable();
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) unavailable();
  let csv: string;
  try {
    csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    unavailable();
  }
  return Object.freeze({ dataset, csv });
}
