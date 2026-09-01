import 'server-only';

import type { NewsEvidenceClaim } from '../../lib/news/news-evidence.server';

const AREA_V2_ARTIFACT_ID = 'kr-seoul:2026-01/2026-07:area:v2';

export const KR_SEOUL_NEWS_CLAIMS_BY_ID: Readonly<
  Record<string, readonly NewsEvidenceClaim[]>
> = Object.freeze({
  'kr-seoul-coverage-2026-08-31': Object.freeze([
    Object.freeze({
      kind: 'district-count',
      artifactId: AREA_V2_ARTIFACT_ID,
      expected: 25,
    }),
  ]),
  'kr-seoul-method-2026-08-31': Object.freeze([]),
});
