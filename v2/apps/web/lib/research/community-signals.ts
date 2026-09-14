import { z } from 'zod';
import seoul from '../../content/property-reviews/community-seoul.json';
import singapore from '../../content/property-reviews/community-singapore.json';
import dubai from '../../content/property-reviews/community-dubai.json';
import tokyo from '../../content/property-reviews/community-tokyo.json';
import type { MarketLocale } from '../locale/market-localization';
import type { DecisionPersona } from './property-decision';
import type { PropertyReview } from './property-review';
import { allReviewLocations } from './property-review-locations';

const text = z.object({ ko: z.string().trim().min(1), en: z.string().trim().min(1), 'zh-CN': z.string().trim().min(1) });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a real calendar date; leave an unknown publication date null');
const knownProfileIds = new Set(allReviewLocations().map(location => location.reviewId));

/** Public discussions identify useful questions, not verified defects, a
 * representative survey or a source for numerical property ratings. */
export const communitySignalSchema = z.object({
  id: z.string().trim().min(1),
  marketId: z.enum(['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo']),
  profileIds: z.array(z.string().trim().min(1)),
  areaKeys: z.array(z.string().trim().min(1)),
  personas: z.array(z.enum(['family', 'couple', 'investor'])).min(1),
  title: text,
  body: text,
  visitQuestion: text,
  sources: z.array(z.object({
    url: z.url().refine(value => value.startsWith('https://'), 'Use the inspected HTTPS source URL'),
    title: z.string().trim().min(1),
    publishedOn: day.nullable(),
    inspectedOn: day,
    context: z.string().trim().min(1),
    scope: z.enum(['individual-experience', 'public-discussion']),
  })).min(1),
  evidenceKind: z.literal('community-anecdote'),
  mappingScope: z.enum(['named-property', 'area-context', 'comparable-setting']),
}).superRefine((signal, context) => {
  if (!signal.profileIds.length && !signal.areaKeys.length) context.addIssue({ code: 'custom', message: 'A signal needs a supported property or exact area mapping' });
  const marketPrefix = signal.marketId.split('-')[0] + '-';
  if (signal.profileIds.some(id => !id.startsWith(marketPrefix))) context.addIssue({ code: 'custom', message: 'A community signal cannot cross market identities' });
  if (signal.profileIds.some(id => !knownProfileIds.has(id))) context.addIssue({ code: 'custom', message: 'Community profile mappings must exist in the verified property catalogue' });
  if (new Set(signal.profileIds).size !== signal.profileIds.length || new Set(signal.areaKeys).size !== signal.areaKeys.length) context.addIssue({ code: 'custom', message: 'Duplicate scope identities' });
  for (const source of signal.sources) {
    if (source.publishedOn && source.publishedOn > source.inspectedOn) context.addIssue({ code: 'custom', message: 'A source cannot be inspected before its publication date' });
  }
});

export type CommunitySignal = z.infer<typeof communitySignalSchema>;
export type CommunityCheck = {
  id: string;
  title: string;
  body: string;
  question: string;
  evidenceKind: 'community-anecdote';
};

const signals = [...seoul, ...singapore, ...dubai, ...tokyo].map(value => communitySignalSchema.parse(value));
if (new Set(signals.map(signal => signal.id)).size !== signals.length) throw new Error('Duplicate community signal identities');

/** Retained for editorial verification; consumers render localized questions,
 * not the source URLs or the researcher's notes. */
export function communityEvidenceRecords(): readonly CommunitySignal[] { return signals; }

/** Exact identity matching avoids introducing another neighbourhood's issue.
 * An area report already carries namespaced evidence for its verified examples;
 * use those property IDs instead of substring matching the area name. */
export function selectCommunitySignals(
  rows: readonly CommunitySignal[],
  review: PropertyReview,
  persona: DecisionPersona,
  analysisScope: 'property' | 'area' = 'property',
): CommunitySignal[] {
  const areaPrefix = `area-${review.marketId}-`;
  const areaKey = analysisScope === 'area' && review.id.startsWith(areaPrefix) ? review.id.slice(areaPrefix.length) : null;
  const profiles = new Set(analysisScope === 'area'
    ? review.sources.flatMap(source => source.id.includes('::') ? [source.id.slice(0, source.id.indexOf('::'))] : [])
    : [review.id]);
  const ranked = rows.filter(signal => signal.marketId === review.marketId && signal.personas.includes(persona)
    && (signal.profileIds.some(id => profiles.has(id)) || (areaKey !== null && signal.areaKeys.includes(areaKey))))
    .map((signal, index) => ({ signal, index,
      evidenceRank: signal.mappingScope === 'named-property' ? 0 : signal.mappingScope === 'area-context' ? 1 : 2,
      scopeSize: signal.profileIds.some(id => profiles.has(id)) ? signal.profileIds.length : Number.POSITIVE_INFINITY }))
    // Prefer the more specific supported scope. This is an editorial selection
    // rule, not a popularity score or a count of residents with an experience.
    .sort((a, b) => a.evidenceRank - b.evidenceRank || a.scopeSize - b.scopeSize || a.index - b.index);
  const selected: CommunitySignal[] = [];
  const identities = new Set<string>();
  for (const { signal } of ranked) {
    if (identities.has(signal.id)) continue;
    selected.push(signal);
    identities.add(signal.id);
    if (selected.length === 3) break;
  }
  return selected;
}

export function getCommunitySignals(review: PropertyReview, persona: DecisionPersona, locale: MarketLocale, analysisScope: 'property' | 'area' = 'property'): CommunityCheck[] {
  return selectCommunitySignals(signals, review, persona, analysisScope).map(signal => ({
    id: signal.id, title: signal.title[locale], body: (signal.mappingScope === 'comparable-setting'
      ? ({ ko: '비슷한 입지의 경험을 이 후보와 대조해볼 질문입니다. ', en: 'Use this as a comparison with experience in a similar setting. ', 'zh-CN': '这是把相似环境的经验与当前候选房源作对照的问题。' }[locale]) : '') + signal.body[locale], question: signal.visitQuestion[locale],
    evidenceKind: signal.evidenceKind,
  }));
}
