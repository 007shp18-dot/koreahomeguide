import { contentDatabase } from '@/lib/db/postgres.server';
import { createPoolHandlers } from '@/lib/evidence-pool/handlers.server';
import { createPoolRepository } from '@/lib/evidence-pool/repository.server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const handlers = createPoolHandlers(() => {
  const sql = contentDatabase(); if (!sql) throw new Error('database_not_configured');
  return createPoolRepository({ query: (statement, parameters) => sql.query(statement, parameters) });
});
export const GET = handlers.GET;
export const POST = handlers.POST;
