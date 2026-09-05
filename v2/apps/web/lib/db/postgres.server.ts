import 'server-only';

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null | undefined;
export const PUBLIC_CONTENT_READ_TIMEOUT_MS = 3_000;

export function contentDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function contentDatabase(): NeonQueryFunction<false, false> | null {
  if (client !== undefined) return client;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    client = null;
    return client;
  }
  client = neon(connectionString, {
    // Neon spreads these options when each HTTP request starts. A signal created
    // here once would permanently poison the cached client after eight seconds.
    fetchOptions: { get signal() { return AbortSignal.timeout(8_000); } },
  });
  return client;
}

export function publicContentDatabase(): NeonQueryFunction<false, false> | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  return neon(connectionString, {
    fetchOptions: { get signal() { return AbortSignal.timeout(PUBLIC_CONTENT_READ_TIMEOUT_MS); } },
  });
}

