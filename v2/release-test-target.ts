export type ReleaseTestEnvironment = Readonly<
  Record<string, string | undefined>
>;

export type ReleaseTestTarget = {
  readonly baseURL: string;
  readonly expectedCommit: string;
  readonly expectedEnvironment:
    | 'production'
    | 'preview'
    | 'development'
    | 'local';
  readonly usesExternalServer: boolean;
};

const localTarget = {
  baseURL: 'http://127.0.0.1:3100',
  expectedCommit: '0123456789abcdef',
  expectedEnvironment: 'preview',
} as const;

const allowedEnvironments = new Set([
  'production',
  'preview',
  'development',
  'local',
]);

function parseBaseURL(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('PLAYWRIGHT_BASE_URL must be a valid http(s) URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PLAYWRIGHT_BASE_URL must use http or https');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(
      'PLAYWRIGHT_BASE_URL must be an origin without credentials, path, query, or hash',
    );
  }

  return url.origin;
}

function parseCommit(value: string | undefined, required: boolean): string {
  if (value === undefined || value.trim() === '') {
    if (required) {
      throw new Error(
        'PLAYWRIGHT_EXPECTED_COMMIT_SHA is required with PLAYWRIGHT_BASE_URL',
      );
    }
    return localTarget.expectedCommit;
  }

  const candidate = value.trim().toLowerCase();
  if (!/^[0-9a-f]{6,64}$/.test(candidate)) {
    throw new Error(
      'PLAYWRIGHT_EXPECTED_COMMIT_SHA must be a 6–64 character hexadecimal commit',
    );
  }
  return candidate;
}

function parseEnvironment(
  value: string | undefined,
  required: boolean,
): ReleaseTestTarget['expectedEnvironment'] {
  if (value === undefined || value.trim() === '') {
    if (required) {
      throw new Error(
        'PLAYWRIGHT_EXPECTED_ENVIRONMENT is required with PLAYWRIGHT_BASE_URL',
      );
    }
    return localTarget.expectedEnvironment;
  }

  const candidate = value.trim().toLowerCase();
  if (!allowedEnvironments.has(candidate)) {
    throw new Error('PLAYWRIGHT_EXPECTED_ENVIRONMENT is not an allowed environment');
  }
  return candidate as ReleaseTestTarget['expectedEnvironment'];
}

export function resolveReleaseTestTarget(
  environment: ReleaseTestEnvironment = process.env,
): ReleaseTestTarget {
  const explicitBaseURL = environment.PLAYWRIGHT_BASE_URL?.trim();
  const usesExternalServer = Boolean(explicitBaseURL);

  return {
    baseURL: usesExternalServer
      ? parseBaseURL(explicitBaseURL!)
      : localTarget.baseURL,
    expectedCommit: parseCommit(
      environment.PLAYWRIGHT_EXPECTED_COMMIT_SHA,
      usesExternalServer,
    ),
    expectedEnvironment: parseEnvironment(
      environment.PLAYWRIGHT_EXPECTED_ENVIRONMENT,
      usesExternalServer,
    ),
    usesExternalServer,
  };
}
