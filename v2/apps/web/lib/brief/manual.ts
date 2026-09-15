import { z } from 'zod';
const evidence = { source: z.url(), queriedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) };
const text = z.object({ ko: z.string().min(1), en: z.string().min(1) });
export const manualBuildingSchema = z.object({
  commute: z.array(z.object({ to: text, route: text, transfers: z.number().int().nonnegative(), minutes: z.number().positive(), ...evidence })).default([]),
  schools: z.array(z.object({ name: text, level: text, distanceM: z.number().nonnegative().optional(), ...evidence })).default([]),
  residents: z.object({
    reviewCount: z.number().int().positive(), readAt: z.string().regex(/^\d{4}-\d{2}$/), sourceLabel: text,
    items: z.array(z.object({
      topic: z.enum(['parking', 'noise', 'fees', 'maintenance', 'facilities', 'walking']), text,
      mentions: z.number().int().nonnegative(),
      verified: z.object({ value: z.number().nonnegative(), unit: z.string().min(1), ...evidence }).optional(),
    })).refine(items => new Set(items.map(item => item.topic)).size === items.length, 'One item per topic'),
  }).optional(),
});
export type ManualBuilding = z.infer<typeof manualBuildingSchema>;
/** Repeated observations only. An unsupported numerical assertion is withheld in full. */
export function repeatedResidentItems(manual: ManualBuilding) {
  return manual.residents?.items.filter(item => item.mentions >= 2 && item.mentions <= manual.residents!.reviewCount
    && (item.verified || !/[0-9]/.test(`${item.text.ko} ${item.text.en}`))) ?? [];
}
