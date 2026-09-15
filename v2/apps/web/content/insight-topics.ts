export const INSIGHT_TOPICS = ['all', 'budget', 'prices', 'investment', 'neighborhood', 'policy'] as const;
export type InsightTopic = typeof INSIGHT_TOPICS[number];
export function isInsightTopic(value: unknown): value is InsightTopic {
  return typeof value === 'string' && (INSIGHT_TOPICS as readonly string[]).includes(value);
}
