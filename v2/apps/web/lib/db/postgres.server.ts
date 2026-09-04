import 'server-only';

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null | undefined;
export const PUBLIC_CONTENT_READ_TIMEOUT_MS = 750;

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
    fetchOptions: { signal: AbortSignal.timeout(8_000) },
  });
  return client;
}

export function publicContentDatabase(): NeonQueryFunction<false, false> | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  return neon(connectionString, {
    fetchOptions: { signal: AbortSignal.timeout(PUBLIC_CONTENT_READ_TIMEOUT_MS) },
  });
}
