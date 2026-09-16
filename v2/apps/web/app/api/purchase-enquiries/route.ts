import { contentDatabase } from '@/lib/db/postgres.server';
import { adminSecret } from '@/lib/evidence-pool/auth.server';
import { createEnquiryHandler } from '@/lib/operator/enquiry-handler.server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const POST = createEnquiryHandler(() => ({ db: contentDatabase(), secret: adminSecret() }));
