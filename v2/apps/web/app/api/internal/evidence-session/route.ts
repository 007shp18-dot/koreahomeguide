import { createSessionHandlers } from '@/lib/evidence-pool/handlers.server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const handlers = createSessionHandlers();
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
