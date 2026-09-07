import 'server-only';
import { z } from 'zod';
import snapshot from '../../data/dubai-project-evidence.json';
import type { DubaiEvidenceContext } from './evidence-repository.server';
import type { DubaiProjectEvidence } from './project-evidence';

const schema = z.object({
  id: z.string().min(1), projectNumber: z.string().min(1), areaSlug: z.string().min(1),
  name: z.string().min(1), housing: z.enum(['apartment', 'villa']), stage: z.enum(['ready', 'off-plan']),
  n: z.number().int().min(30), medianPriceAed: z.number().finite().positive(),
  medianPricePerSqmAed: z.number().finite().positive(),
});
const parsed = z.array(schema).safeParse(snapshot.projects);

export function dubaiProjectEvidenceForContext(context: DubaiEvidenceContext): readonly DubaiProjectEvidence[] {
  if (context.displayState !== 'published' || context.dataDigest !== snapshot.parentDataDigest
    || context.comparisonPeriod.from !== snapshot.comparisonPeriod.from
    || context.comparisonPeriod.to !== snapshot.comparisonPeriod.to || !parsed.success) return [];
  return parsed.data;
}
