import type { NewsEvidenceStatus } from './news-schema';

export type NewsCardModel = Readonly<{
  id: string;
  title: string;
  summary: string;
  href: `/kr/seoul/news/${string}/`;
  publishedAt: string;
  evidenceStatus: NewsEvidenceStatus;
  evidenceLine: string;
}>;
