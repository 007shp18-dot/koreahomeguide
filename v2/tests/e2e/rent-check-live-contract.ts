import {
  requestRentCheck,
  type RentCheckApiSuccess,
  type RentCheckInput,
} from '../../apps/web/lib/rent-check/client-state';

export type CapturedRentCheckResponse = {
  readonly body: unknown;
  readonly headers: Readonly<Record<string, string>>;
  readonly status: number;
};

const FORBIDDEN_KEY = /^(?:api[-_]?key|service[-_]?key|secret|token|password|credential|raw[-_]?endpoint|endpoint[-_]?url|provider[-_]?url|host|hostname|url)$/i;
const FORBIDDEN_VALUE = /(?:https?:\/\/|apis\.data\.go\.kr|data\.go\.kr)/i;

function containsForbiddenPublicData(value: unknown): boolean {
  if (typeof value === 'string') return FORBIDDEN_VALUE.test(value);
  if (Array.isArray(value)) return value.some(containsForbiddenPublicData);
  if (value === null || typeof value !== 'object') return false;

  return Object.entries(value).some(([key, child]) =>
    FORBIDDEN_KEY.test(key) || containsForbiddenPublicData(child));
}

function monthIndex(value: string): number | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (match === null) return null;
  return Number(match[1]) * 12 + Number(match[2]);
}

function currentSeoulYearMonth(now: Date): { readonly month: number; readonly year: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).formatToParts(now).map((part) => [part.type, part.value]),
  );
  return { month: Number(parts.month), year: Number(parts.year) };
}

export function previousCompletedSeoulMonth(now: Date): string {
  const current = currentSeoulYearMonth(now);
  const previousIndex = current.year * 12 + current.month - 2;
  const year = Math.floor(previousIndex / 12);
  const month = previousIndex % 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export async function validateLiveRentCheckResponse(
  input: RentCheckInput,
  response: CapturedRentCheckResponse,
  options: {
    readonly now?: () => Date;
    readonly requiredCacheStatus?: RentCheckApiSuccess['cacheStatus'];
  } = {},
): Promise<RentCheckApiSuccess> {
  if (containsForbiddenPublicData(response.body)) {
    throw new Error('public payload contains forbidden key or value');
  }

  const headers = new Headers(response.headers);
  if (response.status !== 200 || headers.get('Cache-Control') !== 'private, no-store') {
    throw new Error('live response must be HTTP 200 with private, no-store');
  }

  let validated: RentCheckApiSuccess;
  try {
    validated = await requestRentCheck(input, {
      fetch: async () => Response.json(response.body, {
        status: response.status,
        headers,
      }),
    });
  } catch (error) {
    throw new Error('response does not satisfy complete public rent-check schema', {
      cause: error,
    });
  }

  if (options.requiredCacheStatus !== undefined &&
    validated.cacheStatus !== options.requiredCacheStatus) {
    throw new Error(
      `cold live proof requires X-Signedprice-Cache: ${options.requiredCacheStatus}`,
    );
  }

  const coverageMonth = validated.envelope.coverage.coverageThroughMonth;
  if (monthIndex(coverageMonth) === null ||
    coverageMonth !== previousCompletedSeoulMonth(options.now?.() ?? new Date())) {
    throw new Error('coverageThroughMonth must equal the immediately previous Seoul month');
  }

  return validated;
}
