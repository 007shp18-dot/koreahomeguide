import 'server-only';

import { buildNewsIndexModel, type NewsRouteDependencies } from './news-route-model.server';
import type { NewsCardModel } from './news-card-model';

export type { NewsCardModel } from './news-card-model';

export function buildNewsCardModels(
  dependencies?: NewsRouteDependencies,
  limit = 2,
): readonly NewsCardModel[] {
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 10) return Object.freeze([]);
  try {
    return Object.freeze(buildNewsIndexModel(dependencies).records.slice(0, limit).map((record) => (
      Object.freeze({
        id: record.id,
        title: record.title,
        summary: record.summary,
        href: `/kr/seoul/news/${record.slug}/` as const,
        publishedAt: record.publishedAt,
        evidenceStatus: record.evidence.status,
        evidenceLine: record.evidence.line,
      })
    )));
  } catch {
    return Object.freeze([]);
  }
}
