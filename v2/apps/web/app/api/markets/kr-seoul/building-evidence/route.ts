import { createKoreaBuildingEvidenceResponse } from '@/lib/public-market/korea-explorer-evidence.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  return createKoreaBuildingEvidenceResponse(
    koreaEvidenceRepositoriesFromEnvironment(),
    request,
  );
}
