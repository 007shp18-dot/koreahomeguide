import 'server-only';
import type { SingaporeSnapshotRepository } from './snapshot-repository.server';

export function isSingaporeProjectIndexable(repository: SingaporeSnapshotRepository, area: string, projectId: string): boolean {
  const project = repository.getProject(area, projectId);
  return project !== null && project.published && project.n >= repository.getContext().publicationMinimum
    && repository.listProjectRecords(area, projectId).length >= repository.getContext().publicationMinimum;
}
