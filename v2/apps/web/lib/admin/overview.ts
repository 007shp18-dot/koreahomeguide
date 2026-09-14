export const adminCities = [
  { id: 'all', label: '전체 도시', prefix: '' },
  { id: 'seoul', label: '서울', prefix: 'kr-seoul' },
  { id: 'singapore', label: '싱가포르', prefix: 'sg-private' },
  { id: 'dubai', label: '두바이', prefix: 'ae-dubai' },
  { id: 'tokyo', label: '도쿄', prefix: 'jp-tokyo' },
] as const;
export type AdminCity = typeof adminCities[number]['id'];
export type OverviewIssue = { market: string; quality: string; count: number };
export type OverviewArticle = { slug: string; title: string; locale: string; market: string; state: string };
export type OverviewJob = { job: string; state: string | null; lastAttemptAt: string | null; lastSuccessAt: string | null; received: number; inserted: number; updated: number; unlinked: number; anomaly: string | null };
export type AdminOverview = {
  city: AdminCity; refreshedAt: string;
  jobs: OverviewJob[] | null;
  issues: OverviewIssue[] | null;
  editorial: { total: number; articles: OverviewArticle[] } | null;
  unavailable: string[];
};
export function overviewTotals(data: AdminOverview) {
  const completed = data.jobs?.filter(job => job.state === 'succeeded') ?? null;
  return {
    succeeded: completed?.length ?? null,
    stored: completed?.reduce((sum, job) => sum + job.inserted + job.updated, 0) ?? null,
    pending: data.issues?.reduce((sum, issue) => sum + issue.count, 0) ?? null,
    articles: data.editorial?.total ?? null,
  };
}
