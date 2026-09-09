import { cookies } from 'next/headers';
import { EvidenceAdmin } from '@/components/evidence-admin/workspace';
import { adminSecret, SESSION_COOKIE, verifySession } from '@/lib/evidence-pool/auth.server';
export const dynamic = 'force-dynamic';
export default async function EvidenceAdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  return <EvidenceAdmin initialAuthenticated={verifySession(token, adminSecret())} />;
}
