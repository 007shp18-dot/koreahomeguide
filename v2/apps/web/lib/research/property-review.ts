import { z } from 'zod';

const bilingual = z.object({ ko: z.string().trim().min(1), en: z.string().trim().min(1) });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const point = z.object({
  title: bilingual, body: bilingual, sourceIds: z.array(z.string()).min(1),
  status: z.enum(['documented', 'interpretation', 'needs-check']),
});
export const propertyReviewSchema = z.object({
  id: z.string(), marketId: z.enum(['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo']),
  name: bilingual, area: bilingual, checkedOn: date,
  verdict: bilingual, summary: bilingual, bestFor: bilingual, holdFor: bilingual,
  strengths: z.array(point).min(1), tradeoffs: z.array(point).min(1),
  sections: z.object({ transport: z.array(point).min(1), schools: z.array(point).min(1), daily: z.array(point).min(1), costs: z.array(point).min(1) }),
  comparisons: z.array(z.object({ name: bilingual, reason: bilingual, condition: bilingual })),
  sources: z.array(z.object({
    id: z.string(), title: z.string(), url: z.url().refine(url => url.startsWith('https://')),
    checkedOn: date, publishedOn: z.string().nullable(),
    kind: z.enum(['official', 'portal', 'editorial', 'video-companion', 'public-review']), note: bilingual,
  })).min(1),
}).superRefine((review, ctx) => {
  const ids = new Set(review.sources.map(s => s.id));
  if (ids.size !== review.sources.length) ctx.addIssue({ code: 'custom', message: 'Duplicate source identities' });
  for (const p of [...review.strengths, ...review.tradeoffs, ...Object.values(review.sections).flat()]) {
    if (p.sourceIds.some(id => !ids.has(id))) ctx.addIssue({ code: 'custom', message: 'Unresolved review evidence' });
  }
});
export type PropertyReview = z.infer<typeof propertyReviewSchema>;
export type ReviewPoint = z.infer<typeof point>;
export type ReviewText = z.infer<typeof bilingual>;
